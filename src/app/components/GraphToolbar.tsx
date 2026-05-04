import { useRef, useState } from 'react';

import { BMRGData } from '../../utils/stateTransition';
import type { SaveModelResponse } from '../hooks/graphModel';
import type { LayoutStrategy } from '../../utils/layoutStrategies';

interface GraphToolbarProps {
  readonly onAddNode: () => void;
  readonly onToggleEdgeCreation: () => void;
  readonly onLoadEdges: () => void;
  readonly onSaveModel: () => Promise<SaveModelResponse>;
  readonly onOpenModelList?: () => void;
  /** Callback to create a new model; receives the model name from the modal input */
  readonly onCreateNewModel?: (modelName: string) => void;
  readonly onDeleteModel?: () => void;
  /** Opens the unified Milestone modal (save + history) */
  readonly onOpenMilestone: () => void;
  readonly onOpenVersionCompare?: () => void;
  readonly onImportEKS: (file: File) => void | Promise<void>;
  readonly onExportEKS: () => void;
  readonly onExportPNG: () => void | Promise<void>;
  readonly onRelayout: () => void;
  readonly onApplyLayout?: (strategy: LayoutStrategy) => void | Promise<void>;
  readonly onToggleSelfTransitions: () => void;
  readonly edgeCreationMode: boolean;
  readonly isSaving: boolean;
  readonly showSelfTransitions: boolean;
  readonly bmrgData: BMRGData | null;
  readonly onOpenHelp: () => void;
  /** Toggle the right-side comment panel */
  readonly onToggleComments?: () => void;
  readonly userEmail?: string | null;
  readonly userRole?: string | null;
  readonly isGuest?: boolean;
  readonly onLogout?: () => void;
  readonly onSignIn?: () => void;
  readonly canEdit: boolean;
  readonly lockHolder?: string | null;
  readonly lockExpiresAt?: string | null;
  readonly onAcquireLock?: () => void;
  readonly onReleaseLock?: () => void;
  readonly onRefreshLock?: () => void;
}

