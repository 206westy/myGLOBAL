# myATHENA CIP Platform — Step 1~3 기획 문서

> **범위:** 이상감지 → 이슈기록 → 현장조사 (문제 정의 보고서 생성까지)
> **버전:** v1.0 | **작성일:** 2026-04-13

---

## 1. PRD (Product Requirements Document)

### 1.1 제품 개요

PSK Inc. CS 엔지니어링팀(PEE T-CS)이 플라즈마 에칭/애싱 장비의 정비 이력 데이터를 기반으로 CIP(Continuous Improvement Program) 아이템을 체계적으로 발굴·기록·조사하는 웹 플랫폼. 월 1회 배치 데이터(mySERVICE SAP CSV)에서 정량적 이상치와 정성적 힌트를 자동 탐지하고, CS 매니저가 판단 → CS 엔지니어가 현장 조사 → 문제 정의 보고서를 완성하는 Step 1~3 파이프라인.

### 1.2 사용자 & 역할

| 역할 | 주요 활동 | 접근 환경 |
|------|----------|----------|
| CS 매니저 | 월간 스크리닝 리뷰, CIP 생성 판단, 담당자 배정, 승인 | 데스크톱 (본사) |
| CS 엔지니어 | 현장조사 수행, 데이터 입력, Root Cause 분석, 보고서 작성 | 모바일 + 데스크톱 (현장/사무실) |
| 시스템 관리자 | CSV 임포트, 룩업 테이블 관리, 파트그룹 매핑 | 데스크톱 (본사) |

### 1.3 핵심 기능 요구사항

**F01. 데이터 임포트**
- 5개 Tcode CSV 업로드 (ZCSR0010, ZCSR0070D, ZCSR0070D_TASK, ZCSR0100, ZCSR0150)
- Tcode 선택 → 컬럼 자동 매핑 → 2,000행 청크 upsert → 진행률 실시간 표시
- 룩업 테이블 자동 추출 (국가, 모델, defect/cause code 등 16개)
- ZCSR0150 피벗 → 언피벗 자동 변환
- 임포트 완료 후 Materialized View 리프레시

**F02. 정량 이상감지 (Track A)**
- 집계 단위: 모델 × 고객사라인 × 파트그룹(20개)
- 지표: 호출빈도, 리워크율, 평균 작업시간, Cause/Defect code 분포
- 감지 방법: Pareto 자동 갱신, CUSUM 누적 관리도, 추세 기울기(3~6개월 선형회귀), Isolation Forest(다차원 복합 이상)
- 출력: Watch(조짐) / Alert(확정) / 해소 3단계 분류
- 파트그룹 코드: Title Sort 끝 2자리 자동 추출 → lu_part_groups 매핑

**F03. 정성 힌트 추출 (Track B)**
- 매월 임포트 시 해당 월 S/O 디스크립션을 API로 가져옴
- 건별 LLM 병렬 호출 → CIP 힌트 추출 (반복 고장, 연쇄 고장, SOP 부재, 설계 결함 의심 등)
- 힌트 없는 건은 null → 힌트 있는 건만 DB 저장
- Alert 리뷰 시 해당 그룹의 힌트 목록 자동 표시

**F04. 월간 스크리닝 대시보드**
- 로그인 시 이번 달 스크리닝 요약: 신규 Watch N건, Alert 승격 N건, Watch 유지 N건, 해소 N건
- Alert 카드: 수치 근거(추이 차트, CUSUM 차트) + 정성 힌트 목록 + 관련 S/O 리스트
- Watch 카드: 조짐 사유 + 추이 차트
- 필터: 모델, 국가, 고객사라인, 파트그룹별
- Drill-down: Level 1(모델×파트그룹) → Level 2(+국가) → Level 3(+고객사라인)

**F05. CIP 아이템 생성 (이슈기록)**
- Alert에서 "CIP 아이템 생성" → 수치 근거 + 정성 힌트 자동 채움
- CIP 번호 자동 생성 (CIP-YYYY-NNNN)
- 필수 입력: 제목, 대상(모델×라인×파트그룹), 담당 엔지니어 배정
- 우선순위: 심각도×발생도×검출도 → AIAG/VDA AP 자동 산출 (HIGH/MEDIUM/LOW)
- 관련 S/O 자동 링크
- "계속 Watch" 선택 시 사유 기록 후 다음 달 재평가

**F06. 현장조사 (Field Investigation)**
- 배정된 CS 엔지니어에게 알림 발송
- 모바일 대응 조사 폼: 현장 사진·로그 첨부, 모니터링 데이터 입력
- Root Cause 분석 도구: 5 Why 템플릿 + Fishbone(6M) 구조화 입력
- 결론: 확정 / 기각 / 추가조사 필요
- Root Cause 입력 완료 시 → 다음 단계 전이 가능 (Validator)

