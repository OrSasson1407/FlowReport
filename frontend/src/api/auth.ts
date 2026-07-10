import { api, setToken, clearToken } from './client';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'DIRECTOR' | 'ADMIN' | 'CEO';

export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  title: string;
  department: string;
  manager_id?: string;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    setToken(response.token);
    return response;
  },
  register: async (data: {
    email: string; password: string; first_name: string;
    last_name: string; role: UserRole; title: string; department: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    setToken(response.token);
    return response;
  },
  logout: (): void => { clearToken(); },
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('flowreport_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  },
  getCurrentUser: (): AuthUser | null => {
    const token = localStorage.getItem('flowreport_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { ...payload, id: payload.sub } as AuthUser;
    } catch { return null; }
  },
};
