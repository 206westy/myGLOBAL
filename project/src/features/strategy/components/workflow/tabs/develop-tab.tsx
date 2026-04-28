'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, Inbox, FlaskConical, Calendar } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useActionQueue } from '../../../hooks/use-cip-queries';
import { EmptyQueue } from '../empty-queue';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface MilestoneEntry {
  name: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completed_at?: string | null;
}

function classifyMilestone(due: string, status: MilestoneEntry['status']): MilestoneEntry['status'] {
  if (status === 'completed') return 'completed';
  const days = differenceInCalendarDays(new Date(due), new Date());
  if (days < 0) return 'overdue';
  if (days <= 3) return 'in_progress';
  return status;
}

export function DevelopTab() {
  const { data, isLoading } = useActionQueue('develop');
  const qc = useQueryClient();
  const [activeCip, setActiveCip] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
  const [newName, setNewName] = useState('');
  const [newDue, setNewDue] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function openMilestones(cipId: string) {
    setActiveCip(cipId);
    const { data: row } = await supabase
      .from('cip_items')
      .select('lab_milestone')
      .eq('id', cipId)
      .single();
    const stored = (row?.lab_milestone ?? []) as MilestoneEntry[];
    setMilestones(
      stored.map((m) => ({ ...m, status: classifyMilestone(m.due_date, m.status) })),
    );
  }

  async function persist(next: MilestoneEntry[]) {
    if (!activeCip) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cip_items')
        .update({ lab_milestone: next })
        .eq('id', activeCip);
      if (error) throw error;
      setMilestones(next);
      toast({ title: 'Milestone updated' });
    } catch (e) {
      toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function addMilestone() {
    if (!newName.trim() || !newDue) return;
    const next: MilestoneEntry[] = [
      ...milestones,
      { name: newName.trim(), due_date: newDue, status: 'pending' },
    ];
    await persist(next);
    setNewName('');
    setNewDue('');
  }

  async function toggleComplete(idx: number) {
    const next = milestones.map((m, i) =>
      i === idx
        ? {
            ...m,
            status: m.status === 'completed' ? 'pending' : 'completed',
            completed_at: m.status === 'completed' ? null : new Date().toISOString(),
          }
        : m,
    ) as MilestoneEntry[];
    await persist(next);
  }

  async function escalate() {
    if (!activeCip || !escalationReason.trim()) return;
    setSaving(true);
    try {
      await supabase.from('cip_comments').insert({
        cip_id: activeCip,
        comment_type: 'escalation',
        content: escalationReason.trim(),
      });
      toast({ title: 'Escalation logged' });
      setEscalationReason('');
    } catch (e) {
      toast({ title: 'Escalation failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function advanceToValidate() {
    if (!activeCip) return;
    setSaving(true);
    try {
      const { data: cipBefore } = await supabase
        .from('cip_items')
        .select('stage')
        .eq('id', activeCip)
        .single();
      await supabase
        .from('cip_items')
        .update({ stage: 'testing' })
        .eq('id', activeCip);
      await supabase.from('cip_stage_history').insert({
        cip_id: activeCip,
        from_stage: cipBefore?.stage,
        to_stage: 'testing',
        reason: 'Lab response approved → Validate',
      });
      toast({ title: 'Advanced to Validate' });
      qc.invalidateQueries({ queryKey: ['action-queue'] });
      qc.invalidateQueries({ queryKey: ['action-queue-counts'] });
      setActiveCip(null);
    } catch (e) {
      toast({ title: 'Advance failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <EmptyQueue
          tabLabel="Develop"
          hint="No CIPs in lab handoff. Items advance here from Solve when an existing CCB doesn't apply."
        />
      </div>
    );
  }

  if (activeCip) {
    const card = data.find((d) => d.source_id === activeCip);
    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveCip(null)} className="text-xs">
          ← Back to Develop queue
        </Button>

        <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h3 className="mb-1 font-headline text-sm font-semibold tracking-tight">
            {card?.title ?? activeCip}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">{card?.context_line}</p>

          <h4 className="mb-2 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Milestones
          </h4>
          <div className="space-y-2">
            {milestones.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No milestones yet. Add the first one below.
              </p>
            )}
            {milestones.map((m, i) => {
              const isOverdue = m.status === 'overdue';
              const isImminent = m.status === 'in_progress';
              return (
                <div
                  key={i}
                  className={
                    'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ' +
                    (isOverdue
                      ? 'border-rose-200/60 bg-rose-50/40 dark:bg-rose-950/15'
                      : isImminent
                        ? 'border-primary/20 bg-primary-fixed/30'
                        : 'border-outline-variant/30')
                  }
                >
                  <input
                    type="checkbox"
                    checked={m.status === 'completed'}
                    onChange={() => toggleComplete(i)}
                    disabled={saving}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span
                    className={
                      'flex-1 ' + (m.status === 'completed' ? 'line-through text-muted-foreground' : '')
                    }
                  >
                    {m.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.due_date), 'yyyy-MM-dd')}
                  </span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Overdue
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Milestone name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., IQ complete, Prototype delivered"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Due date
              </label>
              <Input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={addMilestone}
              disabled={saving || !newName.trim() || !newDue}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h4 className="mb-2 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lab interaction
          </h4>
          <Textarea
            value={escalationReason}
            onChange={(e) => setEscalationReason(e.target.value)}
            placeholder="Escalation note, deadline renegotiation request, scope change…"
            rows={3}
            className="mb-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={escalate}
              disabled={saving || !escalationReason.trim()}
            >
              Log escalation
            </Button>
            <Button size="sm" onClick={advanceToValidate} disabled={saving}>
              Approve lab response → Validate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-fixed/40 px-4 py-3 text-sm text-on-primary-fixed-variant">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Lab milestone tracking</span> — set milestones, mark
          progress, escalate delays, approve lab response.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
        {data.map((row) => (
          <button
            key={row.card_id}
            type="button"
            onClick={() => openMilestones(row.source_id)}
            className="group rounded-2xl border border-outline-variant/30 bg-card p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {row.cip_no ?? row.step}
              </span>
              <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <h3 className="mb-1 line-clamp-2 font-headline text-sm font-semibold tracking-tight">
              {row.title}
            </h3>
            <p className="text-xs text-muted-foreground">{row.context_line}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
