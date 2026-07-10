import { api } from './client';

export interface ReportCycle {
  id: string;
  year: number;
  week_num: number;
  starts_at: string;
  ends_at: string;
  deadline: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface CyclesResponse {
  data: ReportCycle[];
  count: number;
}

export const cyclesApi = {
  list: (): Promise<CyclesResponse> =>
    api.get<CyclesResponse>('/cycles'),

  current: (): Promise<ReportCycle> =>
    api.get<ReportCycle>('/cycles/current'),

  create: (data: {
    year: number;
    week_num: number;
    starts_at?: string;
    ends_at?: string;
    deadline?: string;
  }): Promise<ReportCycle> =>
    api.post<ReportCycle>('/cycles', data),

  lock: (id: string): Promise<ReportCycle> =>
    api.post<ReportCycle>(`/cycles/${id}/lock`, {}),

  unlock: (id: string): Promise<ReportCycle> =>
    api.post<ReportCycle>(`/cycles/${id}/unlock`, {}),

  update: (id: string, data: { status?: string; deadline?: string }): Promise<ReportCycle> =>
    api.patch<ReportCycle>(`/cycles/${id}`, data),
};
