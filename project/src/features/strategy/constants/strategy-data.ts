'use client';

import { type StrategyItem, type Owner, type Recommendation, type ChatMessage } from '../lib/types';

export const DUMMY_OWNERS: Owner[] = [
  { id: 'o1', name: '김민준', initials: 'MJ', color: '#5F3ADD' },
  { id: 'o2', name: '이서연', initials: 'SY', color: '#10B981' },
  { id: 'o3', name: '박지훈', initials: 'JH', color: '#F59E0B' },
  { id: 'o4', name: '최유나', initials: 'YN', color: '#EF4444' },
];

const o = DUMMY_OWNERS;
const today = new Date();
const d = (offset: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};

export const INITIAL_ITEMS: StrategyItem[] = [
  // ─── backlog ──────────────────────────────────────────────────────
  {
    id: 'item-1',
    title: '설비 예열 사이클 자동화',
    description: '수동으로 진행되는 설비 예열 프로세스를 PLC 인터락과 연동해 자동으로 진행되도록 개선합니다. 작업자 개입 빈도를 줄여 생산성을 높일 수 있습니다.',
    status: 'backlog',
    priority: 'medium',
    effort: 'M',
    owner: o[2],
    tags: ['설비', '자동화'],
    expectedImpact: '준비 시간 25% 단축',
    impactScore: 60,
    source: 'manual',
    createdAt: d(-14),
    progress: 0,
    subTasks: [
      { id: 'st1-1', title: 'PLC 인터락 사양 확인', done: false },
      { id: 'st1-2', title: '자동화 로직 설계', done: false },
      { id: 'st1-3', title: '파일럿 테스트', done: false },
    ],
    activity: [
      { id: 'a1-1', at: d(-14), text: '아이템 생성됨' },
    ],
  },
  {
    id: 'item-2',
    title: '부품 수명 예측 모델 도입',
    description: '기존 PM(예방 점검) 일정 기반 부품 교체를 센서 데이터 기반 예측 모델로 전환합니다. FTFR 향상 기대.',
    status: 'backlog',
    priority: 'high',
    effort: 'L',
    owner: o[0],
    tags: ['예측정비', 'FTFR'],
    expectedImpact: 'FTFR 8% 향상',
    impactScore: 72,
    source: 'chat',
    createdAt: d(-10),
    progress: 0,
    subTasks: [
      { id: 'st2-1', title: '데이터 수집 파이프라인 설계', done: false },
      { id: 'st2-2', title: '모델 프로토타입 개발', done: false },
      { id: 'st2-3', title: '현장 검증', done: false },
      { id: 'st2-4', title: 'PM 일정 통합', done: false },
    ],
    activity: [
      { id: 'a2-1', at: d(-10), text: 'AI 챗봇 추천으로 등록됨' },
    ],
  },

  // ─── ready ──────────────────────────────────────────────────────
  {
    id: 'item-3',
    title: '재작업 원인 분류 자동화',
    description: '현재 수기로 기록되는 재작업 원인 코드를 OCR + 분류 모델로 자동 입력합니다. 주 단위 집계 리포트 자동 생성 포함.',
    status: 'ready',
    priority: 'high',
    effort: 'M',
    owner: o[1],
    tags: ['리워크', '자동화', 'AI'],
    expectedImpact: '리워크율 12% 감소',
    impactScore: 80,
    source: 'chat',
    createdAt: d(-7),
    progress: 0,
    subTasks: [
      { id: 'st3-1', title: 'OCR 엔진 선정', done: false },
      { id: 'st3-2', title: '분류 모델 학습 데이터 수집', done: false },
      { id: 'st3-3', title: '파일럿 적용', done: false },
    ],
    activity: [
      { id: 'a3-1', at: d(-7), text: 'AI 챗봇 추천으로 등록됨' },
    ],
  },
  {
    id: 'item-4',
    title: '에너지 피크 부하 절감',
    description: '생산 라인별 전력 피크 패턴을 분석해 비생산 시간대 설비 대기 전력을 자동으로 줄이는 스케줄링 규칙을 도입합니다.',
    status: 'ready',
    priority: 'medium',
    effort: 'S',
    owner: o[3],
    tags: ['에너지', '절감'],
    expectedImpact: '전력비 7% 절감',
    impactScore: 55,
    source: 'chat',
    createdAt: d(-5),
    progress: 0,
    subTasks: [
      { id: 'st4-1', title: '라인별 전력 패턴 데이터 분석', done: false },
      { id: 'st4-2', title: '스케줄링 규칙 정의', done: false },
      { id: 'st4-3', title: '설비 제어 연동 테스트', done: false },
    ],
    activity: [
      { id: 'a4-1', at: d(-5), text: 'AI 챗봇 추천으로 등록됨' },
    ],
  },

  // ─── in_progress ────────────────────────────────────────────────
  {
    id: 'item-5',
    title: '셋업 리드타임 표준화',
    description: '제품 교체 시 셋업 시간의 편차가 크다. 현재 평균 92분인 셋업 시간을 60분 이하로 표준화하기 위한 SMED 기법 도입.',
    status: 'in_progress',
    priority: 'critical',
    effort: 'M',
    owner: o[0],
    tags: ['SMED', '셋업', '리드타임'],
    expectedImpact: '셋업 시간 35% 단축',
    impactScore: 88,
    source: 'manual',
    createdAt: d(-20),
    startedAt: d(-10),
    dueDate: d(20),
    progress: 40,
    subTasks: [
      { id: 'st5-1', title: '현재 셋업 프로세스 동영상 분석', done: true },
      { id: 'st5-2', title: 'SMED 내부/외부 작업 분리', done: true },
      { id: 'st5-3', title: '표준 작업 지침서 작성', done: false },
      { id: 'st5-4', title: '파일럿 라인 적용', done: false },
      { id: 'st5-5', title: '전 라인 롤아웃', done: false },
    ],
    activity: [
      { id: 'a5-1', at: d(-20), text: '아이템 생성됨' },
      { id: 'a5-2', at: d(-10), text: '실행으로 이동 — 담당자: 김민준' },
      { id: 'a5-3', at: d(-5), text: '프로세스 분석 완료, 지침서 작성 중' },
    ],
  },
  {
    id: 'item-6',
    title: 'GCB 오픈 건수 실시간 모니터링',
    description: '현재 일별 수작업 집계 중인 GCB 오픈 건수를 MES와 연동해 실시간 대시보드로 전환합니다.',
    status: 'in_progress',
    priority: 'high',
    effort: 'S',
    owner: o[1],
    tags: ['GCB', 'MES', '모니터링'],
    expectedImpact: '집계 리드타임 90% 단축',
    impactScore: 65,
    source: 'manual',
    createdAt: d(-15),
    startedAt: d(-8),
    dueDate: d(7),
    progress: 65,
    subTasks: [
      { id: 'st6-1', title: 'MES API 사양 확인', done: true },
      { id: 'st6-2', title: '데이터 파이프라인 구축', done: true },
      { id: 'st6-3', title: '대시보드 UI 개발', done: true },
      { id: 'st6-4', title: '현장 검증 및 배포', done: false },
    ],
    activity: [
      { id: 'a6-1', at: d(-15), text: '아이템 생성됨' },
      { id: 'a6-2', at: d(-8), text: '실행으로 이동 — 담당자: 이서연' },
      { id: 'a6-3', at: d(-3), text: '대시보드 UI 개발 완료, 현장 검증 진행 중' },
    ],
  },

  // ─── review ─────────────────────────────────────────────────────
  {
    id: 'item-7',
    title: '불량 이미지 자동 판독 시스템',
    description: '육안 검사에 의존하던 외관 불량 판정을 딥러닝 기반 비전 시스템으로 대체합니다. 검사 정확도 95% 이상 목표.',
    status: 'review',
    priority: 'high',
    effort: 'L',
    owner: o[2],
    tags: ['품질', '비전AI', '자동화'],
    expectedImpact: '불량 유출률 60% 감소',
    impactScore: 91,
    source: 'chat',
    createdAt: d(-40),
    startedAt: d(-30),
    dueDate: d(5),
    progress: 85,
    subTasks: [
      { id: 'st7-1', title: '학습 이미지 데이터셋 구축', done: true },
      { id: 'st7-2', title: '모델 학습 및 검증', done: true },
      { id: 'st7-3', title: '현장 카메라 설치', done: true },
      { id: 'st7-4', title: '시스템 통합 테스트', done: true },
      { id: 'st7-5', title: '검토 위원회 발표', done: false },
    ],
    activity: [
      { id: 'a7-1', at: d(-40), text: 'AI 챗봇 추천으로 등록됨' },
      { id: 'a7-2', at: d(-30), text: '실행으로 이동' },
      { id: 'a7-3', at: d(-14), text: '모델 학습 완료 (정확도 96.3%)' },
      { id: 'a7-4', at: d(-3), text: '검토 단계로 이동' },
    ],
  },
  {
    id: 'item-8',
    title: '작업부하 균등 배분 알고리즘',
    description: '라인별 작업자 부하 데이터를 기반으로 작업 지시를 자동으로 재배분하는 스케줄링 알고리즘을 도입합니다.',
    status: 'review',
    priority: 'medium',
    effort: 'M',
    owner: o[3],
    tags: ['작업부하', '스케줄링'],
    expectedImpact: '생산량 편차 40% 감소',
    impactScore: 70,
    source: 'chat',
    createdAt: d(-35),
    startedAt: d(-25),
    dueDate: d(3),
    progress: 90,
    subTasks: [
      { id: 'st8-1', title: '라인별 부하 데이터 수집', done: true },
      { id: 'st8-2', title: '알고리즘 설계 및 구현', done: true },
      { id: 'st8-3', title: '시뮬레이션 검증', done: true },
      { id: 'st8-4', title: '현장 파일럿 테스트', done: false },
    ],
    activity: [
      { id: 'a8-1', at: d(-35), text: 'AI 챗봇 추천으로 등록됨' },
      { id: 'a8-2', at: d(-25), text: '실행으로 이동' },
      { id: 'a8-3', at: d(-7), text: '시뮬레이션 검증 완료' },
      { id: 'a8-4', at: d(-2), text: '검토 단계로 이동' },
    ],
  },

  // ─── done ───────────────────────────────────────────────────────
  {
    id: 'item-9',
    title: '작업 지시서 디지털화 (페이퍼리스)',
    description: '종이 기반 작업 지시서를 태블릿 기반 디지털 시스템으로 전환. 실시간 작업 진행 상황 공유.',
    status: 'done',
    priority: 'medium',
    effort: 'M',
    owner: o[0],
    tags: ['디지털전환', '페이퍼리스'],
    expectedImpact: '지시서 발급 시간 80% 단축',
    impactScore: 74,
    source: 'manual',
    createdAt: d(-60),
    startedAt: d(-50),
    dueDate: d(-10),
    completedAt: d(-12),
    progress: 100,
    subTasks: [
      { id: 'st9-1', title: '태블릿 UX 설계', done: true },
      { id: 'st9-2', title: '백엔드 API 개발', done: true },
      { id: 'st9-3', title: '현장 배포', done: true },
      { id: 'st9-4', title: '직원 교육', done: true },
    ],
    activity: [
      { id: 'a9-1', at: d(-60), text: '아이템 생성됨' },
      { id: 'a9-2', at: d(-50), text: '실행으로 이동' },
      { id: 'a9-3', at: d(-12), text: '완료 처리됨 🎉' },
    ],
  },
];