**F07. 문제 정의 보고서**
- Step 1(이상감지) + Step 2(이슈기록) + Step 3(현장조사) 데이터를 하나의 리치 텍스트 보고서로 통합
- Tiptap 에디터 기반 편집 가능
- PDF 내보내기
- 이후 Step 4~5(솔루션 탐색)의 입력 / 연구소 에스컬레이션 문서의 본체

**F08. 칸반보드 & 관리 뷰**
- CIP 아이템 전체 칸반: 접수 → 조사중 → 솔루션탐색 → 연구소 → 테스트 → 확산 → 완료
- Step 1~3 범위에서는 접수·조사중·솔루션탐색 3개 컬럼이 활성
- 스윔레인: 모델별 또는 파트그룹별
- 테이블 뷰, 타임라인 뷰 전환

### 1.4 비기능 요구사항

| 항목 | 요구 |
|------|------|
| 성능 | CSV 20만행 임포트 70초 이내, 대시보드 로딩 2초 이내 |
| 모바일 | 현장조사 폼 모바일 반응형 필수 |
| 언어 | 한국어 기본, 영어 지원 (디스크립션은 한영 혼용) |
| 보안 | Supabase Auth (이메일/비밀번호), RLS 적용 |
| 데이터 | 월 1회 배치 CSV + S/O 디스크립션 API 연동 |
| LLM 비용 | Track B 힌트 추출 월 $2 이내 (1,000건 × 600토큰 기준) |

---

## 2. 기술 스택 (TRD)

### 2.1 프레임워크 & 코어

| 레이어 | 기술 | 버전 | 선정 사유 |
|--------|------|------|----------|
| **프레임워크** | Next.js (App Router) | 15.x | SSR/SSG, API Routes, 미들웨어, RSC 지원 |
| **언어** | TypeScript | 5.x | 타입 안정성, Zod 연동, DX |
| **스타일링** | Tailwind CSS | v4 | 유틸리티 우선, CSS 변수 기반 테마, shadcn 호환 |
| **UI 컴포넌트** | shadcn/ui | latest | Radix UI 기반, 커스터마이징 자유도, Tailwind v4 네이티브 |
| **아이콘** | Lucide React | latest | shadcn 기본 아이콘셋, 트리쉐이킹, 일관된 스타일 |
| **DB** | Supabase (PostgreSQL) | - | pgvector, Auth, Storage, Edge Functions, RLS |
| **ORM/쿼리** | Supabase JS Client | v2 | RLS 통합, 실시간 구독, Storage API |

### 2.2 에디터 & 문서

| 기술 | 용도 | 선정 사유 |
|------|------|----------|
| **Tiptap** (@tiptap/react v3) | 문제 정의 보고서 리치 텍스트 편집 | ProseMirror 기반, 확장성, 커스텀 노드 뷰, SSR 호환 (immediatelyRender: false) |
| Tiptap StarterKit | 기본 서식 (H1-H3, Bold, Italic, List, Code) | 필수 확장 번들 |
| @tiptap/extension-image | 현장 사진 인라인 삽입 | 보고서 내 이미지 필요 |
| @tiptap/extension-table | 데이터 테이블 삽입 | 수치 비교 테이블 |
| @tiptap/extension-placeholder | 빈 에디터 안내 텍스트 | UX |

### 2.3 차트 & 시각화

| 기술 | 용도 | 선정 사유 |
|------|------|----------|
| **Recharts** | CUSUM 차트, 추세 차트, Pareto 차트, 비교 바 차트 | shadcn/ui Chart 컴포넌트 기반 (Recharts 래핑), React 선언적 API, 월별 데이터 1,000포인트 이하에서 최적 |
| shadcn/ui Chart | Recharts 래핑 컴포넌트 | Tailwind 테마 통합, 커스텀 툴팁/범례 |

Recharts 선정 근거: 이상감지 대시보드의 데이터 포인트는 모델×라인×파트그룹 조합별 월별 값으로 수백~수천 포인트 수준. SVG 기반 Recharts가 이 규모에서 가장 적합하며, shadcn/ui가 Recharts를 공식 래핑하여 Tailwind 테마와 즉시 호환.

### 2.4 폼 & 검증

| 기술 | 용도 | 선정 사유 |
|------|------|----------|
| **React Hook Form** | 폼 상태 관리 | 비제어 컴포넌트 기반, 리렌더 최소화, shadcn Form 통합 |
| **Zod** | 스키마 검증 | TypeScript 타입 추론, 서버/클라이언트 공유, RHF resolver |

### 2.5 애니메이션

