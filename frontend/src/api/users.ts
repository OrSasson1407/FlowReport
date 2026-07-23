import { api } from './client';

export interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  title: string;
  department: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  data: BackendUser[];
  count: number;
}

export interface ImpersonateResponse {
  token: string;
  user: BackendUser;
}

export const usersApi = {
  list: (): Promise<UsersResponse> => api.get<UsersResponse>('/users'),
  me: (): Promise<BackendUser> => api.get<BackendUser>('/users/me'),
  get: (id: string): Promise<BackendUser> => api.get<BackendUser>(`/users/${id}`),
  impersonate: (id: string): Promise<ImpersonateResponse> => api.post<ImpersonateResponse>(`/users/${id}/impersonate`, {}),
};