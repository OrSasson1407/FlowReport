import { api } from './client';

export interface BackendNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationsResponse {
  data: BackendNotification[];
  count: number;
}

export const notificationsApi = {
  list: (): Promise<NotificationsResponse> =>
    api.get<NotificationsResponse>('/notifications'),

  create: (type: string, title: string, message: string): Promise<BackendNotification> =>
    api.post<BackendNotification>('/notifications', { type, title, message }),

  markRead: (id: string): Promise<BackendNotification> =>
    api.patch<BackendNotification>(`/notifications/${id}/read`, {}),

  markAllRead: (): Promise<{ message: string }> =>
    api.post<{ message: string }>('/notifications/read-all', {}),

  clear: (): Promise<{ message: string }> =>
    api.delete<{ message: string }>('/notifications'),
};
