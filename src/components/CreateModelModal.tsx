import { useEffect, useMemo, useState } from 'react';

import { API_BASE, apiFetch } from '../app/auth/api';
import { cloneFromTemplate, getTemplates, type ModelSummary } from '../app/api/models';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: (modelName: string) => void;
}

type Mode = 'scratch' | 'template';

const PROTECTED_TEMPLATE_NAMES = new Set(['Woodlands', 'Grasslands', 'Shrublands']);

export function CreateModelModal({ isOpen, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>('scratch');
  const [templates, setTemplates] = useState<ModelSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ModelSummary | null>(null);
  const [name, setName] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const templateNameConflict = useMemo(
    () => Array.from(PROTECTED_TEMPLATE_NAMES).some((templateName) => templateName.toLowerCase() === trimmedName.toLowerCase()),
    [trimmedName],
  );

  useEffect(() => {
    if (!isOpen || mode !== 'template') return;
    let cancelled = false;
    const run = async () => {
      setLoadingTemplates(true);
      setError(null);
      try {
        const data = await getTemplates();
        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to fetch templates');
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [isOpen, mode]);

  const resetAndClose = () => {
    setMode('scratch');
    setSelectedTemplate(null);
    setName('');
    setError(null);
    onClose();
  };

  const validateName = () => {
    if (!trimmedName) {
      setError('Model name is required');
      return false;
    }
    if (templateNameConflict) {
      setError('Choose a name that does not match a protected template name.');
      return false;
    }
    return true;
  };

  const createScratchModel = async () => {
    const now = new Date().toISOString().split('T')[0];
    const payload = {
      stm_name: trimmedName,
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

    const res = await apiFetch(`${API_BASE}/models/save`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create model');
    return trimmedName;
  };

  const handleConfirm = async () => {
    setError(null);
    if (!validateName()) return;
    if (mode === 'template' && !selectedTemplate) {
      setError('Choose a template first');
      return;
    }

    setSaving(true);
    try {
      const createdName = mode === 'template' && selectedTemplate
        ? (await cloneFromTemplate(selectedTemplate.stm_name, trimmedName)).stm_name
        : await createScratchModel();
      setName('');
      setSelectedTemplate(null);
      onCreated(createdName);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create model');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const nameInput = (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={labelStyle}>{mode === 'template' ? 'Name your new model' : 'Model name'}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setError(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter') void handleConfirm(); }}
        autoFocus
        style={inputStyle}
      />
    </div>
  );

  return (
    <div style={overlayStyle} onClick={resetAndClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#064e3b' }}>Create model</h2>
          <button type="button" onClick={resetAndClose} style={iconButtonStyle} aria-label="Close">x</button>
        </div>

        <div style={choiceGridStyle}>
          <button type="button" onClick={() => { setMode('scratch'); setSelectedTemplate(null); setError(null); }} style={choiceStyle(mode === 'scratch')}>
            <strong>Start from scratch</strong>
            <span style={mutedStyle}>Create a blank model.</span>
          </button>
          <button type="button" onClick={() => { setMode('template'); setError(null); }} style={choiceStyle(mode === 'template')}>
            <strong>Clone a template</strong>
            <span style={mutedStyle}>Start with an existing ecosystem template.</span>
          </button>
        </div>

        {mode === 'scratch' ? (
          nameInput
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {loadingTemplates ? (
              <p style={mutedStyle}>Loading templates...</p>
            ) : (
              <div style={templateGridStyle}>
                {templates.map((template) => (
                  <article key={template.id} style={templateCardStyle}>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>{template.stm_name}</h3>
                    {template.ecosystem_type && <p style={mutedStyle}>{template.ecosystem_type}</p>}
                    {template.region && <p style={mutedStyle}>{template.region}</p>}
                    <button
                      type="button"
                      onClick={() => { setSelectedTemplate(template); setError(null); }}
                      style={selectTemplateStyle(selectedTemplate?.id === template.id)}
                    >
                      Use this template
                    </button>
                  </article>
                ))}
              </div>
            )}
            {selectedTemplate && nameInput}
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <div style={footerStyle}>
          <button type="button" onClick={resetAndClose} style={secondaryButtonStyle}>Cancel</button>
          <button type="button" onClick={() => void handleConfirm()} disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(15, 23, 42, 0.45)',
};

const modalStyle: React.CSSProperties = {
  width: 640,
  maxWidth: '100%',
  maxHeight: '88vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 8,
  padding: 22,
  boxShadow: '0 18px 44px rgba(15, 23, 42, 0.22)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18,
};

const iconButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 18,
};

const choiceGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10,
  marginBottom: 18,
};

const choiceStyle = (active: boolean): React.CSSProperties => ({
  display: 'grid',
  gap: 5,
  textAlign: 'left',
  padding: 14,
  borderRadius: 8,
  border: `1px solid ${active ? '#10b981' : '#d1d5db'}`,
  background: active ? '#ecfdf5' : '#fff',
  cursor: 'pointer',
});

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#064e3b',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
};

const templateGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 10,
};

const templateCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  display: 'grid',
  gap: 8,
};

const selectTemplateStyle = (selected: boolean): React.CSSProperties => ({
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${selected ? '#059669' : '#d1d5db'}`,
  background: selected ? '#059669' : '#fff',
  color: selected ? '#fff' : '#064e3b',
  cursor: 'pointer',
});

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #fecaca',
  color: '#991b1b',
  background: '#fef2f2',
  fontSize: 13,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 18,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#059669',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