| 기술 | 용도 | 선정 사유 |
|------|------|----------|
| **Motion** (구 Framer Motion) | 칸반 카드 전환, 페이지 전환, 대시보드 카드 진입, 드래그앤드롭 | 3.6M 주간 다운로드, 선언적 API, layout animation, gesture 지원, Next.js 호환. 대시보드/관리 도구에서 가장 높은 생산성 |
| Tailwind CSS transitions | 호버, 포커스 등 마이크로 인터랙션 | CSS-only, 번들 비용 0, 단순 전환에 최적 |

Motion 선정 근거: LogRocket 2026 벤치마크에서 "선언적 API + 제스처 + 스크롤 + 레이아웃 애니메이션"을 동시 지원하는 유일한 라이브러리. 칸반 드래그, 카드 리오더, 페이지 전환에 필수.

### 2.6 CSV 파싱 & 유틸리티

| 기술 | 용도 |
|------|------|
| **Papa Parse** | CSV 파싱 (브라우저, 스트리밍) |
| **date-fns** | 날짜 포맷, 차이 계산, 한국어 로케일 |
| **simple-statistics** | CUSUM, 선형회귀, 표준편차 등 통계 계산 (브라우저) |
| **nuqs** | URL 쿼리 파라미터 상태 관리 (필터, 페이지네이션) |

### 2.7 LLM 연동

| 기술 | 용도 |
|------|------|
| **Anthropic API** (Claude Sonnet) | Track B 디스크립션 힌트 추출 |
| Supabase Edge Function | LLM 호출 프록시 (API 키 보호, 병렬 처리) |

### 2.8 인프라

```
브라우저 (Next.js)
  ↕ Supabase Client
Supabase
  ├─ PostgreSQL (데이터, pgvector)
  ├─ Auth (인증)
  ├─ Storage (첨부파일, CSV)
  ├─ Edge Functions (LLM 프록시, CSV bulk import)
  └─ Realtime (알림)
```

---

## 3. 워크플로우 & 상태 전이

### 3.1 월간 사이클

```
매월 1일경: CSV 임포트 (관리자)
  ↓
자동: Track A 정량 스크리닝 (SQL + MV 집계 + 통계 계산)
자동: Track B 정성 힌트 추출 (디스크립션 → LLM → DB 저장)
  ↓
매니저 리뷰: 스크리닝 대시보드 확인
  ├─ Alert → "CIP 생성" 또는 "계속 Watch"
  ├─ Watch → 인지 (다음 달 자동 재평가)
  └─ 해소 → 아카이브
  ↓
CIP 생성 시: 담당 엔지니어 배정 → 현장조사 시작
  ↓
현장조사 완료: 문제 정의 보고서 확정
  ↓
→ Step 4~5 (솔루션 탐색) 로 이관
```

### 3.2 CIP 상태 전이 (Step 1~3 범위)

```
[detected] ──자동 감지──→ [registered] ──엔지니어 배정──→ [investigating]
     ↑                        │                              │
     │                   "계속 Watch"                    Root Cause 완료
     │                   (사유 기록)                          │
     │                        │                              ↓
     └──── 다음 달 재평가 ────┘                      [searching_solution]
                                                        (Step 4로 이관)
```

### 3.3 전이 조건 & Validator

| 전이 | 트리거 | Validator (필수 조건) |
|------|--------|---------------------|
| detected → registered | 매니저가 "CIP 생성" 클릭 | 제목, 대상(모델×라인×파트그룹), 우선순위 입력 |
| registered → investigating | 담당 엔지니어 배정 시 자동 전이 | assigned_engineer 필드 not null |
| investigating → searching_solution | 엔지니어가 "조사 완료" 클릭 | root_cause 필드 not null, 첨부파일 1건 이상 |

---

## 4. 화면 설계

### 4.1 화면 목록

| # | 화면 | 경로 | 주요 사용자 |
|---|------|------|-----------|
| S01 | 로그인 | /login | 전체 |
| S02 | 메인 대시보드 (월간 스크리닝) | / | CS 매니저 |
| S03 | Alert 상세 | /screening/[id] | CS 매니저 |
| S04 | Watch 목록 | /screening?tab=watch | CS 매니저 |
| S05 | CIP 칸반보드 | /cip | 전체 |
| S06 | CIP 상세 / 문제정의 보고서 | /cip/[id] | 전체 |
| S07 | 현장조사 폼 | /cip/[id]/investigation | CS 엔지니어 |
| S08 | CSV 임포트 | /admin/import | 관리자 |
| S09 | 파트그룹 매핑 관리 | /admin/part-groups | 관리자 |
| S10 | 알림 센터 | /notifications | 전체 |

### 4.2 S02: 메인 대시보드 (월간 스크리닝)

**레이아웃:**

