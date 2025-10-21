export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://hammerhead-app-t8l9y.ondigitalocean.app';

export type AuthUser = {
  id: string | number;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg || `Login failed (${res.status})`);
  }
  return res.json();
}

export async function signup(name: string, email: string, password: string, role?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg || `Signup failed (${res.status})`);
  }
  return res.json();
}

async function safeError(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return data?.error;
  } catch {
    return undefined;
  }
}

export const authStorage = {
  save(auth: AuthResponse) {
    localStorage.setItem('auth.token', auth.token);
    localStorage.setItem('token', auth.token);
    localStorage.setItem('auth.user', JSON.stringify(auth.user));
  },
  clear() {
    localStorage.removeItem('auth.token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth.user');
  },
  getToken(): string | null {
    return localStorage.getItem('auth.token') || localStorage.getItem('token');
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem('auth.user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
};

export function getAuthHeader(): Record<string, string> {
  const t = authStorage.getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
