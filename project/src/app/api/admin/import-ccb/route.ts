import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const CHUNK = 200;

interface CcbJsonlRow {
  ccb_no: string;
  title: string;
  content?: string;
  summary?: string;
  target_model?: string[];
  target_module?: string[];
  target_part_group?: string[];
  country_codes?: string[];
  solution_type?: string;
  action_plan?: string;
  verified?: boolean;
  verified_at?: string;
  old_part_no?: string;
  old_part_price?: number;
  new_part_no?: string;
  new_part_price?: number;
  source?: string;
}

function parseJsonl(text: string): CcbJsonlRow[] {
  const rows: CcbJsonlRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    try {
      rows.push(JSON.parse(line) as CcbJsonlRow);
    } catch {
      // skip malformed line; surface count to caller via response
    }
  }
  return rows;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let text: string;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      text = String(body.jsonl ?? '');
    } else {
      text = await request.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Empty body. Send JSONL text via { jsonl: "..." } or raw body.' },
        { status: 400 },
      );
    }

    const rows = parseJsonl(text);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid JSONL rows parsed' }, { status: 400 });
    }

    const invalid = rows.filter((r) => !r.ccb_no || !r.title);
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: `${invalid.length} row(s) missing ccb_no or title`,
          sampleInvalid: invalid.slice(0, 3),
        },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { data, error } = await supabase.rpc('upsert_ccb_documents_batch', {
        p_rows: chunk,
      });
      if (error) throw error;
      const result = (data ?? {}) as { inserted?: number; updated?: number };
      inserted += result.inserted ?? 0;
      updated += result.updated ?? 0;
    }

    return NextResponse.json({
      ok: true,
      received: rows.length,
      inserted,
      updated,
      embeddingsPending: inserted + updated,
      hint:
        'Embeddings are NULL. Run /api/admin/embed-ccb (P1-E) once OPENAI_API_KEY is configured to populate vector index.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ccb-import]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
