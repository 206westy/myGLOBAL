import { type IndexDef } from '../lib/types';

export const METRIC_INDICES: IndexDef[] = [
  { key: 'workload', kind: 'metric', label: 'Workload'      },
  { key: 'pr',       kind: 'metric', label: 'Participation' },
  { key: 'wpi',      kind: 'metric', label: 'WPI'           },
  { key: 'volume',   kind: 'metric', label: 'Volume'        },
];

export const DIMENSION_INDICES: IndexDef[] = [
  { key: 'country_code',         kind: 'dimension', label: 'Country'       },
  { key: 'branch',               kind: 'dimension', label: 'Branch'        },
  { key: 'business_type_code',   kind: 'dimension', label: 'Business Type' },
  { key: 'act_type_code',        kind: 'dimension', label: 'Activity Type' },
  { key: 'order_type_name',      kind: 'dimension', label: 'Order Type'    },
  { key: 'partner_company_name', kind: 'dimension', label: 'Company'       },
];

export const ALL_INDICES: IndexDef[] = [...METRIC_INDICES, ...DIMENSION_INDICES];

export const METRIC_COLORS: Record<string, string> = {
  workload: '#5F3ADD',
  pr:       '#10B981',
  wpi:      '#3B82F6',
  volume:   '#F59E0B',
};
