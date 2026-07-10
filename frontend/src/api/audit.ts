import { api } from './client';

export interface AuditLog {
  id: number;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_state?: string;
  new_state?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  count: number;
}

export const auditApi = {
  list: (params?: { entity_type?: string; action?: string }): Promise<AuditLogsResponse> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get<AuditLogsResponse>(`/audit-logs${query ? '?' + query : ''}`);
  },
};
