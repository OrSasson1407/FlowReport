import { api } from './client';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';

export interface Report {
  id: string;
  user_id: string;
  cycle_id: string;
  completed_content: string;
  working_on_content: string;
  blockers_content: string;
  plans_content: string;
  status: ReportStatus;
  comments?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportsResponse {
  data: Report[];
  count: number;
}

export const reportsApi = {
  list: (params?: { cycle_id?: string; status?: string }): Promise<ReportsResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<ReportsResponse>(`/reports${query ? '?' + query : ''}`);
  },
  get: (id: string): Promise<Report> => api.get<Report>(`/reports/${id}`),
  create: (input: { cycle_id: string; completed_content: string; working_on_content: string; blockers_content: string; plans_content: string; }): Promise<Report> => api.post<Report>('/reports', input),
  update: (id: string, input: Partial<{ completed_content: string; working_on_content: string; blockers_content: string; plans_content: string; comments: string; }>): Promise<Report> => api.patch<Report>(`/reports/${id}`, input),
  submit: (id: string): Promise<Report> => api.post<Report>(`/reports/${id}/submit`, {}),
  approve: (id: string): Promise<Report> => api.post<Report>(`/reports/${id}/approve`, {}),
  requestRevision: (id: string, comments: string): Promise<Report> => api.post<Report>(`/reports/${id}/reject`, { comments }),
};
