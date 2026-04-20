'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useCreateCipItem } from '../../hooks/use-cip-queries';
import { toast } from '@/hooks/use-toast';
import type { ScreeningResult, ActionPriority } from '../../lib/types';

const cipFormSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  severity: z.number().min(1).max(10),
  occurrence: z.number().min(1).max(10),
  detection: z.number().min(1).max(10),
  assigned_engineer: z.string().optional(),
});

type CipFormValues = z.infer<typeof cipFormSchema>;

interface CreateCipDialogProps {
  result: ScreeningResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function computeAP(s: number, o: number, d: number): { rpn: number; priority: ActionPriority } {
  const rpn = s * o * d;
  const priority: ActionPriority =
    rpn > 200 ? 'HIGH' :
    rpn > 80 ? 'MEDIUM' :
    'LOW';
  return { rpn, priority };
}

function apColor(priority: ActionPriority) {
  return {
    HIGH: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  }[priority];
}

function RangeSlider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-headline text-sm font-bold tabular-nums text-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-2 w-full cursor-pointer appearance-none rounded-full bg-muted',
          '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
        )}
      />
      <div className="flex justify-between text-[0.6rem] text-muted-foreground/60">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

export function CreateCipDialog({ result, open, onOpenChange }: CreateCipDialogProps) {
  const createCipMutation = useCreateCipItem();

  const suggestedOccurrence = useMemo(() => {
    if (!result) return 5;
    const change = result.call_count_avg > 0
      ? (result.call_count - result.call_count_avg) / result.call_count_avg
      : 0;
    if (change > 1) return 9;
    if (change > 0.5) return 7;
    if (change > 0.2) return 5;
    return 3;
  }, [result]);

  const form = useForm<CipFormValues>({
    resolver: zodResolver(cipFormSchema),
    defaultValues: {
      title: '',
      severity: 5,
      occurrence: suggestedOccurrence,
      detection: 5,
      assigned_engineer: '',
    },
  });

  useEffect(() => {
    if (result && open) {
      form.reset({
        title: `[${result.part_group_code}] 개선`,
        severity: 5,
        occurrence: suggestedOccurrence,
        detection: 5,
        assigned_engineer: '',
      });
    }
  }, [result, open, form, suggestedOccurrence]);

  const severity = form.watch('severity');
  const occurrence = form.watch('occurrence');
  const detection = form.watch('detection');
  const { rpn, priority } = computeAP(severity, occurrence, detection);

  const onSubmit = (values: CipFormValues) => {
    if (!result) return;

    createCipMutation.mutate(
      {
        title: values.title,
        model_code: result.model_code,
        customer_line_code: result.customer_line_code,
        target_part_group: result.part_group_code,
        severity: values.severity,
        occurrence: values.occurrence,
        detection: values.detection,
        action_priority: priority,
        assigned_engineer: values.assigned_engineer || null,
        assigned_manager: null,
        screening_result_id: result.id,
        stage: 'registered',
        journey_type: 'A',
        detected_at: new Date().toISOString(),
        registered_at: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast({ title: 'CIP 아이템 생성 완료', description: `${values.title}` });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: 'CIP 생성 실패', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
        },
      },
    );
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">CIP 아이템 생성</DialogTitle>
          <DialogDescription>
            {result.model_code} &times; {result.customer_line_code} &times; {result.part_group_code}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">제목</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-xl border border-outline-variant/20 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                RPN 평가
              </h4>

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RangeSlider
                        label="심각도 (Severity)"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RangeSlider
                        label="발생도 (Occurrence)"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detection"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RangeSlider
                        label="검출도 (Detection)"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                <div>
                  <span className="text-xs text-muted-foreground">RPN = S &times; O &times; D</span>
                  <div className="mt-0.5 font-headline text-lg font-bold tabular-nums text-foreground">
                    {rpn}
                  </div>
                </div>
                <span className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold', apColor(priority))}>
                  {priority}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="assigned_engineer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">담당 엔지니어</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="이름 입력" className="h-9 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-sm"
              >
                취소
              </Button>
              <Button type="submit" className="h-9 gap-1.5 text-sm" disabled={createCipMutation.isPending}>
                {createCipMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                생성
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
