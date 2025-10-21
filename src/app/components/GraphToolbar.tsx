import { useRef, useState } from 'react';

import { BMRGData } from '../../utils/stateTransition';
import type { SaveModelResponse } from '../hooks/graphModel';
import type { LayoutStrategy } from '../../utils/layoutStrategies';

interface GraphToolbarProps {
  readonly onAddNode: () => void;
  readonly onToggleEdgeCreation: () => void;
  readonly onLoadEdges: () => void;
  readonly onSaveModel: () => Promise<SaveModelResponse>;
  readonly onSaveVersion: () => void;
  readonly onOpenVersionManager: () => void;
  readonly onImportEKS: (file: File) => void | Promise<void>;
  readonly onExportEKS: () => void;
  readonly onRelayout: () => void;
  readonly onApplyLayout?: (strategy: LayoutStrategy) => void | Promise<void>;
  readonly onToggleSelfTransitions: () => void;
  readonly edgeCreationMode: boolean;
  readonly isSaving: boolean;
  readonly showSelfTransitions: boolean;
  readonly bmrgData: BMRGData | null;
  readonly onOpenHelp: () => void;
  readonly userEmail?: string | null;
  readonly isGuest?: boolean;
  readonly onLogout?: () => void;
  readonly onSignIn?: () => void;
}

export function GraphToolbar({
  onAddNode,
  onToggleEdgeCreation,
  onLoadEdges,
  onSaveModel,
  onRelayout,
  onApplyLayout,
  onSaveVersion,
  onOpenVersionManager,
  onImportEKS,
  onExportEKS,
  onToggleSelfTransitions,
  edgeCreationMode,
  isSaving,
  showSelfTransitions,
  bmrgData,
  onOpenHelp,
  userEmail,
  onLogout,
  onSignIn,
}: GraphToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<LayoutStrategy>('force');

  // Trigger hidden file input
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Pass selected file to consumer
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportEKS(file);
    }
    // Reset input value so the same file can be chosen again
    event.target.value = '';
  };

  const plausibleTransitionCount =
    bmrgData ? bmrgData.transitions.filter((t) => t.time_25 === 1).length : 0;

  return (
    <div className="controls-toolbar" data-tour="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button data-tour="add-node" onClick={onAddNode} className="button button-primary">
        ➕ Add Node
      </button>

      <button
        data-tour="create-edge"
        onClick={onToggleEdgeCreation}
        className={`button button-edge-creation ${edgeCreationMode ? 'active' : ''}`}
      >
        {edgeCreationMode ? '🔗 Cancel Edge Creation' : '🔗 Create Edge'}
      </button>

      <button
        data-tour="load-all-edges"
        onClick={onLoadEdges}
        className="button button-secondary"
      >
        🔄 Load All Edges
      </button>

      <button
        data-tour="save-model"
        onClick={() => {
          void onSaveModel().catch(() => undefined);
        }}
        disabled={isSaving}
        className={`button button-success ${isSaving ? 'button-disabled' : ''}`}
      >
        {isSaving ? '💾 Saving...' : '💾 Save Model'}
      </button>

      <button
        data-tour="save-version"
        onClick={onSaveVersion}
        className="button button-secondary"
      >
        💾 Save Version
      </button>

      <button
        data-tour="versions"
        onClick={onOpenVersionManager}
        className="button button-secondary"
      >
        🗂 Versions
      </button>

      <button data-tour="help" onClick={onOpenHelp} className="button button-secondary">
        ❓ Help
      </button>

      <button
        data-tour="import-eks"
        onClick={handleImportClick}
        className="button button-secondary"
      >
        📥 Import EKS
      </button>

      <button
        data-tour="export-eks"
        onClick={onExportEKS}
        className="button button-secondary"
      >
        📤 Export EKS
      </button>

      {onApplyLayout && (
        <div className="layout-inline">
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutStrategy)}
            className="button button-secondary select-like-btn"
            title="Layout"
          >
            <option value="layered">Layered (directed)</option>
            <option value="grid">Grid</option>
            <option value="force">Force-directed</option>
            <option value="heuristic">Heuristic (project)</option>
          </select>

          <button
            data-tour="apply-layout"
            onClick={() => {
              if (layout === 'heuristic') {
                onRelayout();
              } else if (onApplyLayout) {
                void onApplyLayout(layout);
              }
            }}
            className="button button-secondary"
          >
            ▶ Apply Layout
          </button>
        </div>
      )}

      {/* Spacer to push identity controls to the right */}
      <div style={{ flex: 1 }} />

      {/* Identity controls (right side) */}
      {userEmail ? (
        <>
          <span className="info-panel" style={{ padding: '8px 10px' }}>
            Signed in as {userEmail}
          </span>
          <button onClick={onLogout} className="button button-secondary">
            Logout
          </button>
        </>
      ) : (
        <>
          <span className="info-panel" style={{ padding: '8px 10px' }}>
            Guest mode
          </span>
          <button onClick={onSignIn} className="button button-primary">
            Sign in
          </button>
        </>
      )}

      <button
        onClick={onToggleSelfTransitions}
        className={`button ${showSelfTransitions ? 'button-info' : 'button-secondary'}`}
      >
        {showSelfTransitions ? '🔄 Hide Self Transitions' : '🔄 Show Self Transitions'}
      </button>

      {bmrgData && (
        <div className="info-panel">
          <strong>{bmrgData.stm_name}</strong>
          <span className="info-separator">•</span>
          <span>{bmrgData.states.length} states</span>
          <span className="info-separator">•</span>
          <span>
            {plausibleTransitionCount} plausible transitions
            <span className="info-text-muted"> (of {bmrgData.transitions.length} total)</span>
          </span>
        </div>
      )}
    </div>
  );
}
