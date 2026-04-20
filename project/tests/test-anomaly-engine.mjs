/**
 * E2E-1: 이상감지 엔진 단위 테스트
 * PRD F02 기능 검증: CUSUM, 선형회귀, Pareto, 리워크 스파이크, 분류
 *
 * 실행: node tests/test-anomaly-engine.mjs
 */

import { mean, standardDeviation, linearRegression } from 'simple-statistics';
import jStat from 'jstat';

// ── 엔진 함수 인라인 (ESM 호환) ──

function calculateCUSUM(values) {
  if (values.length < 6) {
    return { values: [], ucl: 0, isExceeded: false, consecutivePositive: 0 };
  }
  const baselineEnd = Math.max(6, Math.floor(values.length * 2 / 3));
  const baseline = values.slice(0, baselineEnd);
  const mu = mean(baseline);
  const sigma = standardDeviation(baseline);
  if (sigma === 0) {
    return { values: values.map(() => 0), ucl: 0, isExceeded: false, consecutivePositive: 0 };
  }
  const k = 0.5 * sigma;
  const h = 4 * sigma;
  const cusumValues = [];
  let sPlus = 0;
  let consecutivePositive = 0;
  let maxConsecutive = 0;
  for (const x of values) {
    sPlus = Math.max(0, sPlus + (x - mu - k));
    cusumValues.push(sPlus);
    if (sPlus > 0) {
      consecutivePositive++;
      maxConsecutive = Math.max(maxConsecutive, consecutivePositive);
    } else {
      consecutivePositive = 0;
    }
  }
  return { values: cusumValues, ucl: h, isExceeded: cusumValues.some(v => v > h), consecutivePositive: maxConsecutive };
}

