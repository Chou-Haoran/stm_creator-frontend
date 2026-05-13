import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '../../app/auth/api';
import { getAssignedModels, type ModelSummary } from '../api/models';
import { MODEL_ROLES, type GlobalRole } from '../../constants/roles';
import { isAdmin } from '../../utils/permissions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userRole?: GlobalRole | null;
}

function normaliseModelsResponse(data: unknown): ModelSummary[] {
  const rawModels = Array.isArray(data)
    ? data
    : Array.isArray((data as { models?: unknown })?.models)
      ? (data as { models: unknown[] }).models
      : [];

  return rawModels
    .map((model, index): ModelSummary | null => {
      if (typeof model === 'string') {
        return {
          id: index + 1,
          stm_name: model,
          is_template: false,
        };
      }

      if (!model || typeof model !== 'object') {
        return null;
      }

      const record = model as Record<string, unknown>;
      const stmName = record.stm_name ?? record.name ?? record.model_name;
      if (typeof stmName !== 'string' || !stmName.trim()) {
        return null;
      }

      const numericId = typeof record.id === 'number'
        ? record.id
        : typeof record.id === 'string' && record.id.trim()
          ? Number(record.id)
          : Number.NaN;

      return {
        id: Number.isFinite(numericId) ? numericId : index + 1,
        stm_name: stmName,
        version: typeof record.version === 'string' ? record.version : undefined,
        ecosystem_type: typeof record.ecosystem_type === 'string' ? record.ecosystem_type : undefined,
        region: typeof record.region === 'string' ? record.region : undefined,
        is_template: typeof record.is_template === 'boolean' ? record.is_template : false,
        authorised_by: typeof record.authorised_by === 'string' ? record.authorised_by : undefined,
      };
    })
    .filter((model): model is ModelSummary => model !== null);
}

const modelCardKey = (model: ModelSummary, index: number) => `${model.id}-${model.stm_name}-${index}`;

export function ModelListModal({ isOpen, onClose, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allModels, setAllModels] = useState<ModelSummary[]>([]);
  const [ownedModels, setOwnedModels] = useState<ModelSummary[]>([]);
  const userIsAdmin = isAdmin(userRole ?? undefined);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setAllModels([]);
      setOwnedModels([]);

      try {
        const assignedModels = await getAssignedModels();
        const ownerModels = assignedModels.filter((model) => model.model_role === MODEL_ROLES.OWNER);

        let availableModels: ModelSummary[] = [];
        if (userIsAdmin) {
          const res = await apiFetch(`${API_BASE}/models/all`, {
            headers: { Accept: 'application/json' },
          });

          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Failed to fetch all models (${res.status})`);
          }

          availableModels = normaliseModelsResponse(await res.json());
        }

        if (!cancelled) {
          setAllModels(availableModels);
          setOwnedModels(ownerModels);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed to fetch models');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const goToModel = (name: string) => {
    try { localStorage.setItem('stmCreator.lastModelName', name); } catch {}
    window.location.href = `/editor?model=${encodeURIComponent(name)}`;
  };

  const renderModelCard = (model: ModelSummary) => (
    <button
      type="button"
      onClick={() => goToModel(model.stm_name)}
      style={cardStyle}
    >
      <strong style={cardTitleStyle}>{model.stm_name}</strong>
      <span style={badgeStyle}>{model.model_role ?? (model.is_template ? 'template' : 'model')}</span>
      {(model.ecosystem_type || model.region || model.version) && (
        <span style={metaStyle}>
          {[model.ecosystem_type, model.region, model.version ? `v${model.version}` : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      )}
      {model.authorised_by && <span style={metaStyle}>Authorised by {model.authorised_by}</span>}
    </button>
  );

  const renderSection = (title: string, description: string, models: ModelSummary[], emptyText: string) => (
    <section style={sectionStyle}>
      <div>
        <h3 style={sectionTitleStyle}>{title}</h3>
        <p style={sectionCopyStyle}>{description}</p>
      </div>
      {models.length === 0 ? (
        <p style={emptyTextStyle}>{emptyText}</p>
      ) : (
        <div style={gridStyle}>
          {models.map((model, index) => (
            <div key={modelCardKey(model, index)}>
              {renderModelCard(model)}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Models</h2>
            <p style={subtitleStyle}>Open a model from your workspace.</p>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">X</button>
        </div>

        {loading ? (
          <p style={emptyTextStyle}>Loading models...</p>
        ) : error ? (
          <div style={errorStyle}>
            {error}
          </div>
        ) : (
          <div style={contentStyle}>
            {userIsAdmin && (
              <>
                {renderSection(
                  'All Available Models',
                  'Admin access across the complete model catalogue.',
                  allModels,
                  'No available models found.',
                )}
                <div style={dividerStyle} />
              </>
            )}
            {renderSection(
              'Models You Own',
              userIsAdmin
                ? 'Models where your model-level role is owner.'
                : 'Models where you are the owner.',
              ownedModels,
              'No owned models found.',
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(15, 23, 42, 0.45)',
};

const modalStyle: React.CSSProperties = {
  width: 640,
  maxWidth: '92%',
  maxHeight: '72vh',
  overflowY: 'auto',
  borderRadius: 8,
  background: '#fff',
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.22)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 16px 12px',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
};

const subtitleStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: 12,
};

const closeButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#475569',
  cursor: 'pointer',
  fontWeight: 700,
};

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
};

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#064e3b',
  fontSize: 14,
};

const sectionCopyStyle: React.CSSProperties = {
  margin: '3px 0 0',
  color: '#64748b',
  fontSize: 12,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: 8,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 76,
  display: 'grid',
  alignContent: 'start',
  gap: 5,
  padding: 9,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 5px 12px rgba(15, 23, 42, 0.05)',
};

const cardTitleStyle: React.CSSProperties = {
  minWidth: 0,
  color: '#0f172a',
  fontSize: 12,
  overflowWrap: 'anywhere',
};

const badgeStyle: React.CSSProperties = {
  justifySelf: 'start',
  padding: '2px 6px',
  borderRadius: 999,
  background: '#ecfdf5',
  color: '#047857',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'capitalize',
};

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  lineHeight: 1.25,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: '#e5e7eb',
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  padding: 10,
  borderRadius: 8,
  background: '#f8fafc',
  color: '#64748b',
  fontSize: 12,
};

const errorStyle: React.CSSProperties = {
  margin: 14,
  padding: 10,
  border: '1px solid #fecaca',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 12,
};
