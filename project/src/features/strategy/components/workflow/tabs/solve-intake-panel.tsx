'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ConversationTurn {
  q: string;
  q_type: 'choice' | 'text';
  choices?: string[];
  answer?: string;
}

interface NextResponse {
  sessionId: string;
  conversation: ConversationTurn[];
  nextQuestion: ConversationTurn | null;
  readyToFinalize: boolean;
  turnsRemaining: number;
  generatedBy: string;
}

interface FinalRecommendation {
  top_ccbs: Array<{ ccb_no?: string; title: string; score: number; reason: string }>;
  new_solution_draft?: string;
  triz_analysis?: { contradiction: string; principles: string[] } | null;
  decision_hint: 'apply_existing' | 'develop_new' | 'partial';
  explanation: string;
}

interface FinalizeResponse {
  sessionId: string;
  finalRecommendation: FinalRecommendation;
  candidates: Array<{ id: string; ccb_no: string; title: string; similarity: number }>;
  generatedBy: string;
}

const MAX_TURNS = 7;

export function SolveIntakePanel({
  cipId,
  cipNo,
  onClose,
}: {
  cipId: string;
  cipNo: string;
  onClose?: () => void;
}) {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [readyToFinalize, setReadyToFinalize] = useState(false);
  const [generatedBy, setGeneratedBy] = useState<string>('mock');
  const [textAnswer, setTextAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [final, setFinal] = useState<FinalizeResponse | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cipId]);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next', cipId }),
      });
      const data = (await res.json()) as NextResponse | { error: string };
      if ('error' in data) throw new Error(data.error);
      setSessionId(data.sessionId);
      setConversation(data.conversation);
      setReadyToFinalize(data.readyToFinalize);
      setGeneratedBy(data.generatedBy);
    } catch (e) {
      toast({ title: 'Intake start failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function answer(value: string) {
    if (!value.trim() || !sessionId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', cipId, sessionId, answer: value }),
      });
      const data = (await res.json()) as NextResponse | { error: string };
      if ('error' in data) throw new Error(data.error);
      setConversation(data.conversation);
      setReadyToFinalize(data.readyToFinalize);
      setGeneratedBy(data.generatedBy);
      setTextAnswer('');
    } catch (e) {
      toast({ title: 'Answer failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function finalize() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', sessionId }),
      });
      const data = (await res.json()) as FinalizeResponse | { error: string };
      if ('error' in data) throw new Error(data.error);
      setFinal(data);
      setGeneratedBy(data.generatedBy);
    } catch (e) {
      toast({ title: 'Finalize failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function decide(decision: 'apply_existing' | 'develop_new' | 'partial' | 'dismiss') {
    if (!sessionId) return;
    if (decision !== 'apply_existing' && !decisionReason.trim()) {
      toast({ title: 'Reason required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decide', sessionId, decision, reason: decisionReason || null }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Decision recorded', description: decision });
      qc.invalidateQueries({ queryKey: ['action-queue'] });
      qc.invalidateQueries({ queryKey: ['action-queue-counts'] });
      onClose?.();
    } catch (e) {
      toast({ title: 'Decision failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = conversation.filter((t) => t.answer).length;
  const currentQ = conversation[conversation.length - 1];
  const awaitingAnswer = currentQ && !currentQ.answer;
  const progress = Math.round((answeredCount / MAX_TURNS) * 100);

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-headline text-sm font-semibold tracking-tight">
            Solution intake — {cipNo}
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {generatedBy === 'openai_gpt54mini' ? 'OpenAI gpt-5.4-mini' : 'mock mode'}
        </span>
      </div>

      {/* Progress */}
      {!final && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Question {answeredCount + (awaitingAnswer ? 0 : 1)} of ~{MAX_TURNS}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Conversation */}
      {!final && (
        <div className="space-y-3">
          {conversation.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed-variant">
                  {i + 1}
                </span>
                <p className="text-sm">{turn.q}</p>
              </div>

              {turn.answer ? (
                <div className="ml-7 rounded-lg bg-surface-container-low px-3 py-2 text-xs">
                  {turn.answer}
                </div>
              ) : (
                <div className="ml-7 space-y-2">
                  {turn.q_type === 'choice' && turn.choices && (
                    <div className="flex flex-wrap gap-2">
                      {turn.choices.map((choice) => (
                        <Button
                          key={choice}
                          variant="outline"
                          size="sm"
                          onClick={() => answer(choice)}
                          disabled={loading}
                          className="text-xs"
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  )}
                  {turn.q_type === 'text' && (
                    <div className="flex items-end gap-2">
                      <Textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your answer…"
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => answer(textAnswer)}
                        disabled={loading || !textAnswer.trim()}
                      >
                        {loading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && conversation.length === 0 && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {readyToFinalize && !final && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="mb-2 text-xs text-muted-foreground">
                Enough information gathered. Generate final recommendation?
              </p>
              <Button onClick={finalize} disabled={loading} size="sm">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Synthesizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3.5 w-3.5" /> Generate recommendation
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Final recommendation */}
      {final && (
        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <div className="mb-1 flex items-center gap-2 font-headline font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" /> Recommendation ready
            </div>
            <p className="text-xs text-foreground/80">
              {final.finalRecommendation.explanation}
            </p>
          </div>

          {final.finalRecommendation.top_ccbs.length > 0 && (
            <div>
              <h4 className="mb-2 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top CCB candidates
              </h4>
              <div className="space-y-2">
                {final.finalRecommendation.top_ccbs.map((c, i) => (
                  <div key={i} className="rounded-lg border border-outline-variant/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        {c.ccb_no && <span className="font-mono text-xs text-muted-foreground mr-2">{c.ccb_no}</span>}
                        {c.title}
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {Math.round(c.score * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {final.finalRecommendation.triz_analysis && (
            <div className="rounded-lg border border-outline-variant/30 p-3">
              <h4 className="mb-1 font-headline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                TRIZ analysis
              </h4>
              <p className="text-xs">
                <span className="font-semibold">Contradiction:</span>{' '}
                {final.finalRecommendation.triz_analysis.contradiction}
              </p>
              <p className="mt-1 text-xs">
                <span className="font-semibold">Principles:</span>{' '}
                {final.finalRecommendation.triz_analysis.principles.join(', ')}
              </p>
            </div>
          )}

          {final.finalRecommendation.new_solution_draft && (
            <div className="rounded-lg border border-primary/20 bg-primary-fixed/30 p-3">
              <h4 className="mb-1 font-headline text-xs font-semibold uppercase tracking-wider text-on-primary-fixed-variant">
                New solution draft
              </h4>
              <p className="whitespace-pre-wrap text-xs">
                {final.finalRecommendation.new_solution_draft}
              </p>
            </div>
          )}

          {/* Manager decision */}
          <div className="rounded-lg border border-outline-variant/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="font-headline text-xs font-semibold">Manager decision</h4>
            </div>
            <Textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Reason (required for non-recommended actions)"
              rows={2}
              className="mb-2 text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => decide('apply_existing')}
                disabled={loading}
                className={cn(
                  final.finalRecommendation.decision_hint === 'apply_existing' && '!bg-primary',
                )}
              >
                Apply existing CCB
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide('develop_new')}
                disabled={loading}
              >
                Develop new
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide('partial')}
                disabled={loading}
              >
                Partial
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide('dismiss')}
                disabled={loading}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
