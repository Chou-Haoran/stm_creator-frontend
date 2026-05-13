import { API_BASE, apiFetch } from '../auth/api';
import type { ModelRole } from '../../constants/roles';

export interface ModelSummary {
  id: number;
  stm_name: string;
  version?: string;
  ecosystem_type?: string;
  region?: string;
  is_template: boolean;
  authorised_by?: string;
  model_role?: ModelRole;
}

async function readError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    try {
      const obj = JSON.parse(text);
      const msg = obj?.message || obj?.error;
      return typeof msg === 'string' ? msg : text;
    } catch {
      return text;
    }
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function deleteModel(name: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function deleteState(name: string, stateId: number): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/models/${encodeURIComponent(name)}/states/${stateId}`,
    { method: 'DELETE', headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(await readError(res));
}

export async function deleteTransition(name: string, transitionId: number): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/models/${encodeURIComponent(name)}/transitions/${transitionId}`,
    { method: 'DELETE', headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(await readError(res));
}

export const getAssignedModels = async (): Promise<ModelSummary[]> => {
  const res = await apiFetch(`${API_BASE}/models/assigned`);
  if (!res.ok) throw new Error('Failed to fetch assigned models');
  const data = await res.json();
  return data.models;
};

export const getTemplates = async (): Promise<ModelSummary[]> => {
  const res = await apiFetch(`${API_BASE}/models/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json() as unknown;
  const templates = Array.isArray(data)
    ? data
    : Array.isArray((data as { templates?: unknown })?.templates)
      ? (data as { templates: unknown[] }).templates
      : [];

  return templates
    .map((template, index): ModelSummary | null => {
      if (typeof template === 'string') {
        return {
          id: index + 1,
          stm_name: template,
          is_template: true,
        };
      }

      if (
        typeof template === 'object' &&
        template !== null &&
        typeof (template as Partial<ModelSummary>).stm_name === 'string'
      ) {
        return {
          id: typeof (template as Partial<ModelSummary>).id === 'number' ? (template as ModelSummary).id : index + 1,
          stm_name: (template as ModelSummary).stm_name,
          version: (template as ModelSummary).version,
          ecosystem_type: (template as ModelSummary).ecosystem_type,
          region: (template as ModelSummary).region,
          is_template: true,
          authorised_by: (template as ModelSummary).authorised_by,
        };
      }

      return null;
    })
    .filter((template): template is ModelSummary => template !== null);
};

export const cloneFromTemplate = async (
  templateName: string,
  newName: string,
): Promise<{ modelId: number; stm_name: string }> => {
  const res = await apiFetch(`${API_BASE}/models/from-template/${encodeURIComponent(templateName)}`, {
    method: 'POST',
    body: JSON.stringify({ new_name: newName }),
  });
  if (!res.ok) throw new Error('Failed to clone template');
  return res.json();
};

export const getModelPermissions = async (modelName: string) => {
  const res = await apiFetch(`${API_BASE}/models/${encodeURIComponent(modelName)}/permissions`);
  if (!res.ok) throw new Error('Failed to fetch permissions');
  return res.json();
};

export const setModelPermission = async (
  modelName: string,
  email: string,
  role: ModelRole,
) => {
  const res = await apiFetch(
    `${API_BASE}/models/${encodeURIComponent(modelName)}/permissions/${encodeURIComponent(email)}`,
    { method: 'PUT', body: JSON.stringify({ role }) },
  );
  if (!res.ok) throw new Error('Failed to set permission');
  return res.json();
};

export const removeModelPermission = async (modelName: string, email: string) => {
  const res = await apiFetch(
    `${API_BASE}/models/${encodeURIComponent(modelName)}/permissions/${encodeURIComponent(email)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Failed to remove permission');
};

export const getMilestones = async (modelName: string) => {
  const res = await apiFetch(`${API_BASE}/collab/${encodeURIComponent(modelName)}/milestones`);
  if (!res.ok) throw new Error('Failed to fetch milestones');
  return res.json();
};

export const createMilestone = async (modelName: string, payload: { label: string; description?: string }) => {
  const res = await apiFetch(`${API_BASE}/collab/${encodeURIComponent(modelName)}/milestones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create milestone');
  return res.json();
};

export const restoreMilestone = async (modelName: string, milestoneId: number) => {
  const res = await apiFetch(
    `${API_BASE}/collab/${encodeURIComponent(modelName)}/milestones/${milestoneId}/restore`,
    { method: 'POST' },
  );
  if (!res.ok) throw new Error('Failed to restore milestone');
  return res.json();
};

export const deleteMilestone = async (modelName: string, milestoneId: number) => {
  const res = await apiFetch(
    `${API_BASE}/collab/${encodeURIComponent(modelName)}/milestones/${milestoneId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Failed to delete milestone');
};
