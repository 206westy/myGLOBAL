'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDecideOnCard } from '../../hooks/use-cip-queries';
import { toast } from '@/hooks/use-toast';
import type { DecisionAction, DecisionOption } from '../../lib/workflow-types';

function actionRequiresReason(action: DecisionAction): boolean {
  return 'reason' in action && (action.reason === undefined || action.reason === '');
}

function withReason(action: DecisionAction, reason: string): DecisionAction {
  if ('reason' in action) {
    return { ...action, reason } as DecisionAction;
  }
  return action;
}

export function DecisionButtons({
  options,
  recommendedAction,
}: {
  options: DecisionOption[];
  recommendedAction?: string;
}) {
  const decide = useDecideOnCard();
  const [pending, setPending] = useState<DecisionOption | null>(null);
  const [reason, setReason] = useState('');

  async function execute(option: DecisionOption, reasonOverride?: string) {
    const action = reasonOverride ? withReason(option.action, reasonOverride) : option.action;
    try {
      await decide.mutateAsync(action);
      toast({ title: 'Done', description: option.label });
    } catch (e) {
      toast({
        title: 'Failed',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      });
    } finally {
      setPending(null);
      setReason('');
    }
  }

  function onClick(option: DecisionOption) {
    const isAgainstRecommendation =
      recommendedAction && option.action.kind !== recommendedAction;
    const requiresReason = actionRequiresReason(option.action);

    if (isAgainstRecommendation || requiresReason) {
      setPending(option);
      return;
    }
    execute(option);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const isPrimary = opt.isPrimary || (recommendedAction && opt.action.kind === recommendedAction);
          return (
            <Button
              key={i}
              variant={isPrimary ? 'default' : (opt.variant ?? 'outline')}
              size="sm"
              onClick={() => onClick(opt)}
              disabled={decide.isPending}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Provide a reason for &ldquo;{pending?.label}&rdquo;.
            {recommendedAction && pending && pending.action.kind !== recommendedAction && (
              <span className="ml-1 text-amber-600">
                Differs from AI recommendation — your reason will be recorded.
              </span>
            )}
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., similar solution already deployed on adjacent line"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || decide.isPending}
              onClick={() => pending && execute(pending, reason.trim())}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