```
┌──────────────────────────────────────────────────────┐
│ Header: myATHENA CIP    [알림 벨] [프로필]             │
├──────────────────────────────────────────────────────┤
│ 사이드바        │ 메인 콘텐츠                          │
│ ─────────      │                                      │
│ 📊 대시보드     │ ┌─ 스크리닝 요약 카드 ──────────────┐ │
│ 📋 CIP 보드    │ │ 🔴 Alert 2   🟡 Watch 4          │ │
│ 📂 S/O 이력    │ │ 🟢 해소 1    ⚪ 유지 7            │ │
│ ⚙️ 관리       │ └───────────────────────────────────┘ │
│               │                                      │
│               │ ┌─ 필터바 ──────────────────────────┐ │
│               │ │ 모델 [▼] 국가 [▼] 파트그룹 [▼]    │ │
│               │ └───────────────────────────────────┘ │
│               │                                      │
│               │ ── 🔴 Alert ──────────────────────── │
│               │ ┌─ Alert 카드 1 ────────────────────┐│
│               │ │ SUPRA N × SEC-X2L(CN) × SOURCE    ││
│               │ │ 호출빈도 +96%  리워크 4→12%        ││
│               │ │ Watch 4개월 → Alert 승격           ││
│               │ │ [추이 미니차트]  [CIP 생성] [Watch] ││
│               │ └───────────────────────────────────┘│
│               │                                      │
│               │ ── 🟡 신규 Watch ─────────────────── │
│               │ ┌─ Watch 카드 1 ────────────────────┐│
│               │ │ SUPRA N × SEC-P4(KR) × PROCESS KIT││
│               │ │ 기울기 +2.8건/월 (p=0.07)          ││
│               │ │ [추이 미니차트]                     ││
│               │ └───────────────────────────────────┘│
│               │ ...                                  │
└──────────────────────────────────────────────────────┘
```

**스크리닝 요약 카드 (4개):**
- 🔴 Alert 승격: 숫자 크게, 클릭 시 Alert 섹션으로 스크롤
- 🟡 신규 Watch: 숫자, 클릭 시 Watch 섹션으로 스크롤
- ⚪ Watch 유지: 지난달에도 Watch였고 이번 달에도 Watch인 건수
- 🟢 해소: Watch에서 정상 복귀한 건수

**필터바:**
- 모델 드롭다운 (multi-select)
- 국가 드롭다운 (multi-select)
- 파트그룹 드롭다운 (multi-select, 20개)
- 기간 범위 (기본: 최근 12개월)
- 필터 상태는 URL 쿼리 파라미터(nuqs)로 유지

**Alert 카드 구성:**
- 좌측: 그룹명 (모델 × 라인 × 파트그룹), 핵심 수치 변화, Watch 이력
- 우측: 미니 추이 차트 (최근 12개월 호출빈도 sparkline)
- 하단: 정성 힌트 요약 (Track B에서 추출된 상위 3개)
- 액션 버튼: "CIP 아이템 생성" (primary), "계속 Watch" (secondary)

### 4.3 S03: Alert 상세

**레이아웃:**

