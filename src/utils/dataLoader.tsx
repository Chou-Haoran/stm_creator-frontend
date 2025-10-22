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
    const qs = new URLSearchParams(globalThis.location.search);
    const q = qs.get('model')?.trim();
    if (q) return q;
  } catch {}
  const envName = (import.meta as any).env?.VITE_MODEL_NAME as string | undefined;
  if (envName?.trim()) return envName.trim();
  try {
    const last = localStorage.getItem('stmCreator.lastModelName');
    if (last?.trim()) return last.trim();
  } catch {}
  return undefined;
}

// Create an empty model for new projects
function createEmptyModel(modelName?: string): BMRGData {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return {
    stm_name: modelName || 'New Model - 1',
    version: '1.0',
    release_date: now,
    authorised_by: '',
    contributing_experts: [],
    region: '',
    region_id: 1,
    climate: '',
    ecosystem_type: '',
    aus_eco_archetype_code: 1.2,
    aus_eco_archetype_name: '',
    aus_eco_umbrella_code: 0,
    peer_reviewed: 'No',
    no_peer_reviewers: 0,
    states: [],
    transitions: [],
    method_alignment: '',
  };
}

// Load from backend, fallback to empty model if not found
export async function loadBMRGData(): Promise<BMRGData> {
  const modelName = getModelName();
  
  // If no model name specified, create a new empty model
  if (!modelName) {
    return createEmptyModel();
  }
  
  try {
    const res = await fetch(`${API_BASE}/models/${encodeURIComponent(modelName)}`, {
      headers: { Accept: 'application/json', ...getAuthHeader() },
    });
    
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized to load model. Please sign in.');
    }
    
    if (res.status === 404) {
      // Model not found - create empty model with the requested name instead of throwing error
      console.log(`Model "${modelName}" not found, creating empty model with name "${modelName}"`);
      return createEmptyModel(modelName);
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
  } catch (err) {
    // If network error or other issues, fallback to empty model with the requested name
    console.warn('Failed to load model from backend, creating empty model with name:', modelName, err);
    return createEmptyModel(modelName);
  }
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