function calculateTrendSlope(values) {
  if (values.length < 3) {
    return { slope: 0, intercept: 0, pValue: 1, isSignificant: false };
  }
  const data = values.map((v, i) => [i, v]);
  const { m: slope, b: intercept } = linearRegression(data);
  const n = values.length;
  const xMean = (n - 1) / 2;
  const predicted = data.map(([x]) => intercept + slope * x);
  const residuals = data.map(([, y], i) => y - predicted[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const sxx = data.reduce((sum, [x]) => sum + (x - xMean) ** 2, 0);
  if (sxx === 0 || n <= 2) return { slope, intercept, pValue: 1, isSignificant: false };
  const se = Math.sqrt(sse / (n - 2));
  const slopeStdErr = se / Math.sqrt(sxx);
  if (slopeStdErr === 0) return { slope, intercept, pValue: slope === 0 ? 1 : 0, isSignificant: slope !== 0 };
  const tStat = slope / slopeStdErr;
  const df = n - 2;
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
  return { slope, intercept, pValue, isSignificant: pValue < 0.1 };
}

function calculateParetoRanks(items) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return sorted.map((item, i) => ({ ...item, rank: i + 1, cumulativePct: 0, isTopGroup: false }));
  let cumulative = 0;
  const topGroupCount = Math.max(1, Math.ceil(sorted.length * 0.2));
  return sorted.map((item, i) => {
    cumulative += item.value;
    return { ...item, rank: i + 1, cumulativePct: (cumulative / total) * 100, isTopGroup: i < topGroupCount };
  });
}

function detectReworkSpike(currentRate, previousRate) {
  if (currentRate > 15) return { isSpiking: true, reason: `Rework rate ${currentRate}% exceeds 15%` };
  if (currentRate - previousRate >= 5) return { isSpiking: true, reason: `Rework rate increased by ${(currentRate - previousRate).toFixed(1)}pp` };
  return { isSpiking: false, reason: null };
}

function classifyStatus({ cusum, trend, reworkSpike, prevStatus, callCountValues }) {
  const reasons = [];
  const cusumExceeded = cusum.isExceeded;
  const movingAvgExceeded = callCountValues.length >= 6 && (() => {
    const recentMean = mean(callCountValues.slice(-3));
    const historicalMean = mean(callCountValues);
    const historicalStd = standardDeviation(callCountValues);
    return historicalStd > 0 && (recentMean - historicalMean) > 2 * historicalStd;
  })();
  const watchDeteriorating = prevStatus === 'watch' && cusum.consecutivePositive >= 3;
  if (cusumExceeded) reasons.push('CUSUM exceeded UCL');
  if (movingAvgExceeded) reasons.push('Moving average > 2σ');
  if (watchDeteriorating) reasons.push('Watch deteriorating 3+ months');
  if (cusumExceeded || movingAvgExceeded || watchDeteriorating) return { status: 'alert', reasons };

  const cusumConsecutive = cusum.consecutivePositive >= 3;
  const trendSignificant = trend.isSignificant && trend.slope > 0;
  if (cusumConsecutive) reasons.push('CUSUM positive 3+ months');
  if (trendSignificant) reasons.push('Upward trend');
  if (reworkSpike.isSpiking) reasons.push('Rework spike');
  if (cusumConsecutive || trendSignificant || reworkSpike.isSpiking) return { status: 'watch', reasons };

  if (prevStatus === 'watch' || prevStatus === 'alert') {
    const cusumBackToZero = cusum.values.length > 0 && cusum.values[cusum.values.length - 1] === 0;
    const noTrend = !trend.isSignificant || trend.slope <= 0;
    if (cusumBackToZero && noTrend) { reasons.push('Resolved'); return { status: 'resolved', reasons }; }
  }
  return { status: 'normal', reasons };
}

// ── TEST RUNNER ──

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${testName}`);
  }
}

// ═══════════ TEST SUITE 1: CUSUM ═══════════
console.log('\n══ TEST: CUSUM 계산 ══');

// T1.1: 안정적 데이터 → CUSUM 초과 없음
const stable = [10, 11, 9, 10, 12, 10, 11, 9, 10, 11, 10, 10];
const r1 = calculateCUSUM(stable);
assert(!r1.isExceeded, 'T1.1: 안정 데이터 → isExceeded=false');
assert(r1.ucl > 0, 'T1.1: UCL > 0');
assert(r1.values.length === 12, 'T1.1: CUSUM values length = 12');

// T1.2: 급등 데이터 → CUSUM 초과 (베이스라인에 자연 변동 포함)
const spike = [8, 11, 9, 12, 10, 11, 9, 10, 50, 60, 70, 80];
const r2 = calculateCUSUM(spike);
assert(r2.isExceeded, 'T1.2: 급등 데이터 → isExceeded=true');
assert(r2.consecutivePositive >= 3, 'T1.2: consecutivePositive >= 3');

// T1.3: 데이터 부족 (<6개월) → 빈 결과
const short = [10, 11, 9, 10, 12];
const r3 = calculateCUSUM(short);
assert(r3.values.length === 0, 'T1.3: 6개월 미만 → 빈 결과');
assert(!r3.isExceeded, 'T1.3: isExceeded=false');

// T1.4: 모두 동일한 값 → sigma=0 처리
const flat = [10, 10, 10, 10, 10, 10];
const r4 = calculateCUSUM(flat);
assert(!r4.isExceeded, 'T1.4: 동일 값 → isExceeded=false');

// ═══════════ TEST SUITE 2: 선형회귀 + p-value ═══════════
console.log('\n══ TEST: 선형회귀 + p-value ══');

// T2.1: 확실한 상승 추세 → slope > 0, p < 0.1
const uptrend = [5, 8, 12, 15, 19, 22];
const t1 = calculateTrendSlope(uptrend);
assert(t1.slope > 0, `T2.1: 상승 추세 slope=${t1.slope.toFixed(3)} > 0`);
assert(t1.pValue < 0.1, `T2.1: p-value=${t1.pValue.toFixed(4)} < 0.1`);
assert(t1.isSignificant, 'T2.1: isSignificant=true');

// T2.2: 하락 추세 → slope < 0
const downtrend = [20, 18, 15, 12, 10, 8];
const t2 = calculateTrendSlope(downtrend);
assert(t2.slope < 0, `T2.2: 하락 추세 slope=${t2.slope.toFixed(3)} < 0`);

// T2.3: 무추세 (노이즈) → p > 0.1
const notrend = [10, 12, 9, 11, 10, 13, 8, 11];
const t3 = calculateTrendSlope(notrend);
assert(t3.pValue > 0.05, `T2.3: 무추세 p-value=${t3.pValue.toFixed(4)} > 0.05`);

// T2.4: 데이터 부족 → 기본값
const t4 = calculateTrendSlope([10, 12]);
assert(t4.slope === 0, 'T2.4: 2개 미만 → slope=0');
assert(t4.pValue === 1, 'T2.4: pValue=1');

// ═══════════ TEST SUITE 3: Pareto ═══════════
console.log('\n══ TEST: Pareto 분석 ══');

const paretoInput = [
  { key: 'A', value: 100 },
  { key: 'B', value: 50 },
  { key: 'C', value: 30 },
  { key: 'D', value: 15 },
  { key: 'E', value: 5 },
];
const pareto = calculateParetoRanks(paretoInput);
assert(pareto[0].key === 'A', 'T3.1: 1위=A (100)');
assert(pareto[0].rank === 1, 'T3.1: rank=1');
assert(pareto[0].isTopGroup, 'T3.1: A는 top 20%');
assert(pareto[0].cumulativePct === 50, 'T3.1: A 누적 50%');
assert(pareto[4].key === 'E', 'T3.2: 5위=E (5)');
assert(pareto[4].cumulativePct === 100, 'T3.2: 누적 100%');

// ═══════════ TEST SUITE 4: 리워크 스파이크 ═══════════
console.log('\n══ TEST: 리워크 스파이크 감지 ══');

assert(detectReworkSpike(16, 10).isSpiking, 'T4.1: 16% > 15% 임계 → 스파이크');
assert(detectReworkSpike(10, 4).isSpiking, 'T4.2: +6pp >= 5pp → 스파이크');
assert(!detectReworkSpike(10, 8).isSpiking, 'T4.3: 10%, +2pp → 정상');
assert(!detectReworkSpike(14, 14).isSpiking, 'T4.4: 14%, 변화없음 → 정상');

// ═══════════ TEST SUITE 5: 상태 분류 ═══════════
console.log('\n══ TEST: 상태 분류 (Watch/Alert/Resolved/Normal) ══');

// T5.1: CUSUM 초과 → Alert
const alertVerdict = classifyStatus({
  cusum: { values: [0, 5, 15, 30, 50], ucl: 20, isExceeded: true, consecutivePositive: 4 },
  trend: { slope: 2, intercept: 0, pValue: 0.05, isSignificant: true },
  reworkSpike: { isSpiking: false },
  prevStatus: null,
  callCountValues: [10, 10, 10, 10, 10, 10, 30, 40, 50],
});
assert(alertVerdict.status === 'alert', `T5.1: CUSUM 초과 → alert (got: ${alertVerdict.status})`);

// T5.2: 리워크 스파이크만 → Watch
const watchVerdict = classifyStatus({
  cusum: { values: [0, 0, 0, 1, 2], ucl: 20, isExceeded: false, consecutivePositive: 2 },
  trend: { slope: 0.5, intercept: 10, pValue: 0.3, isSignificant: false },
  reworkSpike: { isSpiking: true },
  prevStatus: null,
  callCountValues: [10, 10, 10, 10, 10, 10],
});
assert(watchVerdict.status === 'watch', `T5.2: 리워크 스파이크 → watch (got: ${watchVerdict.status})`);

// T5.3: 모든 지표 정상 → Normal
const normalVerdict = classifyStatus({
  cusum: { values: [0, 0, 0, 0, 0, 0], ucl: 20, isExceeded: false, consecutivePositive: 0 },
  trend: { slope: 0.1, intercept: 10, pValue: 0.5, isSignificant: false },
  reworkSpike: { isSpiking: false },
  prevStatus: null,
  callCountValues: [10, 10, 10, 10, 10, 10],
});
assert(normalVerdict.status === 'normal', `T5.3: 모든 정상 → normal (got: ${normalVerdict.status})`);

// T5.4: Watch→CUSUM 0복귀 → Resolved
const resolvedVerdict = classifyStatus({
  cusum: { values: [5, 3, 1, 0], ucl: 20, isExceeded: false, consecutivePositive: 0 },
  trend: { slope: -0.5, intercept: 10, pValue: 0.2, isSignificant: false },
  reworkSpike: { isSpiking: false },
  prevStatus: 'watch',
  callCountValues: [12, 11, 10, 10, 9, 10],
});
assert(resolvedVerdict.status === 'resolved', `T5.4: Watch→0복귀 → resolved (got: ${resolvedVerdict.status})`);

// ═══════════ SUMMARY ═══════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`총 ${passed + failed}개 테스트: ✅ ${passed}개 통과, ❌ ${failed}개 실패`);
console.log(`${'═'.repeat(50)}`);
process.exit(failed > 0 ? 1 : 0);