export function GraphToolbar({
  onAddNode,
  onToggleEdgeCreation,
  onLoadEdges,
  onSaveModel,
  onOpenModelList,
  onCreateNewModel,
  onDeleteModel,
  onRelayout,
  onApplyLayout,
  onOpenMilestone,
  onOpenVersionCompare,
  onImportEKS,
  onExportEKS,
  onExportPNG,
  onToggleSelfTransitions,
  edgeCreationMode,
  isSaving,
  showSelfTransitions,
  onOpenHelp,
  onToggleComments,
  userEmail,
  userRole,
  onLogout,
  onSignIn,
  canEdit,
  onAcquireLock,
  onReleaseLock,
  onRefreshLock,
}: GraphToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<LayoutStrategy>('force');
  // Controls visibility of the "Create New Model" modal dialog
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  // Tracks the model name input inside the new-model modal
  const [newModelName, setNewModelName] = useState('');
  const editDisabled = !canEdit;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportEKS(file);
    }
    event.target.value = '';
  };

  return (
    <div className="toolbar">
      <span className="toolbar-logo">STM</span>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        data-tour="add-node"
        onClick={onAddNode}
        className="tb-btn primary"
        disabled={editDisabled}
      >
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>
        Add Node
      </button>

      <button
        data-tour="create-edge"
        onClick={onToggleEdgeCreation}
        className={`tb-btn ${edgeCreationMode ? 'active' : ''}`}
        disabled={editDisabled}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M8 2v12"/><circle cx="8" cy="8" r="2"/></svg>
        {edgeCreationMode ? 'Cancel Edge' : 'Create Edge'}
      </button>

      <button data-tour="load-all-edges" onClick={onLoadEdges} className="tb-btn">
        Load All Edges
      </button>

      <div className="tb-sep" />

      <button
        data-tour="save-model"
        onClick={() => {
          void onSaveModel().catch(() => undefined);
        }}
        disabled={isSaving || editDisabled}
        className="tb-btn"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12V4l4 4 3-3 5 5"/></svg>
        {isSaving ? 'Saving...' : 'Save Model'}
      </button>

      <button data-tour="milestone" onClick={onOpenMilestone} className="tb-btn">
        Milestone
      </button>

      <button
        data-tour="compare-versions"
        onClick={onOpenVersionCompare}
        className="tb-btn compare"
        disabled={!onOpenVersionCompare}
        title="Compare milestones"
      >
        Compare
      </button>

      <div className="tb-sep" />

      <button
        data-tour="import-eks"
        onClick={handleImportClick}
        className="tb-btn"
        disabled={editDisabled}
      >
        Import EKS
      </button>

      <button data-tour="export-eks" onClick={onExportEKS} className="tb-btn">
        Export EKS
      </button>

      <button data-tour="export-png" onClick={() => { void onExportPNG(); }} className="tb-btn">
        Export PNG
      </button>

      {onApplyLayout && (
        <>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutStrategy)}
            className="tb-btn"
            style={{ paddingRight: 24, appearance: 'auto' as any }}
            disabled={editDisabled}
          >
            <option value="layered">Layered</option>
            <option value="grid">Grid</option>
            <option value="force">Force</option>
            <option value="heuristic">Heuristic</option>
          </select>
          <button
            data-tour="apply-layout"
            onClick={() => {
              if (layout === 'heuristic') {
                onRelayout();
              } else {
                void onApplyLayout(layout);
              }
            }}
            className="tb-btn"
            disabled={editDisabled}
          >
            Re-layout
          </button>
        </>
      )}

      <div className="tb-sep" />

      <button
        onClick={onToggleSelfTransitions}
        className={`tb-btn ${showSelfTransitions ? 'active' : ''}`}
      >
        {showSelfTransitions ? 'Hide Self-Trans' : 'Show Self-Trans'}
      </button>

      {onOpenModelList && (
        <button data-tour="open-model" onClick={onOpenModelList} className="tb-btn">
          Open Model
        </button>
      )}

      {onCreateNewModel && (
        <button
          data-tour="new-model"
          onClick={() => setShowNewModelModal(true)}
          className="tb-btn"
        >
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>
          New Model
        </button>
      )}

      {/* New Model modal — overlay + centred dialog for entering a new model name.
          Supports Enter to confirm, Escape to cancel, and backdrop click to dismiss. */}
      {showNewModelModal && onCreateNewModel && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1200,
          }}
          onClick={() => { setShowNewModelModal(false); setNewModelName(''); }}
        >
          <div
            style={{
              backgroundColor: '#fff', borderRadius: 12, padding: 24,
              width: 420, maxWidth: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#064e3b' }}>
              Create New Model
            </h3>
            <label style={{ display: 'block', fontSize: 13, color: '#065f46', marginBottom: 6 }}>
              Model Name
            </label>
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newModelName.trim()) {
                  onCreateNewModel(newModelName.trim());
                  setNewModelName('');
                  setShowNewModelModal(false);
                }
                if (e.key === 'Escape') {
                  setNewModelName('');
                  setShowNewModelModal(false);
                }
              }}
              placeholder="Enter model name…"
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #F0D9A6', fontSize: 14, color: '#065f46', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => { setShowNewModelModal(false); setNewModelName(''); }}
                style={{
                  padding: '8px 18px', background: '#fff', color: '#065f46',
                  border: '1px solid #F0D9A6', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newModelName.trim()) {
                    onCreateNewModel(newModelName.trim());
                    setNewModelName('');
                    setShowNewModelModal(false);
                  }
                }}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {onDeleteModel && (
        <button onClick={onDeleteModel} className="tb-btn" disabled={editDisabled} style={{ color: 'var(--red)' }}>
          Delete
        </button>
      )}

      <div className="tb-spacer" />

      {/* Lock controls */}
      {!canEdit && onAcquireLock && (
        <button onClick={onAcquireLock} className="tb-btn primary">
          Request Lock
        </button>
      )}

      {canEdit && onRefreshLock && (
        <button onClick={onRefreshLock} className="tb-btn">Refresh Lock</button>
      )}

      {canEdit && onReleaseLock && (
        <button onClick={onReleaseLock} className="tb-btn">Release Lock</button>
      )}

      <div className="tb-sep" />

      {/* Auth */}
      {userRole === 'Admin' && (
        <a href="/admin" className="tb-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
          Admin Panel
        </a>
      )}
      {userEmail ? (
        <button onClick={onLogout} className="tb-btn">Logout</button>
      ) : (
        <button onClick={onSignIn} className="tb-btn primary">Sign in</button>
      )}

      <button data-tour="help" onClick={onOpenHelp} className="tb-btn">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.5v.5"/></svg>
        Help
      </button>

      {onToggleComments && (
        <button data-tour="comments" onClick={onToggleComments} className="tb-btn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v8H6l-3 2v-2H2z"/></svg>
          Comment
        </button>
      )}
    </div>
  );
}