// ─── Recommendation pool ─────────────────────────────────────────

export const RECOMMENDATION_POOLS: Record<string, Recommendation[]> = {
  rework: [
    {
      id: 'r1', title: '재작업 원인 실시간 분류 자동화',
      description: '수기로 기록되는 재작업 원인 코드를 OCR과 AI 분류 모델로 자동화합니다.',
      expectedImpact: '리워크율 12% 감소', effort: 'M', impactScore: 82,
      tags: ['리워크', 'AI', '자동화'],
    },
    {
      id: 'r2', title: '재작업 발생 패턴 예측 알림',
      description: '과거 재작업 데이터를 분석해 고위험 공정을 사전에 알려 예방 조치를 취합니다.',
      expectedImpact: '재작업 발생 20% 사전 차단', effort: 'L', impactScore: 75,
      tags: ['예측', '알림', '품질'],
    },
    {
      id: 'r3', title: '라인별 재작업률 일일 자동 리포트',
      description: '수동 집계 대신 MES 데이터 기반으로 라인별 재작업률을 자동 집계·발송합니다.',
      expectedImpact: '집계 공수 90% 절감', effort: 'S', impactScore: 65,
      tags: ['리포트', 'MES'],
    },
  ],
  energy: [
    {
      id: 'r4', title: '설비 대기 전력 자동 차단',
      description: '비가동 설비의 대기 전력을 스케줄 기반으로 자동 차단하여 전력비를 절감합니다.',
      expectedImpact: '전력비 7% 절감', effort: 'S', impactScore: 58,
      tags: ['에너지', '절감', '설비'],
    },
    {
      id: 'r5', title: '에너지 피크 예측 및 부하 분산',
      description: '시간대별 전력 피크를 ML로 예측하고 생산 스케줄에 반영해 피크 비용을 줄입니다.',
      expectedImpact: '피크 요금 15% 절감', effort: 'L', impactScore: 71,
      tags: ['에너지', '예측', 'ML'],
    },
  ],
  quality: [
    {
      id: 'r6', title: '딥러닝 비전 외관 검사 시스템',
      description: '육안 검사 공정을 딥러닝 비전 카메라로 대체하여 불량 검출률을 높입니다.',
      expectedImpact: '불량 유출 60% 감소', effort: 'L', impactScore: 91,
      tags: ['품질', '비전AI', '검사'],
    },
    {
      id: 'r7', title: 'SPC(통계적 공정 관리) 실시간 경보',
      description: '공정 변수가 관리 한계를 벗어나기 직전에 실시간 경보를 발송합니다.',
      expectedImpact: '불량률 18% 감소', effort: 'M', impactScore: 79,
      tags: ['SPC', '품질', '알림'],
    },
    {
      id: 'r8', title: 'FTFR 저하 공정 자동 탐지',
      description: 'FTFR 데이터를 실시간으로 모니터링하고 저하 공정을 자동으로 탐지·보고합니다.',
      expectedImpact: 'FTFR 10% 향상', effort: 'S', impactScore: 68,
      tags: ['FTFR', '품질', '모니터링'],
    },
  ],
  cycle: [
    {
      id: 'r9', title: 'SMED 방법론 적용 셋업 단축',
      description: '내부·외부 작업 분리 및 표준화를 통해 셋업 시간을 35% 단축합니다.',
      expectedImpact: '셋업 시간 35% 단축', effort: 'M', impactScore: 85,
      tags: ['SMED', '셋업', '사이클'],
    },
    {
      id: 'r10', title: '공정 간 이송 자동화 (AGV 도입)',
      description: '수작업 이송을 AGV(무인 반송차)로 대체하여 이송 시간과 오류를 줄입니다.',
      expectedImpact: '이송 리드타임 50% 단축', effort: 'XL', impactScore: 78,
      tags: ['AGV', '자동화', '이송'],
    },
  ],
  default: [
    {
      id: 'r11', title: '작업 지시서 디지털화 (페이퍼리스)',
      description: '종이 기반 작업 지시를 태블릿 디지털 시스템으로 전환합니다.',
      expectedImpact: '지시 발급 공수 80% 절감', effort: 'M', impactScore: 72,
      tags: ['디지털전환', '페이퍼리스'],
    },
    {
      id: 'r12', title: '설비 이상 사전 감지 알림',
      description: '진동·온도 센서 데이터를 분석해 설비 이상을 사전에 감지합니다.',
      expectedImpact: '비계획 다운타임 30% 감소', effort: 'M', impactScore: 83,
      tags: ['예측정비', '센서', '설비'],
    },
    {
      id: 'r13', title: '생산 실적 자동 집계 대시보드',
      description: 'MES 데이터를 바탕으로 시간별/라인별 생산 실적을 자동 집계합니다.',
      expectedImpact: '집계 보고 공수 70% 절감', effort: 'S', impactScore: 60,
      tags: ['대시보드', 'MES', '자동화'],
    },
  ],
};

export const SEED_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-msg-1',
    role: 'assistant',
    content: '안녕하세요! 저는 현재 사이트 데이터를 기반으로 **바로 적용 가능한 개선 아이디어**를 추천해 드리는 Strategy AI입니다.\n\n아래 빠른 시작 버튼을 클릭하거나, 원하는 주제를 직접 입력해 주세요.',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];
