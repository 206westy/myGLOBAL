import { type Period } from '../hooks/use-dashboard-store';

export const BRANCHES = ['Seoul', 'Busan', 'Taipei', 'Tokyo', 'Dublin', 'San Jose', 'Singapore', 'Shanghai'];

export const CATEGORIES = ['Assembly', 'Soldering', 'Inspection', 'Packaging', 'Testing'];

export interface BranchDataPoint {
  branch: string;
  rate: number;
}

export interface TrendDataPoint {
  period: string;
  rate: number;
}

export interface HeatmapCell {
  period: string;
  branch: string;
  rate: number;
}

export interface RawDataRow {
  date: string;
  branch: string;
  category: string;
  units: number;
  rate: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface ReworkDataset {
  avgRework: number;
  worstBranch: string;
  worstRate: number;
  bestBranch: string;
  bestRate: number;
  trend: TrendDataPoint[];
  byBranch: BranchDataPoint[];
  byCategory: { label: string; value: number }[];
  heatmap: HeatmapCell[];
  rawData: RawDataRow[];
}

const MONTHLY: ReworkDataset = {
  avgRework: 10.5,
  worstBranch: 'Tokyo',
  worstRate: 18.3,
  bestBranch: 'Singapore',
  bestRate: 4.1,
  trend: [
    { period: 'Apr 25', rate: 13.2 },
    { period: 'May 25', rate: 12.8 },
    { period: 'Jun 25', rate: 11.5 },
    { period: 'Jul 25', rate: 12.1 },
    { period: 'Aug 25', rate: 11.9 },
    { period: 'Sep 25', rate: 10.7 },
    { period: 'Oct 25', rate: 11.3 },
    { period: 'Nov 25', rate: 10.2 },
    { period: 'Dec 25', rate:  9.8 },
    { period: 'Jan 26', rate: 10.5 },
    { period: 'Feb 26', rate:  9.6 },
    { period: 'Mar 26', rate: 10.5 },
  ],
  byBranch: [
    { branch: 'Seoul',     rate: 10.2 },
    { branch: 'Busan',     rate: 12.7 },
    { branch: 'Taipei',    rate:  9.4 },
    { branch: 'Tokyo',     rate: 18.3 },
    { branch: 'Dublin',    rate:  7.7 },
    { branch: 'San Jose',  rate:  6.1 },
    { branch: 'Singapore', rate:  4.1 },
    { branch: 'Shanghai',  rate: 15.8 },
  ],
  byCategory: [
    { label: 'Assembly',   value: 34 },
    { label: 'Soldering',  value: 22 },
    { label: 'Inspection', value: 18 },
    { label: 'Packaging',  value: 14 },
    { label: 'Testing',    value: 12 },
  ],
  heatmap: BRANCHES.flatMap((branch) =>
    ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(
      (month, i) => ({
        period: month,
        branch,
        rate: parseFloat((5 + Math.abs(Math.sin((i + BRANCHES.indexOf(branch)) * 0.7) * 18)).toFixed(1)),
      })
    )
  ),
  rawData: Array.from({ length: 30 }, (_, i) => {
    const branch = BRANCHES[i % BRANCHES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const rate = parseFloat((4 + Math.abs(Math.sin(i * 0.9) * 16)).toFixed(1));
    return {
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      branch,
      category,
      units: 80 + i * 7,
      rate,
      status: rate < 8 ? 'Normal' : rate < 15 ? 'Warning' : 'Critical',
    };
  }),
};

const QUARTERLY: ReworkDataset = {
  avgRework: 11.4,
  worstBranch: 'Shanghai',
  worstRate: 20.1,
  bestBranch: 'Dublin',
  bestRate: 5.2,
  trend: [
    { period: 'Q2 24', rate: 15.1 },
    { period: 'Q3 24', rate: 13.8 },
    { period: 'Q4 24', rate: 12.2 },
    { period: 'Q1 25', rate: 13.5 },
    { period: 'Q2 25', rate: 12.6 },
    { period: 'Q3 25', rate: 11.4 },
    { period: 'Q4 25', rate: 10.3 },
    { period: 'Q1 26', rate: 11.4 },
  ],
  byBranch: [
    { branch: 'Seoul',     rate: 11.8 },
    { branch: 'Busan',     rate: 13.2 },
    { branch: 'Taipei',    rate: 10.1 },
    { branch: 'Tokyo',     rate: 17.6 },
    { branch: 'Dublin',    rate:  5.2 },
    { branch: 'San Jose',  rate:  7.3 },
    { branch: 'Singapore', rate:  6.0 },
    { branch: 'Shanghai',  rate: 20.1 },
  ],
  byCategory: [
    { label: 'Assembly',   value: 31 },
    { label: 'Soldering',  value: 25 },
    { label: 'Inspection', value: 20 },
    { label: 'Packaging',  value: 13 },
    { label: 'Testing',    value: 11 },
  ],
  heatmap: BRANCHES.flatMap((branch) =>
    ['Q1', 'Q2', 'Q3', 'Q4'].flatMap((q) =>
      ['24', '25', '26'].slice(0, q === 'Q1' && branch === 'Seoul' ? 3 : 2).map((yr) => ({
        period: `${q} ${yr}`,
        branch,
        rate: parseFloat((5 + Math.abs(Math.sin((BRANCHES.indexOf(branch) + parseInt(yr)) * 0.8) * 16)).toFixed(1)),
      }))
    )
  ),
  rawData: Array.from({ length: 30 }, (_, i) => {
    const branch = BRANCHES[i % BRANCHES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const rate = parseFloat((5 + Math.abs(Math.sin(i * 1.1) * 17)).toFixed(1));
    return {
      date: `Q${(i % 4) + 1} 2025`,
      branch,
      category,
      units: 300 + i * 20,
      rate,
      status: rate < 8 ? 'Normal' : rate < 15 ? 'Warning' : 'Critical',
    };
  }),
};

const YEARLY: ReworkDataset = {
  avgRework: 12.1,
  worstBranch: 'Tokyo',
  worstRate: 19.4,
  bestBranch: 'San Jose',
  bestRate: 5.8,
  trend: [
    { period: '2020', rate: 21.3 },
    { period: '2021', rate: 19.8 },
    { period: '2022', rate: 17.2 },
    { period: '2023', rate: 15.6 },
    { period: '2024', rate: 13.4 },
    { period: '2025', rate: 12.1 },
  ],
  byBranch: [
    { branch: 'Seoul',     rate: 12.0 },
    { branch: 'Busan',     rate: 14.5 },
    { branch: 'Taipei',    rate: 10.8 },
    { branch: 'Tokyo',     rate: 19.4 },
    { branch: 'Dublin',    rate:  7.2 },
    { branch: 'San Jose',  rate:  5.8 },
    { branch: 'Singapore', rate:  6.5 },
    { branch: 'Shanghai',  rate: 17.1 },
  ],
  byCategory: [
    { label: 'Assembly',   value: 36 },
    { label: 'Soldering',  value: 20 },
    { label: 'Inspection', value: 19 },
    { label: 'Packaging',  value: 15 },
    { label: 'Testing',    value: 10 },
  ],
  heatmap: BRANCHES.flatMap((branch) =>
    ['2020', '2021', '2022', '2023', '2024', '2025'].map((yr) => ({
      period: yr,
      branch,
      rate: parseFloat((5 + Math.abs(Math.sin((BRANCHES.indexOf(branch) + parseInt(yr)) * 0.3) * 18)).toFixed(1)),
    }))
  ),
  rawData: Array.from({ length: 30 }, (_, i) => {
    const branch = BRANCHES[i % BRANCHES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const rate = parseFloat((5 + Math.abs(Math.sin(i * 0.7) * 15)).toFixed(1));
    return {
      date: String(2020 + (i % 6)),
      branch,
      category,
      units: 1200 + i * 80,
      rate,
      status: rate < 8 ? 'Normal' : rate < 15 ? 'Warning' : 'Critical',
    };
  }),
};

export const REWORK_DATASETS: Record<Period, ReworkDataset> = {
  monthly:   MONTHLY,
  quarterly: QUARTERLY,
  yearly:    YEARLY,
};
