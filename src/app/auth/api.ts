const __envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const __defaultCloudBase = 'https://hammerhead-app-t8l9y.ondigitalocean.app';

function __pickApiBase(): string {
  const candidate = __envBase || __defaultCloudBase;
  try {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    // If running on a non-localhost origin but API base points to localhost, fallback to cloud.
    if (!isLocalHost) {
      try {
        const u = new URL(candidate);
        const apiHost = (u.hostname || '').toLowerCase();
        if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
          return __defaultCloudBase;
        }
      } catch {
        // If candidate is not a valid URL string, do a simple string check
        if (/localhost(\b|:)/i.test(candidate)) {
          return __defaultCloudBase;
        }
      }
    }
  } catch {
    // ignore environment probing errors
  }
  return candidate;
}

export const API_BASE = __pickApiBase();

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
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return text?.trim() || undefined; }

    const err = data?.error ?? data;
    if (typeof err === 'string') return err;
    if (typeof err?.message === 'string') return err.message;

    const details = err?.details ?? data?.details;
    if (Array.isArray(details) && details.length) {
      const first: any = details[0];
      const msg = typeof first?.message === 'string' ? first.message : undefined;
      const path = typeof first?.path === 'string' ? first.path : undefined;
      return msg && path ? `${path}: ${msg}` : msg;
    }
    if (typeof data?.message === 'string') return data.message;
    return undefined;
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
