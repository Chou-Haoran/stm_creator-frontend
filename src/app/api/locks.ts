import { API_BASE, apiFetch } from '../auth/api';

export interface ModelLockInfo {
  locked: boolean;
  lockType?: 'edit' | 'review';
  lockId?: string;
  lockedBy?: string;
  expiresAt?: string;
  owner?: boolean;
}

export interface LockResponse {
  locked: boolean;
  lock_type: 'edit' | 'review';
  locked_by?: string;
  expires_at?: string;
  success?: boolean;
  lock?: {
    lock_type?: 'edit' | 'review';
    lockId?: string;
    lock_id?: string;
    lockedBy?: string;
    locked_by?: string;
    expiresAt?: string;
    expires_at?: string;
    owner?: boolean;
  };
  lockId?: string;
  lock_id?: string;
  lockType?: 'edit' | 'review';
  lockedBy?: string;
  expiresAt?: string;
  owner?: boolean;
  message?: string;
  error?: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    try {
      const obj = JSON.parse(text) as { message?: string; error?: string };
      return obj.message || obj.error || text || `HTTP ${res.status}`;
    } catch {
      return text || `HTTP ${res.status}`;
    }
  } catch {
    return `HTTP ${res.status}`;
  }
}

function normalize(payload: LockResponse): ModelLockInfo {
  const lock = payload.lock;
  return {
    locked: typeof payload.locked === 'boolean' ? payload.locked : true,
    lockType: lock?.lock_type ?? payload.lock_type ?? payload.lockType,
    lockId: lock?.lockId ?? lock?.lock_id ?? payload.lockId ?? payload.lock_id,
    lockedBy: lock?.lockedBy ?? lock?.locked_by ?? payload.lockedBy ?? payload.locked_by,
    expiresAt: lock?.expiresAt ?? lock?.expires_at ?? payload.expiresAt ?? payload.expires_at,
    owner: lock?.owner ?? payload.owner,
  };
}

export async function acquireModelLock(modelName: string): Promise<ModelLockInfo> {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(modelName)}/lock/acquire`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await readError(res));
  const payload = (await res.json()) as LockResponse;
  return normalize(payload);
}

export async function renewModelLock(modelName: string, lockId: string): Promise<ModelLockInfo> {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(modelName)}/lock/renew`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({ lockId }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const payload = (await res.json()) as LockResponse;
  return normalize(payload);
}

export async function releaseModelLock(modelName: string, lockId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(modelName)}/lock/release`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({ lockId }),
    keepalive: true,
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function getModelLock(modelName: string): Promise<ModelLockInfo> {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(modelName)}/lock`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await readError(res));
  const payload = (await res.json()) as LockResponse;
  return normalize(payload);
}
