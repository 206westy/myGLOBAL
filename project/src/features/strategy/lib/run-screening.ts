import { createServiceClient } from '@/lib/supabase/server';
import {
  calculateCUSUM,
  calculateTrendSlope,
  calculateParetoRanks,
  detectReworkSpike,
  classifyStatus,
} from './anomaly-engine';

interface MVRow {
  model_code: string;
  customer_line_code: string;
  part_group_code: string;
  month: string;
  call_count: number;
  rework_count: number;
  rework_rate: number;
  avg_work_time_min: number;
  affected_equip_count: number;
}

interface ScreeningInput {
  key: string;
  modelCode: string;
  customerLineCode: string;
  partGroupCode: string;
  timeSeries: MVRow[];
}

export async function runScreening(targetYearMonth: string) {
  const supabase = createServiceClient();

  // 1. Fetch MV data
  // Supabase default limit=1000 — MV can have 10k+ rows, fetch all
  let allMvData: MVRow[] = [];
  let from = 0;
  const pageSize = 5000;
  while (true) {
    const { data: page, error: pageError } = await supabase
      .from('mv_monthly_part_stats')
      .select('*')
      .order('month', { ascending: true })
      .range(from, from + pageSize - 1);
    if (pageError) throw pageError;
    if (!page || page.length === 0) break;
    allMvData = allMvData.concat(page as MVRow[]);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  const mvData = allMvData;
  console.log(`[screening] MV data fetched: ${mvData.length} rows`);

  if (!mvData || mvData.length === 0) {
    const { count: soTotal } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    const hint = (soTotal ?? 0) === 0
      ? 'service_orders가 비어있습니다. SAP CSV를 임포트하세요.'
      : 'mv_monthly_part_stats가 비어있습니다. service_orders에 데이터는 있으나 work_start_date 또는 part_group_code가 모두 NULL이거나 MV refresh가 실패했을 수 있습니다.';
    return {
      processed: 0,
      results: [],
      diagnostic: {
        mvEmpty: true,
        serviceOrdersCount: soTotal ?? 0,
        hint,
      },
    };
  }

  // 2. Group by (model x line x part_group)
  const groups = new Map<string, ScreeningInput>();
  for (const row of mvData as MVRow[]) {
    const key = `${row.model_code}|${row.customer_line_code}|${row.part_group_code}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        modelCode: row.model_code,
        customerLineCode: row.customer_line_code,
        partGroupCode: row.part_group_code,
        timeSeries: [],
      });
    }
    groups.get(key)!.timeSeries.push(row);
  }

  // 3. Fetch previous screening results
  const { data: prevResults } = await supabase
    .from('screening_results')
    .select('model_code, customer_line_code, part_group_code, status, watch_since, pareto_rank')
    .order('year_month', { ascending: false });

  const prevMap = new Map<string, { status: string; watch_since: string | null }>();
  if (prevResults) {
    for (const r of prevResults) {
      const key = `${r.model_code}|${r.customer_line_code}|${r.part_group_code}`;
      if (!prevMap.has(key)) prevMap.set(key, { status: r.status, watch_since: r.watch_since });
    }
  }

  // 4. Run engine for each group
  console.log(`[screening] Total groups: ${groups.size}`);
  const results: Array<Record<string, unknown>> = [];
  let skippedShort = 0;
  let skippedLowCalls = 0;

  for (const [key, group] of groups) {
    const ts = group.timeSeries.sort((a, b) => a.month.localeCompare(b.month));

    if (ts.length < 6) { skippedShort++; continue; }
    const avgCalls = ts.reduce((s, r) => s + r.call_count, 0) / ts.length;
    if (avgCalls < 3) { skippedLowCalls++; continue; }

    const callCounts = ts.map(r => r.call_count);
    const latestRow = ts[ts.length - 1];
    const prevRow = ts.length >= 2 ? ts[ts.length - 2] : null;

    const cusum = calculateCUSUM(callCounts);
    const trend = calculateTrendSlope(callCounts.slice(-6));
    const reworkSpike = detectReworkSpike(
      latestRow.rework_rate,
      prevRow?.rework_rate ?? 0
    );

    const prev = prevMap.get(key);
    const verdict = classifyStatus({
      cusum,
      trend,
      reworkSpike,
      prevStatus: prev?.status ?? null,
      callCountValues: callCounts,
    });

    const callCountMean = callCounts.reduce((s, v) => s + v, 0) / callCounts.length;
    const callCountStd = callCounts.length > 1
      ? Math.sqrt(callCounts.reduce((s, v) => s + (v - callCountMean) ** 2, 0) / (callCounts.length - 1))
      : 0;

    const totalEquipCount = Math.max(
      ...ts.map(r => r.affected_equip_count),
      latestRow.affected_equip_count
    );

    results.push({
      year_month: targetYearMonth,
      model_code: group.modelCode,
      customer_line_code: group.customerLineCode,
      part_group_code: group.partGroupCode,
      status: verdict.status,
      prev_status: prev?.status ?? null,
      call_count: latestRow.call_count,
      call_count_avg: parseFloat(callCountMean.toFixed(2)),
      call_count_std: parseFloat(callCountStd.toFixed(2)),
      cusum_value: cusum.values.length > 0 ? parseFloat(cusum.values[cusum.values.length - 1].toFixed(2)) : 0,
      cusum_ucl: parseFloat(cusum.ucl.toFixed(2)),
      trend_slope: parseFloat(trend.slope.toFixed(4)),
      trend_p_value: parseFloat(trend.pValue.toFixed(4)),
      rework_rate: latestRow.rework_rate,
      rework_rate_prev: prevRow?.rework_rate ?? null,
      avg_work_time: latestRow.avg_work_time_min,
      pareto_rank: null,
      is_new_pareto: false,
      watch_since: verdict.status === 'watch' || verdict.status === 'alert'
        ? (prev?.watch_since ?? targetYearMonth)
        : null,
      affected_equip_count: latestRow.affected_equip_count,
      total_equip_count: totalEquipCount,
    });
  }

  // 5. Pareto analysis
  const paretoItems = calculateParetoRanks(
    results.map(r => ({
      key: `${r.model_code}|${r.customer_line_code}|${r.part_group_code}`,
      value: r.call_count as number,
    }))
  );

  const prevMonthPareto = new Set<string>();
  if (prevResults) {
    for (const r of prevResults) {
      if (r.pareto_rank && r.pareto_rank <= Math.ceil(prevResults.length * 0.2)) {
        prevMonthPareto.add(`${r.model_code}|${r.customer_line_code}|${r.part_group_code}`);
      }
    }
  }

  for (const pareto of paretoItems) {
    const result = results.find(r =>
      `${r.model_code}|${r.customer_line_code}|${r.part_group_code}` === pareto.key
    );
    if (result) {
      result.pareto_rank = pareto.rank;
      result.is_new_pareto = pareto.isTopGroup && !prevMonthPareto.has(pareto.key);
    }
  }

  // 6. Upsert results
  if (results.length > 0) {
    const { error: upsertError } = await supabase
      .from('screening_results')
      .upsert(results, { onConflict: 'year_month,model_code,customer_line_code,part_group_code' });

    if (upsertError) throw upsertError;
  }

  console.log(`[screening] Skipped: ${skippedShort} short, ${skippedLowCalls} low calls. Processed: ${results.length}`);

  return {
    processed: results.length,
    alerts: results.filter(r => r.status === 'alert').length,
    watches: results.filter(r => r.status === 'watch').length,
    resolved: results.filter(r => r.status === 'resolved').length,
    results,
  };
}
