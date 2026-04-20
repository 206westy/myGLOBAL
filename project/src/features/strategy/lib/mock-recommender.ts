'use client';

import { RECOMMENDATION_POOLS } from '../constants/strategy-data';
import { type Recommendation } from './types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function getRecommendations(query: string): { reply: string; recommendations: Recommendation[] } {
  const q = query.toLowerCase();

  if (/리워크|재작업|rework/.test(q)) {
    return {
      reply: `**리워크(재작업) 감소** 관련 개선 아이템을 찾아봤습니다. 현재 데이터에서 리워크율이 높은 공정 3개를 분석했으며, 아래 3가지 접근법을 추천드립니다.`,
      recommendations: shuffle(RECOMMENDATION_POOLS.rework).slice(0, 3),
    };
  }

  if (/에너지|전력|energy/.test(q)) {
    return {
      reply: `**에너지 절감** 관련 개선 기회를 분석했습니다. 현재 피크 시간대 전력 낭비가 확인되며, 아래 방안을 추천드립니다.`,
      recommendations: RECOMMENDATION_POOLS.energy,
    };
  }

  if (/품질|불량|ftfr|quality/.test(q)) {
    return {
      reply: `**품질 개선** 관련 아이템입니다. 비전 검사와 SPC 관리를 통해 불량률을 크게 낮출 수 있습니다.`,
      recommendations: shuffle(RECOMMENDATION_POOLS.quality).slice(0, 3),
    };
  }

  if (/사이클|리드타임|셋업|cycle|lead/.test(q)) {
    return {
      reply: `**사이클 타임 단축** 관련 개선안입니다. SMED 적용과 이송 자동화가 가장 빠른 효과를 낼 수 있습니다.`,
      recommendations: RECOMMENDATION_POOLS.cycle,
    };
  }

  return {
    reply: `현재 사이트 데이터를 분석한 결과, **즉시 적용 가능한 개선 아이디어** 3가지를 추천드립니다. 각 아이템의 기대 효과와 난이도를 참고해 우선순위를 정해 보세요.`,
    recommendations: shuffle(RECOMMENDATION_POOLS.default).slice(0, 3),
  };
}
