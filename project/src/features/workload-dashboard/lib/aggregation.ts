import { type DimensionKey, type AggregatedPoint, type FilterValue, type Granularity, type RawTaskRow } from './types';
import { MOCK_TASKS } from '../constants/mock-data';

const DIM_FIELD: Record<DimensionKey, keyof RawTaskRow> = {
  country_code:         'country_code',
  branch:               'branch',
  business_type_code:   'business_type_code',
  act_type_code:        'act_type_code',
  order_type_name:      'order_type_name',
  partner_company_name: 'partner_company_name',
};

const WPI_MAX = (8 * 0.8 * 1.8) / (4.5 * 2);   // 1.28
const WEEKDAYS_PER_MONTH = 22;                  // 휴일 캘린더 단순화

function applyFilters(rows: RawTaskRow[], filters: FilterValue[]): RawTaskRow[] {
  if (filters.length === 0) return rows;
  return rows.filter((row) =>
    filters.every((f) => {
      if (f.values.length === 0) return true;
      const fieldVal = row[DIM_FIELD[f.dimension]] as string;
      return f.values.includes(fieldVal);
    })
  );
}

function periodOf(yearMonth: string, granularity: Granularity): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (granularity === 'year')    return `${y}`;
  if (granularity === 'quarter') return `${y} Q${Math.ceil(m / 3)}`;
  return yearMonth;
}

function monthsInPeriod(granularity: Granularity): number {
  if (granularity === 'year')    return 12;
  if (granularity === 'quarter') return 3;
  return 1;
}

function stdForCompany(company: string): number {
  return company === 'PSK' || company === 'PSKH' ? 4.5 : 5.5;
}

interface CountryPeriodMetrics {
  workload:   number;
  pr:         number;   // 0~100
  wpi:        number;   // 1~10 normalized
  totalHours: number;
}

/**
 * mysupport calculation.ts 식 이식.
 * - workload : Σ(h_i² / effectiveWeekdays) / Σh_i
 *              h_i = totalHours / monthCount (월 평균 시간), effectiveWeekdays = weekdays / monthCount (월 평균 근무일수)
 *              결과는 "하루 평균 작업시간" 차원의 가중평균 (~3~7 h/day).
 * - pr       : 100 × Σ(work_days_i / totalWeekdays) / worker_count
 * - wpi      : Σ(compWPI × company_hours) / total_hours, 정규화 1~10
 * - volume   : Σworking_hour
 */
function computeForCountryPeriod(rows: RawTaskRow[], monthCount: number): CountryPeriodMetrics {
  if (rows.length === 0) {
    return { workload: 0, pr: 0, wpi: 0, totalHours: 0 };
  }

  // Worker별 집계
  const workerStats = new Map<string, { hours: number; days: Set<string>; company: string }>();
  let totalHours = 0;
  for (const r of rows) {
    totalHours += r.working_hour;
    const stat = workerStats.get(r.worker_name)
      ?? { hours: 0, days: new Set<string>(), company: r.partner_company_name };
    stat.hours += r.working_hour;
    stat.days.add(r.work_start_date);
    workerStats.set(r.worker_name, stat);
  }

  // 분기/연 단위로 늘어나도 mysupport와 동일하게 "월 평균"으로 정규화 (workload용).
  // PR은 기간 전체 weekdays를 분모로 사용.
  const totalWeekdays     = WEEKDAYS_PER_MONTH * monthCount;
  const effectiveWeekdays = WEEKDAYS_PER_MONTH;

  // workload: Σ(h_i² / effectiveWeekdays) / Σh_i
  let sumHi  = 0;
  let sumH2D = 0;
  workerStats.forEach((s) => {
    if (s.hours <= 0) return;
    const h_i = s.hours / monthCount;
    sumHi  += h_i;
    sumH2D += (h_i * h_i) / effectiveWeekdays;
  });
  const finalWorkload = sumHi > 0 ? sumH2D / sumHi : 0;

  // participation rate: 기간 전체 weekdays 기준
  let prRatioSum = 0;
  workerStats.forEach((s) => {
    prRatioSum += s.days.size / totalWeekdays;
  });
  const participationRate = workerStats.size > 0
    ? (prRatioSum / workerStats.size) * 100
    : 0;
  const participationRatio = participationRate / 100;

  // WPI: company별 가중평균
  const companyHours = new Map<string, number>();
  for (const r of rows) {
    companyHours.set(r.partner_company_name, (companyHours.get(r.partner_company_name) ?? 0) + r.working_hour);
  }
  let wpiWeightedSum = 0;
  companyHours.forEach((compHours, company) => {
    const STD = stdForCompany(company);
    const compWPI = finalWorkload * participationRatio * (1 + participationRatio) / (STD * 2);
    wpiWeightedSum += compWPI * compHours;
  });
  const wpiRaw = totalHours > 0 ? wpiWeightedSum / totalHours : 0;

  const wpi = wpiRaw <= 0
    ? 0
    : Math.min(10, Math.max(1, 1 + (wpiRaw / WPI_MAX) * 9));

  return {
    workload: finalWorkload,
    pr:       participationRate,
    wpi,
    totalHours,
  };
}

