import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { runScreening } from '@/features/strategy/lib/run-screening';

export async function POST(request: Request) {
  try {
    const { yearMonth } = await request.json();

    if (!yearMonth || !/^\d{6}$/.test(yearMonth)) {
      return NextResponse.json(
        { error: 'yearMonth must be format YYYYMM' },
        { status: 400 }
      );
    }

    // MV가 stale일 가능성에 대비해 스크리닝 직전에 refresh.
    // refresh가 실패하면 runScreening 내부에서 빈 MV 케이스를 진단 응답으로 처리한다.
    const supabase = createServiceClient();
    const { error: refreshError } = await supabase.rpc('refresh_all_materialized_views');
    if (refreshError) {
      console.warn('[screening] MV refresh failed (continuing):', refreshError.message);
    }

    const result = await runScreening(yearMonth);

    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Screening error:', errMsg);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: latest } = await supabase
      .from('screening_results')
      .select('year_month')
      .order('year_month', { ascending: false })
      .limit(1)
      .single();

    if (!latest) {
      return NextResponse.json({ yearMonth: null, results: [] });
    }

    const { data, error } = await supabase
      .from('screening_results')
      .select('*, screening_hints(*)')
      .eq('year_month', latest.year_month)
      .order('status', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ yearMonth: latest.year_month, results: data });
  } catch (error) {
    console.error('Screening fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    );
  }
}
