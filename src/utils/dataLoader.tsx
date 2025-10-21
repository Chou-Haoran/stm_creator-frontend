import {
  BMRGData,
  TransitionData,
  StateData,
  hasFrontendStateId,
  hasPersistedStateId,
} from './stateTransition';
import { API_BASE, getAuthHeader } from '../app/auth/api';

function getModelName(): string | undefined {
  try {
    const qs = new URLSearchParams(window.location.search);
    const q = qs.get('model')?.trim();
    if (q) return q;
  } catch {}
  const envName = (import.meta as any).env?.VITE_MODEL_NAME as string | undefined;
  if (envName && envName.trim()) return envName.trim();
  try {
    const last = localStorage.getItem('stmCreator.lastModelName');
    if (last && last.trim()) return last.trim();
  } catch {}
  return undefined;
}

// Always load from backend; require a model name from URL/env/last saved
export async function loadBMRGData(): Promise<BMRGData> {
  const modelName = getModelName();
  if (!modelName) {
    throw new Error('No model specified. Add ?model= in URL or set VITE_MODEL_NAME.');
  }
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(modelName)}`, {
    headers: { Accept: 'application/json', ...getAuthHeader() },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized to load model. Please sign in.');
  }
  if (res.status === 404) {
    throw new Error(`Model not found: ${modelName}`);
  }
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg || `Backend load failed (${res.status})`);
  }
  const data = (await res.json()) as BMRGData;
  try {
    localStorage.setItem('stmCreator.lastModelName', modelName);
  } catch {}
  return data;
}

// Save the updated BMRG data back to the server
export async function saveBMRGData(data: BMRGData): Promise<boolean> {
  const payload = prepareSavePayload(data);
  const res = await fetch(`${API_BASE}/models/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 401 || res.status === 403) {
    alert('需要 Editor/Admin 权限并登录后才能保存到服务器。');
    return false;
  }
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg || `Failed to save data: ${res.status} ${res.statusText}`);
  }
  try {
    if (data?.stm_name) localStorage.setItem('stmCreator.lastModelName', data.stm_name);
  } catch {}
  return true;
}

export function prepareSavePayload(data: BMRGData): BMRGData {
  const states: StateData[] = data.states.map((state) => {
    const cleaned: StateData = { ...state };

    if (hasPersistedStateId(state)) {
      delete cleaned.frontend_state_id;
    } else {
      if (!hasFrontendStateId(state)) {
        throw new Error('New states must include frontend_state_id before saving.');
      }
      delete cleaned.state_id;
    }

    return cleaned;
  });

  return {
    ...data,
    states,
    transitions: data.transitions.map((transition) => ({ ...transition })),
  };
}

async function safeError(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return text?.trim() || undefined;
    }
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

export function updateTransition(data: BMRGData, updatedTransition: TransitionData): BMRGData {
  return {
    ...data,
    transitions: data.transitions.map((transition) =>
      transition.transition_id === updatedTransition.transition_id ? updatedTransition : transition
    ),
  };
}
