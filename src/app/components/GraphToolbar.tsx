import { useRef, useState } from 'react';

import { BMRGData } from '../../utils/stateTransition';
import type { SaveModelResponse } from '../hooks/graphModel';
import type { LayoutStrategy } from '../../utils/layoutStrategies';
import type { GlobalRole, ModelRole } from '../../constants/roles';
import { CreateModelModal } from '../../components/CreateModelModal';
import { ToolbarDropdown } from '../../components/toolbar/ToolbarDropdown';
import { canEditModel, canManageModelPermissions, isAdmin } from '../../utils/permissions';

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
  readonly onOpenModelPermissions?: () => void;
  readonly userEmail?: string | null;
  readonly userRole?: GlobalRole | null;
  readonly currentModelRole?: ModelRole | null;
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
  onOpenModelPermissions,
  userEmail,
  userRole,
  currentModelRole,
  onLogout,
  onSignIn,
  canEdit,
  lockHolder,
  lockExpiresAt,
  onAcquireLock,
  onReleaseLock,
  onRefreshLock,
}: GraphToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<LayoutStrategy>('force');
  const [openSection, setOpenSection] = useState<'canvas' | 'model' | 'file' | 'view' | null>(null);
  // Controls visibility of the "Create New Model" modal dialog
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const roleCanEdit = canEditModel(currentModelRole ?? undefined);
  const canManagePermissions = canManageModelPermissions(currentModelRole ?? undefined, userRole ?? undefined);
  const editDisabled = !canEdit || !roleCanEdit;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const toggleSection = (section: 'canvas' | 'model' | 'file' | 'view') => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const closeAfter = (action?: () => void | Promise<void>) => {
    action?.();
    setOpenSection(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportEKS(file);
    }
    event.target.value = '';
  };

  const lockTitle = lockHolder
    ? `Lock held by ${lockHolder}${lockExpiresAt ? ` until ${new Date(lockExpiresAt).toLocaleString()}` : ''}`
    : canEdit
      ? 'You can edit this model'
      : 'Request edit lock';

  return (
    <div className="toolbar" style={{ position: 'relative' }}>
      <span className="toolbar-logo">STM</span>
      <div className="tb-sep" />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ToolbarDropdown
        label="Canvas"
        isOpen={openSection === 'canvas'}
        onToggle={() => toggleSection('canvas')}
      >
        <button
          type="button"
          data-tour="add-node"
          onClick={() => closeAfter(onAddNode)}
          className="tb-btn primary"
          disabled={editDisabled}
        >
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>
          Add Node
        </button>

        <button
          type="button"
          data-tour="create-edge"
          onClick={() => closeAfter(onToggleEdgeCreation)}
          className={`tb-btn ${edgeCreationMode ? 'active' : ''}`}
          disabled={editDisabled}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M8 2v12"/><circle cx="8" cy="8" r="2"/></svg>
          {edgeCreationMode ? 'Cancel Edge' : 'Create Edge'}
        </button>

        <button type="button" data-tour="load-all-edges" onClick={() => closeAfter(onLoadEdges)} className="tb-btn">
          Load All Edges
        </button>
      </ToolbarDropdown>

      <ToolbarDropdown
        label="Model"
        isOpen={openSection === 'model'}
        onToggle={() => toggleSection('model')}
      >
        <button
          type="button"
          data-tour="save-model"
          onClick={() => {
            void onSaveModel().catch(() => undefined);
            setOpenSection(null);
          }}
          disabled={isSaving || editDisabled}
          className="tb-btn"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12V4l4 4 3-3 5 5"/></svg>
          {isSaving ? 'Saving...' : 'Save Model'}
        </button>

        <button type="button" data-tour="milestone" onClick={() => closeAfter(onOpenMilestone)} className="tb-btn">
          Milestone
        </button>

        <button
          type="button"
          data-tour="compare-versions"
          onClick={() => closeAfter(onOpenVersionCompare)}
          className="tb-btn compare"
          disabled={!onOpenVersionCompare}
          title="Compare milestones"
        >
          Compare
        </button>

        {onCreateNewModel && (
          <button
            type="button"
            data-tour="new-model"
            onClick={() => {
              setShowNewModelModal(true);
              setOpenSection(null);
            }}
            className="tb-btn"
          >
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>
            New Model
          </button>
        )}

        {onDeleteModel && roleCanEdit && (
          <>
            <div className="tb-dropdown-divider" />
            <button
              type="button"
              onClick={() => closeAfter(onDeleteModel)}
              className="tb-btn danger"
              disabled={editDisabled}
            >
              Delete
            </button>
          </>
        )}
      </ToolbarDropdown>

      <ToolbarDropdown
        label="File"
        isOpen={openSection === 'file'}
        onToggle={() => toggleSection('file')}
      >
        <button
          type="button"
          data-tour="import-eks"
          onClick={() => closeAfter(handleImportClick)}
          className="tb-btn"
          disabled={editDisabled}
        >
          Import EKS
        </button>

        <button type="button" data-tour="export-eks" onClick={() => closeAfter(onExportEKS)} className="tb-btn">
          Export EKS
        </button>

        <button
          type="button"
          data-tour="export-png"
          onClick={() => {
            void onExportPNG();
            setOpenSection(null);
          }}
          className="tb-btn"
          title="Export the current canvas as a PNG image for embedding in PowerPoint"
        >
          Export PNG
        </button>
      </ToolbarDropdown>

      <ToolbarDropdown
        label="View"
        isOpen={openSection === 'view'}
        onToggle={() => toggleSection('view')}
      >
        {onApplyLayout && (
          <>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutStrategy)}
              className="tb-btn tb-dropdown-select"
              style={{ paddingRight: 24, appearance: 'auto' as any }}
              disabled={editDisabled}
            >
              <option value="layered">Layered</option>
              <option value="grid">Grid</option>
              <option value="force">Force</option>
              <option value="heuristic">Heuristic</option>
            </select>

            <button
              type="button"
              data-tour="apply-layout"
              onClick={() => {
                if (layout === 'heuristic') {
                  onRelayout();
                } else {
                  void onApplyLayout(layout);
                }
                setOpenSection(null);
              }}
              className="tb-btn"
              disabled={editDisabled}
            >
              Re-layout
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onToggleSelfTransitions}
          className={`tb-btn ${showSelfTransitions ? 'active' : ''}`}
        >
          {showSelfTransitions ? 'Hide Self-Trans' : 'Show Self-Trans'}
        </button>
      </ToolbarDropdown>

      <CreateModelModal
        isOpen={showNewModelModal && Boolean(onCreateNewModel)}
        onClose={() => setShowNewModelModal(false)}
        onCreated={(modelName) => {
          setShowNewModelModal(false);
          onCreateNewModel?.(modelName);
        }}
      />

      <div className="tb-spacer" />

      {/* Lock controls */}
      {!canEdit && onAcquireLock && (
        <button type="button" onClick={onAcquireLock} className="tb-btn primary tb-global-action" title={lockTitle} aria-label="Request lock">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>
          <span>Lock</span>
        </button>
      )}

      {canEdit && onRefreshLock && (
        <button type="button" onClick={onRefreshLock} className="tb-btn tb-global-action" title="Refresh lock" aria-label="Refresh lock">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3.5v4h-4"/></svg>
          <span>Refresh</span>
        </button>
      )}

      {canEdit && onReleaseLock && (
        <button type="button" onClick={onReleaseLock} className="tb-btn tb-global-action" title="Release lock" aria-label="Release lock">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 4.4-1.65"/></svg>
          <span>Unlock</span>
        </button>
      )}

      <div className="tb-sep" />

      {/* Auth */}
      {isAdmin(userRole ?? undefined) && (
        <a href="/admin" className="tb-btn tb-global-action" style={{ textDecoration: 'none', color: 'inherit' }} title="Admin Panel" aria-label="Admin Panel">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l5 2v3c0 3.2-2 5.6-5 7-3-1.4-5-3.8-5-7V4z"/><path d="M6.5 8l1 1 2-2"/></svg>
          <span>Admin</span>
        </a>
      )}
      {canManagePermissions && (
        <button type="button" onClick={onOpenModelPermissions} className="tb-btn tb-global-action" disabled={!onOpenModelPermissions} title="Share" aria-label="Share">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="8" r="2"/><circle cx="11.5" cy="4.5" r="1.8"/><circle cx="11.5" cy="11.5" r="1.8"/><path d="M6.8 7.1l3-1.6M6.8 8.9l3 1.6"/></svg>
          <span>Share</span>
        </button>
      )}
      {userEmail && (
        <button type="button" onClick={onOpenModelList} className="tb-btn tb-global-action" disabled={!onOpenModelList} title="Models" aria-label="Models">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4.5h11v8h-11z"/><path d="M4.5 2.5h7v2"/></svg>
          <span>Models</span>
        </button>
      )}

      <div className="tb-sep" />

      {userEmail ? (
        <button type="button" onClick={onLogout} className="tb-btn tb-global-action" title="Logout" aria-label="Logout">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3H3v10h3"/><path d="M8 8h6"/><path d="M11.5 5.5L14 8l-2.5 2.5"/></svg>
          <span>Logout</span>
        </button>
      ) : (
        <button type="button" onClick={onSignIn} className="tb-btn primary tb-global-action" title="Sign in" aria-label="Sign in">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3h3v10h-3"/><path d="M2 8h8"/><path d="M7.5 5.5L10 8l-2.5 2.5"/></svg>
          <span>Sign in</span>
        </button>
      )}

      <div className="tb-sep" />

      <button type="button" data-tour="help" onClick={onOpenHelp} className="tb-btn tb-global-action" title="Help" aria-label="Help">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.5v.5"/></svg>
        <span>Help</span>
      </button>

      {onToggleComments && (
        <button type="button" data-tour="comments" onClick={onToggleComments} className="tb-btn tb-global-action" title="Comments" aria-label="Comments">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v8H6l-3 2v-2H2z"/></svg>
          <span>Comments</span>
        </button>
      )}
    </div>
  );
}
