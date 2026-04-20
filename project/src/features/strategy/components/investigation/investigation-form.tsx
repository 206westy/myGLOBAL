'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, ImagePlus, Plus, X, ArrowDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useUpdateCipItem } from '../../hooks/use-cip-queries';
import type { CipItem, FieldConfirmed, InvestigationConclusion } from '../../lib/types';

const investigationSchema = z.object({
  field_confirmed: z.enum(['confirmed', 'not_confirmed', 'intermittent'], {
    required_error: '현상 발생 여부를 선택하세요',
  }),
  field_observation: z.string().min(1, '현장 관찰 내용을 입력하세요'),
  why_1: z.string().optional(),
  why_2: z.string().optional(),
  why_3: z.string().optional(),
  why_4: z.string().optional(),
  why_5: z.string().optional(),
  root_cause: z.string().min(1, '근본 원인을 입력하세요'),
  investigation_conclusion: z.enum(['confirmed', 'dismissed', 'needs_more'], {
    required_error: '결론을 선택하세요',
  }),
});

type InvestigationFormValues = z.infer<typeof investigationSchema>;

const CONFIRMED_OPTIONS: { value: FieldConfirmed; label: string }[] = [
  { value: 'confirmed', label: '확인됨' },
  { value: 'not_confirmed', label: '미확인' },
  { value: 'intermittent', label: '간헐적' },
];

const CONCLUSION_OPTIONS: { value: InvestigationConclusion; label: string }[] = [
  { value: 'confirmed', label: 'CIP 확정' },
  { value: 'dismissed', label: '기각' },
  { value: 'needs_more', label: '추가조사' },
];

interface InvestigationFormProps {
  cipItem: CipItem;
  onBack?: () => void;
  onComplete?: () => void;
}

export function InvestigationForm({ cipItem, onBack, onComplete }: InvestigationFormProps) {
  const updateCip = useUpdateCipItem();
  const [photos, setPhotos] = useState<string[]>([]);

  const existingWhys = cipItem.five_why as Record<string, string>[] | null;

  const form = useForm<InvestigationFormValues>({
    resolver: zodResolver(investigationSchema),
    defaultValues: {
      field_confirmed: cipItem.field_confirmed ?? undefined,
      field_observation: cipItem.field_observation ?? '',
      why_1: existingWhys?.[0]?.why ?? '',
      why_2: existingWhys?.[1]?.why ?? '',
      why_3: existingWhys?.[2]?.why ?? '',
      why_4: existingWhys?.[3]?.why ?? '',
      why_5: existingWhys?.[4]?.why ?? '',
      root_cause: cipItem.root_cause ?? '',
      investigation_conclusion: cipItem.investigation_conclusion ?? undefined,
    },
  });

  function buildPayload(values: InvestigationFormValues, isSubmit: boolean) {
    const fiveWhy = [
      { step: '1', why: values.why_1 ?? '' },
      { step: '2', why: values.why_2 ?? '' },
      { step: '3', why: values.why_3 ?? '' },
      { step: '4', why: values.why_4 ?? '' },
      { step: '5', why: values.why_5 ?? '' },
    ].filter((w) => w.why.trim() !== '');

    const updates: Partial<CipItem> = {
      field_confirmed: values.field_confirmed as FieldConfirmed,
      field_observation: values.field_observation,
      five_why: fiveWhy,
      root_cause: values.root_cause,
      investigation_conclusion: values.investigation_conclusion as InvestigationConclusion,
      investigation_status: isSubmit ? 'completed' : 'in_progress',
    };

    if (isSubmit) {
      updates.investigation_completed_at = new Date().toISOString();
    }

    return updates;
  }

  function handleSaveDraft() {
    const values = form.getValues();
    const updates = buildPayload(values, false);
    updateCip.mutate({ id: cipItem.id, updates });
  }

  function handleSubmit(values: InvestigationFormValues) {
    const updates = buildPayload(values, true);
    updateCip.mutate(
      { id: cipItem.id, updates },
      { onSuccess: () => onComplete?.() },
    );
  }

  function handleAddPhotoPlaceholder() {
    setPhotos((prev) => [...prev, `photo-${Date.now()}`]);
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p !== id));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/20 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{cipItem.cip_no}</p>
            <h1 className="font-headline text-base font-bold text-foreground">현장조사</h1>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 py-5"
        >
          {/* Photo section */}
          <section>
            <SectionHeader title="현장 사진" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddPhotoPlaceholder}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant/40 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[0.6rem]">촬영</span>
              </button>
              <button
                type="button"
                onClick={handleAddPhotoPlaceholder}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant/40 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[0.6rem]">갤러리</span>
              </button>
              {photos.map((photoId) => (
                <div
                  key={photoId}
                  className="relative flex h-20 w-20 items-center justify-center rounded-lg bg-muted"
                >
                  <Camera className="h-6 w-6 text-muted-foreground/40" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photoId)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPhotoPlaceholder}
                className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant/40 text-muted-foreground transition-colors hover:border-primary"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </section>

          {/* Symptom verification */}
          <section>
            <SectionHeader title="현상 확인" />

            <FormField
              control={form.control}
              name="field_confirmed"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormLabel className="text-sm font-medium">현상 발생 여부</FormLabel>
                  <FormControl>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CONFIRMED_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex min-h-[44px] min-w-[100px] cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                            field.value === opt.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-outline-variant/30 text-muted-foreground hover:border-primary/50',
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value={opt.value}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="field_observation"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-sm font-medium">
                    현장 관찰 내용 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="현장에서 관찰한 현상을 상세히 기록하세요..."
                      className="min-h-[120px] text-base"
                      style={{ fontSize: '16px' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* 5 Why analysis */}
          <section>
            <SectionHeader title="Root Cause 분석 (5 Why)" />

            <div className="mt-3 space-y-0">
              {([1, 2, 3, 4, 5] as const).map((n, idx) => (
                <div key={n}>
                  <FormField
                    control={form.control}
                    name={`why_${n}` as keyof InvestigationFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-primary">
                          Why {n}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={(field.value as string) ?? ''}
                            placeholder={`${n}번째 원인을 입력하세요`}
                            className="min-h-[44px] text-base"
                            style={{ fontSize: '16px' }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {idx < 4 && (
                    <div className="flex justify-center py-1.5">
                      <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="root_cause"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-sm font-medium">
                    근본 원인 요약 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="5 Why 분석을 바탕으로 근본 원인을 요약하세요..."
                      className="min-h-[100px] text-base"
                      style={{ fontSize: '16px' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Conclusion */}
          <section>
            <SectionHeader title="결론" />

            <FormField
              control={form.control}
              name="investigation_conclusion"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {CONCLUSION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                            field.value === opt.value
                              ? opt.value === 'confirmed'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : opt.value === 'dismissed'
                                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                  : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'border-outline-variant/30 text-muted-foreground hover:border-primary/50',
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value={opt.value}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Spacer for sticky footer */}
          <div className="h-24" />
        </form>
      </Form>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-outline-variant/20 bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] flex-1 text-sm"
            onClick={handleSaveDraft}
            disabled={updateCip.isPending}
          >
            저장
          </Button>
          <Button
            type="button"
            className="min-h-[44px] flex-1 gap-1.5 text-sm"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={updateCip.isPending}
          >
            {updateCip.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            조사 완료 제출
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-outline-variant/20" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <div className="h-px flex-1 bg-outline-variant/20" />
    </div>
  );
}
