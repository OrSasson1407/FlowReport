import { api } from './client';

export interface DepartmentMetric {
  id: string;
  name: string;
  manager_name: string;
  compliance_rate: number;
  active_blocker_count: number;
  total_employees: number;
  submitted_count: number;
  approved_count: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface DepartmentMetricsResponse {
  data: DepartmentMetric[];
  count: number;
}

export interface OrgHealth {
  total_employees: number;
  submitted_reports: number;
  approved_reports: number;
  overall_compliance: number;
  cycle_id: string;
}

export interface CycleHistoryItem {
  cycle_id: string;
  year: number;
  week_num: number;
  status: string;
  total_employees: number;
  submitted_count: number;
  approved_count: number;
  compliance_rate: number;
}

export interface CycleHistoryResponse {
  data: CycleHistoryItem[];
  count: number;
}

export const metricsApi = {
  departments: (cycleId?: string): Promise<DepartmentMetricsResponse> => {
    const query = cycleId ? `?cycle_id=${cycleId}` : '';
    return api.get<DepartmentMetricsResponse>(`/metrics/departments${query}`);
  },
  orgHealth: (cycleId?: string): Promise<OrgHealth> => {
    const query = cycleId ? `?cycle_id=${cycleId}` : '';
    return api.get<OrgHealth>(`/metrics/org-health${query}`);
  },
  cycleHistory: (): Promise<CycleHistoryResponse> =>
    api.get<CycleHistoryResponse>('/metrics/cycle-history'),
};
