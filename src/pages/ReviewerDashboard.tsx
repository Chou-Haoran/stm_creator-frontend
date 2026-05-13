import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAssignedModels, type ModelSummary } from '../app/api/models';
import { MODEL_ROLES, type ModelRole } from '../constants/roles';

const GROUPS: Array<{ role: ModelRole; title: string }> = [
  { role: MODEL_ROLES.OWNER, title: 'My Models' },
  { role: MODEL_ROLES.EDITOR, title: 'Assigned as Editor' },
  { role: MODEL_ROLES.REVIEWER, title: 'Assigned for Review' },
  { role: MODEL_ROLES.VIEWER, title: 'View Access' },
];

const roleLabel = (role?: ModelRole): string =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown';

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openModel = (modelName: string) => {
    try {
      localStorage.setItem('stmCreator.lastModelName', modelName);
    } catch {}
    navigate(`/editor?model=${encodeURIComponent(modelName)}`);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAssignedModels();
        if (!cancelled) setModels(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to load assigned models');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    return GROUPS.map((group) => ({
      ...group,
      models: models.filter((model) => model.model_role === group.role),
    })).filter((group) => group.models.length > 0);
  }, [models]);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, color: '#0f172a' }}>My Models</h1>
          <p style={mutedStyle}>Models assigned to you by role.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (models[0]) openModel(models[0].stm_name);
          }}
          disabled={models.length === 0}
          style={{
            ...secondaryButtonStyle,
            cursor: models.length === 0 ? 'not-allowed' : 'pointer',
            opacity: models.length === 0 ? 0.55 : 1,
          }}
        >
          Editor
        </button>
      </header>

      {loading ? (
        <p style={mutedStyle}>Loading models...</p>
      ) : error ? (
        <div style={errorStyle}>{error}</div>
      ) : grouped.length === 0 ? (
        <p style={mutedStyle}>No assigned models found.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.role} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{group.title}</h2>
            <div style={gridStyle}>
              {group.models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => openModel(model.stm_name)}
                  style={cardStyle}
                >
                  <span style={badgeStyle}>{roleLabel(model.model_role)}</span>
                  <strong style={{ color: '#0f172a' }}>{model.stm_name}</strong>
                  {model.ecosystem_type && <span style={mutedStyle}>{model.ecosystem_type}</span>}
                  {model.region && <span style={mutedStyle}>{model.region}</span>}
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: 32,
  background: '#f8fafc',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 28,
};

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  marginBottom: 28,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  color: '#064e3b',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 12,
};

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  textAlign: 'left',
  padding: 14,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
};

const badgeStyle: React.CSSProperties = {
  justifySelf: 'start',
  padding: '3px 8px',
  borderRadius: 999,
  background: '#ecfdf5',
  color: '#047857',
  fontSize: 12,
  fontWeight: 700,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid #fecaca',
  color: '#991b1b',
  background: '#fef2f2',
};