```
┌──────────────────────────────────────────────────────┐
│ ← 대시보드    Alert 상세    [CIP 생성] [계속 Watch]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─ 요약 헤더 ───────────────────────────────────────┐│
│ │ 🔴 SUPRA N × SEC-X2L(CN) × 05(SOURCE)            ││
│ │ Watch 진입: 2025-01  Alert 승격: 2025-04           ││
│ │ 영향 설비: 42대 중 18대 (43%)                      ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ Tab: 수치 분석 | 정성 힌트 | 관련 S/O ───────────┐│
│ │                                                    ││
│ │ [수치 분석 탭]                                      ││
│ │ ┌─ 호출빈도 추이 차트 (12개월, CUSUM 오버레이) ──┐ ││
│ │ │ Y축: 건수, X축: 월                              │ ││
│ │ │ 실선: 실제값, 점선: 이동평균, 밴드: ±2σ         │ ││
│ │ │ ★ Watch 진입 시점, ★ Alert 승격 시점 마커       │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ │ ┌─ 리워크율 추이 ─┐ ┌─ 평균작업시간 추이 ────────┐ ││
│ │ │ 4% → 12%        │ │ 85min → 142min             │ ││
│ │ └─────────────────┘ └────────────────────────────┘ ││
│ │ ┌─ Cause/Defect code 분포 (Pareto) ──────────────┐ ││
│ │ │ 760(Tool Checking) 42% | 740(Customer) 32%      │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ │ ┌─ 영향 설비 히트맵 (고객사라인 × 챔버) ─────────┐ ││
│ │ │ PM1: 8건 | PM2: 6건 | PM3: 4건 | Common: 4건   │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ │                                                    ││
│ │ [정성 힌트 탭]                                      ││
│ │ ┌─ AI 추출 힌트 목록 ────────────────────────────┐ ││
│ │ │ 🔸 "Joint Board 교체 후 TM COM Error 연쇄" (5건)│ ││
│ │ │ 🔸 "PM Intlk Reset 시 Servo Off 패턴" (3건)    │ ││
│ │ │ 🔸 "SOP 미활용" (7건)                           │ ││
│ │ │ 각 힌트 클릭 → 원본 S/O 디스크립션 펼침        │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ │                                                    ││
│ │ [관련 S/O 탭]                                      ││
│ │ ┌─ 서비스 오더 테이블 ───────────────────────────┐ ││
│ │ │ S/O No | 날짜 | Title | Cause | Defect | 시간  │ ││
│ │ │ 40156177 | 04-30 | MON FCIP... | 760 | 850 | 1595│││
│ │ │ ...정렬/필터 가능                               │ ││
│ │ └────────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 4.4 S05: CIP 칸반보드

**레이아웃:**

```
┌──────────────────────────────────────────────────────┐
│ CIP 보드   [보드뷰|테이블뷰|타임라인]  [+ 수동생성]    │
│ 필터: 모델[▼] 국가[▼] 우선순위[▼] 담당자[▼]          │
├──────────────────────────────────────────────────────┤
│ 접수          │ 조사중         │ 솔루션탐색     │ ... │
│ (3)           │ (5)            │ (2)           │     │
│ ┌───────────┐│ ┌────────────┐│ ┌────────────┐│     │
│ │CIP-2026-  ││ │CIP-2026-   ││ │CIP-2026-   ││     │
│ │0012       ││ │0008        ││ │0003        ││     │
│ │SUPRA N    ││ │SUPRA V     ││ │HDW-24      ││     │
│ │SOURCE     ││ │PROCESS KIT ││ │CONTROLLER  ││     │
│ │🔴 HIGH    ││ │🟡 MEDIUM   ││ │🟡 MEDIUM   ││     │
│ │👤 김재영  ││ │👤 George   ││ │👤 Melinda  ││     │
│ │D+3        ││ │D+12        ││ │D+28        ││     │
│ └───────────┘│ └────────────┘│ └────────────┘│     │
│ ┌───────────┐│ ┌────────────┐│              ││     │
│ │CIP-2026-  ││ │...         ││              ││     │
│ │0011       ││ │            ││              ││     │
│ │...        ││ └────────────┘│              ││     │
│ └───────────┘│               │              ││     │
└──────────────────────────────────────────────────────┘
```

**칸반 카드 정보:**
- CIP 번호, 모델명, 파트그룹명
- 우선순위 뱃지 (HIGH=빨강, MEDIUM=노랑, LOW=파랑)
- 담당 엔지니어 아바타 + 이름
- 경과일수 (D+N)
- 클릭 → 사이드 패널로 CIP 상세 열림

**드래그앤드롭:** Motion의 layout animation + Reorder로 구현. 단, 상태 전이 조건(Validator) 미충족 시 드롭 거부 + 토스트 메시지.

### 4.5 S06: CIP 상세 / 문제정의 보고서

**레이아웃:**

```
┌──────────────────────────────────────────────────────┐
│ ← CIP 보드   CIP-2026-0012   상태: 조사중  🔴 HIGH   │
│                                    [PDF 내보내기]     │
├──────────────────────────────────────────────────────┤
│ ┌─ 좌측: 보고서 에디터 (60%) ──┐┌─ 우측: 메타 (40%) ┐│
│ │                              ││                    ││
│ │ ── Step 1: 이상감지 ──────── ││ 상태              ││
│ │ (자동 생성, 읽기 전용)        ││ [접수 → ●조사중]  ││
│ │ • 수치 근거 요약 테이블       ││                    ││
│ │ • 추이 차트 (이미지)          ││ 대상              ││
│ │ • 정성 힌트 목록              ││ 모델: SUPRA N     ││
│ │                              ││ 라인: SEC-X2L(CN) ││
│ │ ── Step 2: 이슈기록 ──────── ││ 파트: SOURCE      ││
│ │ (매니저 작성)                 ││                    ││
│ │ • 매니저 소견                 ││ 우선순위          ││
│ │ • 우선순위 근거               ││ S:8 O:6 D:4       ││
│ │                              ││ → 🔴 HIGH         ││
│ │ ── Step 3: 현장조사 ──────── ││                    ││
│ │ (엔지니어 작성)              ││ 담당              ││
│ │ • 현장 확인 결과              ││ 👤 김재영         ││
│ │ • Root Cause 분석             ││                    ││
│ │   └ 5 Why 구조화 입력         ││ 일정              ││
│ │ • 첨부 사진/로그              ││ 생성: 2026-05-01  ││
│ │ • 결론                        ││ 경과: D+3         ││
│ │                              ││                    ││
│ │ [Tiptap 에디터 영역]         ││ 관련 S/O          ││
│ │ 자유 편집 가능                ││ 40156177          ││
│ │                              ││ 40156176          ││
│ │                              ││ ... (12건)        ││
│ │                              ││                    ││
│ │                              ││ 활동 로그          ││
│ │                              ││ 05-01 CIP 생성    ││
│ │                              ││ 05-01 배정: 김재영 ││
│ │                              ││ 05-03 조사 시작   ││
│ └──────────────────────────────┘└────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 4.6 S07: 현장조사 폼

