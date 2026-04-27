export type MetricKey = 'workload' | 'pr' | 'wpi' | 'volume';

export type DimensionKey =
  | 'country_code'
  | 'branch'
  | 'business_type_code'
  | 'act_type_code'
  | 'order_type_name'
  | 'partner_company_name';

export type IndexKind = 'metric' | 'dimension';

export interface IndexDef {
  key: MetricKey | DimensionKey;
  kind: IndexKind;
  label: string;
}

export type Granularity = 'year' | 'quarter' | 'month';

export interface FilterValue {
  dimension: DimensionKey;
  values: string[];
}

export interface ChartCardConfig {
  id: string;
  metrics: MetricKey[];
  filters: FilterValue[];
  brushRange: [number, number];
}

export interface RawTaskRow {
  work_start_date:       string;   // 'YYYY-MM-DD'
  country_code:          string;
  branch:                string;   // 보류 — 매핑 미정
  business_type_code:    string;
  act_type_code:         string;
  order_type_name:       string;
  partner_company_name:  string;
  worker_name:           string;
  working_hour:          number;
}

export interface AggregatedPoint {
  period: string;
  workload: number;
  pr:       number;
  wpi:      number;
  volume:   number;
}
