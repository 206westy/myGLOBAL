import { mean, standardDeviation, linearRegression } from 'simple-statistics';
import jStat from 'jstat';

// Types
export interface TimeSeriesPoint {
  month: string;
  value: number;
}

export interface CUSUMResult {
  values: number[];
  ucl: number;
  isExceeded: boolean;
  consecutivePositive: number;
}

export interface TrendResult {
  slope: number;
  intercept: number;
  pValue: number;
  isSignificant: boolean;
}

export interface ParetoItem {
  key: string;
  value: number;
  rank: number;
  cumulativePct: number;
  isTopGroup: boolean;
}

export interface ScreeningVerdict {
  status: 'watch' | 'alert' | 'resolved' | 'normal';
  reasons: string[];
}

// ── CUSUM Calculation ──
// PRD: μ₀ = 과거 12개월 평균, σ는 베이스라인(앞쪽 2/3)에서 산출
// 최근 급등분이 σ를 팽창시키는 것을 방지
export function calculateCUSUM(values: number[]): CUSUMResult {
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

  const cusumValues: number[] = [];
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

  return {
    values: cusumValues,
    ucl: h,
    isExceeded: cusumValues.some(v => v > h),
    consecutivePositive: maxConsecutive,
  };
}

// ── Linear Regression with p-value ──
export function calculateTrendSlope(values: number[]): TrendResult {
  if (values.length < 3) {
    return { slope: 0, intercept: 0, pValue: 1, isSignificant: false };
  }

  const data: [number, number][] = values.map((v, i) => [i, v]);
  const { m: slope, b: intercept } = linearRegression(data);

  const n = values.length;
  const xMean = (n - 1) / 2;
  const predicted = data.map(([x]) => intercept + slope * x);
  const residuals = data.map(([, y], i) => y - predicted[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const sxx = data.reduce((sum, [x]) => sum + (x - xMean) ** 2, 0);

  if (sxx === 0 || n <= 2) {
    return { slope, intercept, pValue: 1, isSignificant: false };
  }

  const se = Math.sqrt(sse / (n - 2));
  const slopeStdErr = se / Math.sqrt(sxx);

  if (slopeStdErr === 0) {
    return { slope, intercept, pValue: slope === 0 ? 1 : 0, isSignificant: slope !== 0 };
  }

  const tStat = slope / slopeStdErr;
  const df = n - 2;

  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));

  return {
    slope,
    intercept,
    pValue,
    isSignificant: pValue < 0.1,
  };
}

// ── Pareto Analysis ──
export function calculateParetoRanks(items: { key: string; value: number }[]): ParetoItem[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) return sorted.map((item, i) => ({
    ...item, rank: i + 1, cumulativePct: 0, isTopGroup: false,
  }));

  let cumulative = 0;
  const topGroupCount = Math.max(1, Math.ceil(sorted.length * 0.2));

  return sorted.map((item, i) => {
    cumulative += item.value;
    return {
      ...item,
      rank: i + 1,
      cumulativePct: (cumulative / total) * 100,
      isTopGroup: i < topGroupCount,
    };
  });
}

// ── Rework Spike Detection ──
export function detectReworkSpike(
  currentRate: number,
  previousRate: number
): { isSpiking: boolean; reason: string | null } {
  if (currentRate > 15) {
    return { isSpiking: true, reason: `Rework rate ${currentRate}% exceeds 15% threshold` };
  }
  if (currentRate - previousRate >= 5) {
    return { isSpiking: true, reason: `Rework rate increased by ${(currentRate - previousRate).toFixed(1)}pp (>= 5pp)` };
  }
  return { isSpiking: false, reason: null };
}

// ── Status Classification ──
export function classifyStatus(params: {
  cusum: CUSUMResult;
  trend: TrendResult;
  reworkSpike: { isSpiking: boolean };
  prevStatus: string | null;
  callCountValues: number[];
}): ScreeningVerdict {
  const { cusum, trend, reworkSpike, prevStatus, callCountValues } = params;
  const reasons: string[] = [];

  // Alert conditions
  const cusumExceeded = cusum.isExceeded;
  const movingAvgExceeded = callCountValues.length >= 6 && (() => {
    const recentMean = mean(callCountValues.slice(-3));
    const historicalMean = mean(callCountValues);
    const historicalStd = standardDeviation(callCountValues);
    return historicalStd > 0 && (recentMean - historicalMean) > 2 * historicalStd;
  })();
  const watchDeteriorating = prevStatus === 'watch' && cusum.consecutivePositive >= 3;

  if (cusumExceeded) reasons.push('CUSUM exceeded UCL');
  if (movingAvgExceeded) reasons.push('Moving average > 2σ above historical');
  if (watchDeteriorating) reasons.push('Watch deteriorating for 3+ months');

  if (cusumExceeded || movingAvgExceeded || watchDeteriorating) {
    return { status: 'alert', reasons };
  }

  // Watch conditions
  const cusumConsecutive = cusum.consecutivePositive >= 3;
  const trendSignificant = trend.isSignificant && trend.slope > 0;

  if (cusumConsecutive) reasons.push(`CUSUM positive for ${cusum.consecutivePositive} consecutive months`);
  if (trendSignificant) reasons.push(`Upward trend (slope=${trend.slope.toFixed(2)}, p=${trend.pValue.toFixed(3)})`);
  if (reworkSpike.isSpiking) reasons.push('Rework rate spike');

  if (cusumConsecutive || trendSignificant || reworkSpike.isSpiking) {
    return { status: 'watch', reasons };
  }

  // Resolved: was Watch/Alert, now CUSUM back to 0 and trend not significant
  if (prevStatus === 'watch' || prevStatus === 'alert') {
    const cusumBackToZero = cusum.values.length > 0 && cusum.values[cusum.values.length - 1] === 0;
    const noTrend = !trend.isSignificant || trend.slope <= 0;

    if (cusumBackToZero && noTrend) {
      reasons.push('CUSUM returned to 0, no significant trend');
      return { status: 'resolved', reasons };
    }
  }

  return { status: 'normal', reasons };
}
