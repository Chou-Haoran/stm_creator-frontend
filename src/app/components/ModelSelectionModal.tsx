import { useState, useEffect } from 'react';
import { getAssignedModels, type ModelSummary } from '../api/models';
import { CreateModelModal } from '../../components/CreateModelModal';

/**
 * Props for ModelSelectionModal.
 * - isOpen: controls modal visibility
 * - onClose: called when the user dismisses the modal
 * - onCreateNew: called with the model name when creating a new model
 * - onLoadExisting: called with the model name when opening an existing model
 */
interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreateNew: (modelName: string) => void;
  readonly onLoadExisting: (modelName: string) => void;
}

/**
 * ModelSelectionModal — displayed after login to let the user pick a model.
 *
 * Two sections:
 *   1. Accessible Models List — fetched from GET /models/assigned. Clicking a
 *      model triggers onLoadExisting, which navigates to /editor?model={name}.
 *   2. Create New Model — text input + "Create" button. Submitting triggers
 *      onCreateNew, which navigates to /editor?model={name} (the backend
 *      auto-creates an empty model when the name doesn't exist yet).
 */
export function ModelSelectionModal({ isOpen, onClose, onCreateNew, onLoadExisting }: Props) {
  // Validation error for the create-new input
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // List of existing models returned by the API
  const [models, setModels] = useState<ModelSummary[]>([]);
  // Loading state while fetching the model list
  const [listLoading, setListLoading] = useState(false);
  // Error message if the model list fetch fails
  const [listError, setListError] = useState<string | null>(null);

  /**
   * Fetch models the signed-in user can access whenever the modal opens.
   * A cleanup flag (`cancelled`) prevents state updates if the modal closes
   * before the request completes.
   */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchModels = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const data = await getAssignedModels();
        if (!cancelled) setModels(data);
      } catch (e) {
        if (!cancelled) setListError((e as Error).message || 'Failed to fetch models');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };
    void fetchModels();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Allow dismissing the modal with the Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  /** Reset local state and notify parent to close the modal */
  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    /* Overlay — clicking the backdrop closes the modal */
    <div style={overlay} onClick={handleClose}>
      {/* Modal card — stopPropagation prevents backdrop-click from closing */}
      <div style={modal} onClick={(e) => e.stopPropagation()} aria-labelledby="model-selection-title">

        {/* ── Section 1: Header ── */}
        <div style={header}>
          <h2 id="model-selection-title" style={titleStyle}>Select a model you can access</h2>
          <button onClick={handleClose} style={closeBtn} aria-label="Close">✖</button>
        </div>

        {/* ── Section 2: Accessible Models List ──
            Fetched from GET /models/assigned on mount.
            Clicking a model item calls onLoadExisting(name), which navigates
            to /editor?model={name} — same behaviour as the toolbar "Open Model". */}
        <div style={sectionBox}>
          <h3 style={sectionTitle}>Models you have access to</h3>
          {listLoading ? (
            <p style={infoText}>Loading models…</p>
          ) : listError ? (
            <div style={errorBoxStyle}>{listError}</div>
          ) : models.length === 0 ? (
            <p style={infoText}>No accessible models found.</p>
          ) : (
            <ul style={listContainer}>
              {models.map((model) => (
                <li key={model.id}>
                  <button
                    onClick={() => {
                      onLoadExisting(model.stm_name);
                      setError(null);
                    }}
                    style={modelItemBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0fdf4';
                      e.currentTarget.style.borderColor = '#86efac';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <span style={modelIcon}>📄</span>
                    <span>{model.stm_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Visual divider between the two sections ── */}
        <div style={divider}>
          <span style={dividerLine} />
          <span style={dividerText}>OR CREATE NEW</span>
          <span style={dividerLine} />
        </div>

        {/* ── Section 3: Create New Model ──
            Opens the dedicated creation flow for scratch models or templates. */}
        <div style={createSection}>
          <button onClick={() => setCreateModalOpen(true)} style={createBtn}>
            Create new model
          </button>
          {error && <div style={inputError}>{error}</div>}
        </div>
      </div>
      <CreateModelModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(createdModelName) => {
          setCreateModalOpen(false);
          onCreateNew(createdModelName);
        }}
      />
    </div>
  );
}

/* ── Inline Styles ──
   All styles use React.CSSProperties objects to keep the component self-contained.
   The colour palette matches the project's green/gold theme used in AuthPage. */

/** Full-screen semi-transparent backdrop */
const overlay: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1200,
};

/** Centred modal card with vertical flex layout */
const modal: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 28,
  width: 520,
  maxWidth: '92%',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: '#064e3b',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#065f46',
  padding: 4,
};

/** Scrollable container for the existing models list */
const sectionBox: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#065f46',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const infoText: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
  margin: '8px 0',
};

const errorBoxStyle: React.CSSProperties = {
  padding: 10,
  background: 'rgba(239, 68, 68, 0.08)',
  color: '#dc2626',
  borderRadius: 6,
  fontSize: 13,
  border: '1px solid #fca5a5',
};

/** Grid layout for model items; max-height with scroll for long lists */
const listContainer: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: 6,
  maxHeight: 280,
  overflowY: 'auto',
};

/** Individual model row button — hover colours are set via JS events */
const modelItemBtn: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  color: '#064e3b',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'all 0.15s',
};

const modelIcon: React.CSSProperties = {
  fontSize: 16,
  flexShrink: 0,
};

/** Horizontal rule with centred "OR CREATE NEW" label */
const divider: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '20px 0',
};

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: 'linear-gradient(90deg, rgba(205,174,107,0.0), rgba(205,174,107,0.5), rgba(205,174,107,0.0))',
};

const dividerText: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  letterSpacing: '1px',
};

/** Wrapper for the create-new-model input row */
const createSection: React.CSSProperties = {};

const createBtn: React.CSSProperties = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const inputError: React.CSSProperties = {
  marginTop: 8,
  padding: 8,
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#dc2626',
  borderRadius: 6,
  fontSize: 12,
};
