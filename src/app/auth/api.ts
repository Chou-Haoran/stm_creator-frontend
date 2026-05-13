import { type GlobalRole } from '../../constants/roles';

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

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AuthUser {
  id: number;
  email: string;
  role: GlobalRole;
  is_verified: boolean;
  contributor_id?: number | null;
}

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

function migrateLegacyToken(): void {
  try {
    const legacyToken = localStorage.getItem('token');
    const authToken = localStorage.getItem('auth.token');
    if (legacyToken && !authToken) {
      localStorage.setItem('auth.token', legacyToken);
    }
    if (legacyToken) {
      localStorage.removeItem('token');
    }
  } catch {
    // Storage can fail in private mode; auth will simply hydrate as signed out.
  }
}

migrateLegacyToken();

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const { code, message } = await safeErrorFull(res);
    throw new ApiError(code ?? '', message ?? `Login failed (${res.status})`);
  }
  return res.json();
}

export async function signup(
  name: string,
  email: string,
  password: string,
  role?: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const { code, message } = await safeErrorFull(res);
    throw new ApiError(code ?? '', message ?? `Signup failed (${res.status})`);
  }
  return res.json();
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const { code, message } = await safeErrorFull(res);
    throw new ApiError(code ?? '', message ?? `Verification failed (${res.status})`);
  }
  return res.json();
}

export async function resendVerification(email: string): Promise<void> {
  await apiFetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  // Always 200 — vague by design to avoid email enumeration
}

async function safeErrorFull(res: Response): Promise<{ code?: string; message?: string }> {
  try {
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return { message: text?.trim() || undefined }; }

    const err = data?.error ?? data;
    const code =
      typeof err?.code === 'string' ? err.code :
      typeof data?.code === 'string' ? data.code :
      undefined;

    let message: string | undefined;
    if (typeof err === 'string') {
      message = err;
    } else if (typeof err?.message === 'string') {
      message = err.message;
    } else {
      const details = err?.details ?? data?.details;
      if (Array.isArray(details) && details.length) {
        const first: any = details[0];
        const msg = typeof first?.message === 'string' ? first.message : undefined;
        const path = typeof first?.path === 'string' ? first.path : undefined;
        message = msg && path ? `${path}: ${msg}` : msg;
      } else if (typeof data?.message === 'string') {
        message = data.message;
      }
    }

    return { code, message };
  } catch {
    return {};
  }
}

export const authStorage = {
  save(auth: AuthResponse) {
    localStorage.setItem('auth.token', auth.token);
    localStorage.setItem('auth.user', JSON.stringify({
      ...auth.user,
      is_verified: auth.user.is_verified,
    }));
  },
  clear() {
    localStorage.removeItem('auth.token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth.user');
  },
  getToken(): string | null {
    return localStorage.getItem('auth.token');
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

export const apiFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    authStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent('auth:forbidden'));
  }

  return response;
};