export function aggregate(filters: FilterValue[], granularity: Granularity): AggregatedPoint[] {
  const filtered   = applyFilters(MOCK_TASKS, filters);
  const monthCount = monthsInPeriod(granularity);

  // period → country → rows
  const buckets = new Map<string, Map<string, RawTaskRow[]>>();
  for (const r of filtered) {
    const ym     = r.work_start_date.slice(0, 7);
    const period = periodOf(ym, granularity);
    let byCountry = buckets.get(period);
    if (!byCountry) {
      byCountry = new Map();
      buckets.set(period, byCountry);
    }
    const arr = byCountry.get(r.country_code) ?? [];
    arr.push(r);
    byCountry.set(r.country_code, arr);
  }

  const out: AggregatedPoint[] = [];
  for (const [period, byCountry] of buckets) {
    let weightedWorkload = 0;
    let weightedPr       = 0;
    let weightedWpi      = 0;
    let totalHoursSum    = 0;

    byCountry.forEach((rows) => {
      const m = computeForCountryPeriod(rows, monthCount);
      weightedWorkload += m.workload * m.totalHours;
      weightedPr       += m.pr       * m.totalHours;
      weightedWpi      += m.wpi      * m.totalHours;
      totalHoursSum    += m.totalHours;
    });

    out.push({
      period,
      workload: totalHoursSum > 0 ? +(weightedWorkload / totalHoursSum).toFixed(2) : 0,
      pr:       totalHoursSum > 0 ? +(weightedPr       / totalHoursSum).toFixed(1) : 0,
      wpi:      totalHoursSum > 0 ? +(weightedWpi      / totalHoursSum).toFixed(2) : 0,
      volume:   +totalHoursSum.toFixed(0),
    });
  }

  return out.sort((a, b) => a.period.localeCompare(b.period));
}

export function granularityForRange(monthsInView: number): Granularity {
  if (monthsInView >= 60) return 'year';
  if (monthsInView >= 12) return 'quarter';
  return 'month';
}

export function summarizeKpis(points: AggregatedPoint[]) {
  if (points.length === 0) {
    return {
      totalVolume: 0,
      avgWorkload: 0,
      peakPeriod:  '—',
      peakVolume:  0,
    };
  }
  const totalVolume = points.reduce((s, p) => s + p.volume, 0);
  const avgWorkload = points.reduce((s, p) => s + p.workload, 0) / points.length;
  const peak        = points.reduce((m, p) => (p.volume > m.volume ? p : m), points[0]);
  return {
    totalVolume,
    avgWorkload: +avgWorkload.toFixed(2),
    peakPeriod:  peak.period,
    peakVolume:  peak.volume,
  };
}