**모바일 대응 필수. 단일 컬럼, 섹션 구분, 큰 터치 타겟.**

```
┌────────────────────────────┐
│ ← CIP-2026-0012  현장조사  │
├────────────────────────────┤
│                            │
│ 📷 현장 사진 추가           │
│ [사진 촬영] [갤러리 선택]   │
│ ┌──┐ ┌──┐ ┌──┐            │
│ │📷│ │📷│ │+ │            │
│ └──┘ └──┘ └──┘            │
│                            │
│ ── 현상 확인 ──────────── │
│ 현상 발생 여부             │
│ ○ 확인됨  ○ 미확인  ○ 간헐적│
│                            │
│ 현장 관찰 내용 *           │
│ ┌──────────────────────── │
│ │ (텍스트 입력)            │
│ └──────────────────────── │
│                            │
│ ── Root Cause 분석 ────── │
│ 방법: [5 Why ▼]           │
│                            │
│ Why 1: LP Door 안 닫힘     │
│   ↓                        │
│ Why 2: Motor가 Open방향만  │
│   ↓                        │
│ Why 3: Joint Board #3 Fail │
│   ↓                        │
│ Why 4: 보드 수명 초과      │
│   ↓                        │
│ Why 5: 교체 주기 미설정    │
│                            │
│ 근본 원인 요약 *           │
│ ┌──────────────────────── │
│ │ Joint Board #3 수명관리  │
│ │ 부재로 인한 LP Door 고장 │
│ └──────────────────────── │
│                            │
│ ── 결론 ──────────────── │
│ ○ CIP 확정  ○ 기각  ○ 추가조사│
│                            │
│ 📎 로그 파일 첨부           │
│ [파일 선택]                │
│                            │
│ [저장]  [조사 완료 제출]    │
└────────────────────────────┘
```

### 4.7 S08: CSV 임포트

기존 구현된 CSVImportPanel 컴포넌트 기반. 추가 사항:
- Track B 연동: CSV 임포트 완료 후 "디스크립션 힌트 추출 실행" 버튼
- 추출 진행률 표시 (N건 중 M건 완료, 힌트 발견 K건)
- Materialized View 리프레시 + 스크리닝 자동 실행 트리거

---

## 5. 기능 명세 (Feature Specification)

### 5.1 이상감지 엔진 (자동 실행)

**트리거:** CSV 임포트 완료 + MV 리프레시 후 자동 실행

**입력:** mv_monthly_part_stats (Materialized View)

**처리 로직:**

```
모든 (모델 × 고객사라인 × 파트그룹) 조합에 대해:
  
1. 데이터 충분성 검사
   - 최소 6개월 데이터 존재 여부
   - 최소 월 3건 이상 (그 이하는 통계 무의미 → 스킵)

2. Pareto 분석
   - 이번 달 호출빈도 상위 20% 파트그룹 식별
   - 지난달 Pareto에 없었는데 이번 달 진입한 항목 → 플래그

3. CUSUM 계산 (호출빈도 기준)
   - 기준값(μ₀): 과거 12개월 평균
   - 허용 편차(k): 0.5σ
   - S⁺ₙ = max(0, S⁺ₙ₋₁ + (xₙ - μ₀ - k))
   - UCL(h): 4σ 또는 5σ (튜닝 필요)
   - 매월 S⁺값 갱신하여 DB 저장

4. 추세 기울기 (호출빈도 기준)
   - 최근 3~6개월 선형회귀: y = a + bx
   - 기울기 b > 0이고 p < 0.1이면 상승 추세

5. 리워크율 급등
   - 이번 달 리워크율 > 15% (절대 임계)
   - 또는 전월 대비 5%p 이상 상승 (상대 임계)

6. Watch / Alert 판정
   Watch 진입: (CUSUM 양수 3개월 연속) OR (기울기 유의) OR (리워크 급등)
   Alert 승격: (CUSUM > UCL) OR (이동평균 대비 2σ 초과) OR (Watch 3개월 연속 악화)
   해소: (Watch 상태에서 CUSUM 0 복귀) AND (기울기 음수 또는 무의미)

7. 결과 저장: screening_results 테이블
```

