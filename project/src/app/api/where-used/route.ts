/**
 * Where-used analysis: given a CIP target (model + part_group),
 * find equipment that could be candidates for the same fix.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cipId = searchParams.get('cipId');
    if (!cipId) {
      return NextResponse.json({ error: 'cipId required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: cip } = await supabase
      .from('cip_items')
      .select('model_code, customer_line_code, target_part_group, country_code')
      .eq('id', cipId)
      .single();
    if (!cip) return NextResponse.json({ error: 'cip not found' }, { status: 404 });

    if (!cip.model_code) {
      return NextResponse.json({ targets: [], count: 0, hint: 'CIP has no model_code' });
    }

    // Equipment that share the same model_code (and optionally the same part group via service orders)
    const { data: equipment } = await supabase
      .from('equipment')
      .select('equip_no, model_code, country_code, customer_line_code')
      .eq('model_code', cip.model_code)
      .limit(500);

    const all = equipment ?? [];

    // Build tier breakdown: same line, same country, other
    const sameLine = all.filter(
      (e) => cip.customer_line_code && e.customer_line_code === cip.customer_line_code,
    );
    const sameCountry = all.filter(
      (e) =>
        cip.country_code &&
        e.country_code === cip.country_code &&
        e.customer_line_code !== cip.customer_line_code,
    );
    const other = all.filter(
      (e) => !cip.country_code || e.country_code !== cip.country_code,
    );

    // Already scheduled targets (avoid re-scheduling)
    const { data: cipRow } = await supabase
      .from('cip_items')
      .select('rollout_id')
      .eq('id', cipId)
      .single();
    const rolloutId = cipRow?.rollout_id;

    let deployedSet = new Set<string>();
    if (rolloutId) {
      const { data: existing } = await supabase
        .from('cip_rollout_targets')
        .select('equip_no, status')
        .eq('rollout_id', rolloutId);
      deployedSet = new Set((existing ?? []).map((r) => r.equip_no));
    }

    const shape = (e: { equip_no: string; customer_line_code?: string | null; country_code?: string | null }, tier: string) => ({
      equip_no: e.equip_no,
      customer_line_code: e.customer_line_code,
      country_code: e.country_code,
      tier,
      already_deployed: deployedSet.has(e.equip_no),
    });

    const targets = [
      ...sameLine.map((e) => shape(e, 'same_line')),
      ...sameCountry.map((e) => shape(e, 'same_country')),
      ...other.slice(0, 50).map((e) => shape(e, 'other')),
    ];

    return NextResponse.json({
      targets,
      count: targets.length,
      breakdown: {
        same_line: sameLine.length,
        same_country: sameCountry.length,
        other: other.length,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cipId = String(body.cipId ?? '');
    const equipNos = (body.equipNos ?? []) as string[];
    if (!cipId || equipNos.length === 0) {
      return NextResponse.json({ error: 'cipId and equipNos required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get-or-create rollout for this CIP
    const { data: rolloutId, error: rolloutErr } = await supabase.rpc(
      'get_or_create_rollout_for_cip',
      { p_cip_id: cipId },
    );
    if (rolloutErr) throw rolloutErr;

    const { error } = await supabase.from('cip_rollout_targets').upsert(
      equipNos.map((equip_no) => ({
        rollout_id: rolloutId,
        equip_no,
        status: 'scheduled',
      })),
      { onConflict: 'rollout_id,equip_no' },
    );
    if (error) throw error;

    // Update total_target count on rollout
    const { count } = await supabase
      .from('cip_rollout_targets')
      .select('*', { count: 'exact', head: true })
      .eq('rollout_id', rolloutId);
    await supabase
      .from('cip_rollouts')
      .update({ total_target: count ?? 0 })
      .eq('id', rolloutId);

    return NextResponse.json({ ok: true, scheduled: equipNos.length, rolloutId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
