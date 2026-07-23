const API_BASE = 'http://localhost:8081/v1';

function getToken(): string | null {
  return localStorage.getItem('flowreport_token');
}

export function setToken(token: string): void {
  localStorage.setItem('flowreport_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('flowreport_token');
}

const ADMIN_TOKEN_KEY = 'flowreport_admin_token';

// Swaps in a token issued for another user (via the CEO/ADMIN-only
// impersonation endpoint), stashing the original admin token so we can
// return to it later. Replaces the old mock-era persona switcher, which
// changed the displayed user client-side with no real auth involved.
export function startImpersonation(newToken: string): void {
  const current = getToken();
  if (current) localStorage.setItem(ADMIN_TOKEN_KEY, current);
  setToken(newToken);
}

export function isImpersonating(): boolean {
  return localStorage.getItem(ADMIN_TOKEN_KEY) !== null;
}

export function endImpersonation(): void {
  const original = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (original) {
    setToken(original);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};