**screening_results 테이블 (신규):**

```sql
CREATE TABLE screening_results (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year_month      TEXT NOT NULL,           -- '202604'
  model_code      TEXT NOT NULL,
  customer_line_code TEXT NOT NULL,
  part_group_code TEXT NOT NULL,
  
  -- 판정
  status          TEXT NOT NULL CHECK (status IN ('watch','alert','resolved','normal')),
  prev_status     TEXT,                    -- 지난달 상태
  
  -- 수치 근거
  call_count      INT,
  call_count_avg  NUMERIC,                 -- 이동평균
  call_count_std  NUMERIC,                 -- 표준편차
  cusum_value     NUMERIC,                 -- 현재 CUSUM S+
  cusum_ucl       NUMERIC,                 -- UCL 값
  trend_slope     NUMERIC,                 -- 기울기 b
  trend_p_value   NUMERIC,                 -- p-value
  rework_rate     NUMERIC,
  rework_rate_prev NUMERIC,
  avg_work_time   NUMERIC,
  
  -- 정성 힌트 (Track B)
  hints           JSONB,                   -- [{hint, count, so_numbers}]
  
  -- Pareto
  pareto_rank     INT,
  is_new_pareto   BOOLEAN DEFAULT FALSE,   -- 이번 달 신규 진입
  
  -- 메타
  watch_since     TEXT,                    -- Watch 최초 진입 월
  affected_equip_count INT,
  total_equip_count INT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year_month, model_code, customer_line_code, part_group_code)
);
```

### 5.2 Track B 힌트 추출

**트리거:** CSV 임포트 완료 후 수동 실행 (관리자)

**프로세스:**
1. 이번 달 서비스 오더 목록 조회 (work_start_date = 이번 달)
2. 각 S/O의 order_no로 디스크립션 API 호출
3. 건별 LLM 호출 (병렬 10건씩 배치):

```
시스템 프롬프트:
"반도체 장비 정비 기록에서 CIP(설비 개선) 힌트를 추출하라.
다음 중 해당하는 것만 추출하고, 없으면 null을 반환하라:
- 동일 부위 반복 고장
- 파트 교체 후 재발
- 연쇄 고장 (A 수리 후 B 발생)
- SOP 부재 또는 미활용
- 설계 결함 의심
- 비정상적으로 긴 작업시간의 원인
JSON 형식: {hint_type, description, severity} 또는 null"
```

4. 결과 저장: so_description_hints 테이블

```sql
CREATE TABLE so_descriptions (
  order_no        TEXT PRIMARY KEY REFERENCES service_orders(order_no),
  description     TEXT NOT NULL,           -- 원본 전문
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE so_description_hints (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no        TEXT NOT NULL REFERENCES service_orders(order_no),
  hint_type       TEXT NOT NULL,           -- 'recurring_failure', 'cascade', 'sop_missing', 'design_defect', 'rework_pattern'
  description     TEXT NOT NULL,
  severity        TEXT CHECK (severity IN ('high','medium','low')),
  extracted_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 CIP 생성 플로우 (버튼 단위)

**Alert 상세 화면에서:**

1. **[CIP 아이템 생성]** 버튼 클릭
2. 모달 또는 새 페이지: CIP 생성 폼 열림
   - 자동 채워진 필드: 모델, 고객사라인, 파트그룹, 관련 S/O 목록, 수치 요약, 힌트 요약
   - 수동 입력 필드:
     - 제목 (자동 제안: "[파트그룹] [증상 키워드] 개선")
     - 상세 설명 (Tiptap 에디터, 자동 생성된 초안 편집)
     - 심각도 (1~10 슬라이더)
     - 발생도 (1~10, 호출빈도 기반 자동 제안)
     - 검출도 (1~10 슬라이더)
     - → AP 자동 산출 표시
     - 담당 엔지니어 (드롭다운, 국가/라인 기반 필터)
3. **[생성]** 버튼 → Zod 검증 → cip_items INSERT → 상태 'registered'
4. 담당 엔지니어 배정 시 → 상태 자동 전이 'investigating' → 알림 발송

**[계속 Watch]** 버튼 클릭:
1. 사유 입력 텍스트 필드 (필수)
2. **[확인]** → screening_results의 해당 항목에 watch_reason 저장
3. 다음 달 스크리닝 시 자동 재평가

### 5.4 현장조사 완료 플로우

1. 엔지니어가 S07 화면에서 모든 필드 입력
2. **[조사 완료 제출]** 클릭
3. Validator 실행:
   - root_cause 필드 not null → 실패 시 "근본 원인을 입력해주세요" 토스트
   - 첨부파일 1건 이상 → 실패 시 "현장 사진 또는 로그를 첨부해주세요" 토스트
4. 통과 시 → 상태 전이 'searching_solution'
5. Step 1~3 데이터를 통합한 문제정의 보고서 자동 생성
6. 매니저에게 "현장조사 완료" 알림 발송

---

## 6. DB 추가 테이블 (Step 1~3 전용)

기존 cip_platform_schema.sql에 추가:

```sql
-- 파트 그룹 (Title Sort 끝 2자리)
CREATE TABLE lu_part_groups (
  code    TEXT PRIMARY KEY,
  name    TEXT NOT NULL
);

