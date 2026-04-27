import { type DimensionKey, type RawTaskRow } from '../lib/types';

const COUNTRY_CODES = ['KR', 'JP', 'TW', 'IE', 'US'];
const BRANCHES_BY_COUNTRY: Record<string, string[]> = {
  KR: ['Hwaseong',  'Pyeongtaek'],
  JP: ['Yokkaichi', 'Kitakami'  ],
  TW: ['Hsinchu',   'Tainan'    ],
  IE: ['Leixlip'                ],
  US: ['Boise',     'Phoenix'   ],
};
const BUSINESS_TYPE_CODES = ['DS', 'PE', 'DC', 'HD', '3D', 'RE'];
const ACT_TYPE_CODES      = ['INS', 'FIX', 'RWK', 'PM'];
const ORDER_TYPE_NAMES    = ['Install', 'Maintenance', 'Repair', 'Inspection'];
const PARTNER_COMPANIES   = ['PSK', 'PSKH', 'BP-A', 'BP-B'];

const WORKERS_PER_BRANCH = 6;       // 지점당 작업자 수
const WORK_DAYS_PER_MONTH = 12;     // 작업자 1명당 월 평균 근무일
const SKIP_DAY_PROB       = 0.20;   // 작업자별 일별 누락 확률
const TASKS_PER_DAY_MIN   = 1;
const TASKS_PER_DAY_MAX   = 3;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildMonths(start: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function weekdaysInMonth(year: number, monthIdx0: number): number[] {
  const out: number[] = [];
  const last = new Date(year, monthIdx0 + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dow = new Date(year, monthIdx0, d).getDay();
    if (dow !== 0 && dow !== 6) out.push(d);
  }
  return out;
}

export const MOCK_MONTHS = buildMonths(new Date(2024, 0, 1), 28);

interface Worker {
  name:    string;
  country: string;
  branch:  string;
  company: string;
}

const WORKERS: Worker[] = (() => {
  const rand = seededRandom(7);
  const list: Worker[] = [];
  for (const country of COUNTRY_CODES) {
    for (const branch of BRANCHES_BY_COUNTRY[country]) {
      for (let i = 0; i < WORKERS_PER_BRANCH; i++) {
        list.push({
          name:    `${country}-${branch.slice(0, 3)}-${String(i + 1).padStart(2, '0')}`,
          country,
          branch,
          company: pick(PARTNER_COMPANIES, rand),
        });
      }
    }
  }
  return list;
})();

export const MOCK_TASKS: RawTaskRow[] = (() => {
  const rand = seededRandom(42);
  const rows: RawTaskRow[] = [];

  for (const ym of MOCK_MONTHS) {
    const [y, m] = ym.split('-').map(Number);
    const days = weekdaysInMonth(y, m - 1);

    for (const w of WORKERS) {
      // 작업자별 이번 달 근무일 표본 추출 (~12 days)
      const sampled = new Set<number>();
      const target = Math.min(days.length, WORK_DAYS_PER_MONTH);
      while (sampled.size < target) {
        sampled.add(days[Math.floor(rand() * days.length)]);
      }

      for (const day of sampled) {
        if (rand() < SKIP_DAY_PROB) continue;
        const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const taskCount = TASKS_PER_DAY_MIN + Math.floor(rand() * (TASKS_PER_DAY_MAX - TASKS_PER_DAY_MIN + 1));
        let dailyHours  = 4 + rand() * 5;   // 작업자의 그날 총 작업시간 4~9h

        for (let t = 0; t < taskCount; t++) {
          const share = t === taskCount - 1 ? dailyHours : dailyHours * (0.3 + rand() * 0.5);
          dailyHours -= share;
          rows.push({
            work_start_date:      dayStr,
            country_code:         w.country,
            branch:               w.branch,
            business_type_code:   pick(BUSINESS_TYPE_CODES, rand),
            act_type_code:        pick(ACT_TYPE_CODES,      rand),
            order_type_name:      pick(ORDER_TYPE_NAMES,    rand),
            partner_company_name: w.company,
            worker_name:          w.name,
            working_hour:         +Math.max(0.1, share).toFixed(2),
          });
          if (dailyHours <= 0.1) break;
        }
      }
    }
  }
  return rows;
})();

export const MOCK_DIMENSION_VALUES: Record<DimensionKey, string[]> = {
  country_code:         COUNTRY_CODES,
  branch:               Object.values(BRANCHES_BY_COUNTRY).flat(),
  business_type_code:   BUSINESS_TYPE_CODES,
  act_type_code:        ACT_TYPE_CODES,
  order_type_name:      ORDER_TYPE_NAMES,
  partner_company_name: PARTNER_COMPANIES,
};
