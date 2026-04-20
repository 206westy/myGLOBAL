'use client';

import type { CipItem } from './types';

interface ValidationResult {
  valid: boolean;
  message: string | null;
}

export function validateStageTransition(
  item: CipItem,
  fromStage: string,
  toStage: string
): ValidationResult {
  const stageOrder = ['registered', 'investigating', 'searching_solution'];
  const fromIdx = stageOrder.indexOf(fromStage);
  const toIdx = stageOrder.indexOf(toStage);

  if (fromIdx === -1 || toIdx === -1) {
    return { valid: false, message: '유효하지 않은 단계 전이입니다.' };
  }

  if (toIdx <= fromIdx) {
    return { valid: false, message: '이전 단계로 되돌릴 수 없습니다.' };
  }

  if (fromStage === 'registered' && toStage === 'investigating') {
    if (!item.assigned_engineer) {
      return { valid: false, message: '담당 엔지니어를 먼저 배정해주세요.' };
    }
    return { valid: true, message: null };
  }

  if (fromStage === 'investigating' && toStage === 'searching_solution') {
    if (!item.root_cause) {
      return { valid: false, message: '근본 원인(Root Cause)을 입력해주세요.' };
    }
    return { valid: true, message: null };
  }

  return { valid: true, message: null };
}