INSERT INTO lu_part_groups VALUES
  ('00','CIP'),('01','CONTROLLER'),('02','LOADPORT'),
  ('03','ROBOT'),('04','BM MODULE'),('05','SOURCE'),
  ('06','SOFTWARE'),('07','VALVE'),('08','PROCESS KIT'),
  ('09','CHUCK'),('10','BOARD'),('11','MOTOR'),
  ('12','EPD'),('13','IGS BLOCK'),('14','HEATER'),
  ('15','RF'),('16','O2 ANALYZER'),('17','DISC'),
  ('18','VAPORIZER'),('99','ETC');

-- service_orders에 파트그룹 컬럼 추가
ALTER TABLE service_orders ADD COLUMN part_group_code TEXT 
  GENERATED ALWAYS AS (RIGHT(title_sort, 2)) STORED;
CREATE INDEX idx_so_part_group ON service_orders(part_group_code);

-- 스크리닝 결과 (5.1에서 정의)
-- so_descriptions (5.2에서 정의)
-- so_description_hints (5.2에서 정의)

-- MV 수정: 파트그룹 기준 집계
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_part_stats;
CREATE MATERIALIZED VIEW mv_monthly_part_stats AS
SELECT
  so.model_code,
  so.customer_line_code,
  so.part_group_code,
  DATE_TRUNC('month', so.work_start_date)::DATE AS month,
  COUNT(*)                                          AS call_count,
  COUNT(*) FILTER (WHERE so.rework = TRUE)          AS rework_count,
  ROUND(
    COUNT(*) FILTER (WHERE so.rework = TRUE)::NUMERIC 
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                 AS rework_rate,
  ROUND(AVG(so.total_working_time_min), 1)          AS avg_work_time_min,
  COUNT(DISTINCT so.equip_no)                       AS affected_equip_count
FROM service_orders so
WHERE so.work_start_date IS NOT NULL
  AND so.part_group_code IS NOT NULL
GROUP BY 1,2,3,4;
```

---

## 7. 의존성 패키지 요약

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "typescript": "^5",
    
    "@supabase/supabase-js": "^2",
    "@supabase/auth-helpers-nextjs": "latest",
    
    "tailwindcss": "^4",
    "@tailwindcss/typography": "latest",
    
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    
    "@tiptap/react": "^3",
    "@tiptap/pm": "latest",
    "@tiptap/starter-kit": "latest",
    "@tiptap/extension-image": "latest",
    "@tiptap/extension-table": "latest",
    "@tiptap/extension-placeholder": "latest",
    
    "recharts": "^2",
    "motion": "^12",
    
    "react-hook-form": "^7",
    "@hookform/resolvers": "latest",
    "zod": "^3",
    
    "papaparse": "^5",
    "date-fns": "^4",
    "simple-statistics": "^7",
    "nuqs": "^2",
    
    "@anthropic-ai/sdk": "latest"
  },
  "devDependencies": {
    "@types/papaparse": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest"
  }
}
```

---

## 8. 구현 순서 (권장)

| 순서 | 항목 | 예상 기간 |
|------|------|----------|
| 1 | 프로젝트 셋업 (Next.js + Tailwind v4 + shadcn + Supabase) | 1일 |
| 2 | DB 스키마 실행 + lu_part_groups + 추가 테이블 | 0.5일 |
| 3 | CSV 임포트 파이프라인 (S08) | 1일 (이미 구현됨, 통합만) |
| 4 | MV + 이상감지 엔진 (simple-statistics) | 2일 |
| 5 | Track B 힌트 추출 (Edge Function + LLM) | 1일 |
| 6 | 메인 대시보드 (S02) + Alert 상세 (S03) | 3일 |
| 7 | CIP 칸반보드 (S05) + CIP 상세 (S06) | 2일 |
| 8 | 현장조사 폼 (S07) + 5 Why 템플릿 | 1.5일 |
| 9 | 문제정의 보고서 (Tiptap 에디터) | 1.5일 |
| 10 | 알림 시스템 + RLS + 마무리 | 1.5일 |
| **합계** | | **~15일** |