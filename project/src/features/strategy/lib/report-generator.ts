'use client';

import type { CipItem, ScreeningResult } from './types';

export function generateReportContent(
  cipItem: CipItem,
  screeningResult?: ScreeningResult | null,
): Record<string, unknown> {
  const sections: Record<string, unknown>[] = [];

  sections.push(
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 1: 이상감지' }] },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: screeningResult
            ? `모델: ${screeningResult.model_code} | 라인: ${screeningResult.customer_line_code} | 파트: ${screeningResult.part_group_code}`
            : '스크리닝 데이터 없음',
        },
      ],
    },
  );

  if (screeningResult) {
    sections.push(
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `호출빈도: ${screeningResult.call_count}건 (평균 ${screeningResult.call_count_avg}건)` }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `리워크율: ${screeningResult.rework_rate}%` }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `CUSUM: ${screeningResult.cusum_value} (UCL: ${screeningResult.cusum_ucl})` }],
      },
    );
  }

  sections.push(
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 2: 이슈기록' }] },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: cipItem.description ?? '매니저 소견을 입력하세요.' }],
    },
  );

  sections.push(
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 3: 현장조사' }] },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: cipItem.root_cause ?? '현장조사 결과를 입력하세요.' }],
    },
  );

  return {
    type: 'doc',
    content: sections,
  };
}
