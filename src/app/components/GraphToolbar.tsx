import { useRef } from 'react';

import { BMRGData } from '../../utils/stateTransition';

interface GraphToolbarProps {
  readonly onAddNode: () => void;
  readonly onToggleEdgeCreation: () => void;
  readonly onLoadEdges: () => void;
  readonly onSaveModel: () => void | Promise<void>;
  readonly onSaveVersion: () => void;
  readonly onOpenVersionManager: () => void;
  readonly onImportEKS: (file: File) => void | Promise<void>;
  readonly onExportEKS: () => void;
  readonly onRelayout: () => void;
  readonly onToggleSelfTransitions: () => void;
  readonly edgeCreationMode: boolean;
  readonly isSaving: boolean;
  readonly showSelfTransitions: boolean;
  readonly bmrgData: BMRGData | null;
  readonly onOpenHelp: () => void;
}

export function GraphToolbar({
  onAddNode,
  onToggleEdgeCreation,
  onLoadEdges,
  onSaveModel,
  onRelayout,
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
}: GraphToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const plausibleTransitionCount =
    bmrgData ? bmrgData.transitions.filter((t) => t.time_25 === 1).length : 0;

  return (
    <div className="controls-toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button onClick={onAddNode} className="button button-primary">
        ➕ Add Node
      </button>

      <button
        onClick={onToggleEdgeCreation}
        className={`button button-edge-creation ${edgeCreationMode ? 'active' : ''}`}
      >
        {edgeCreationMode ? '🔗 Cancel Edge Creation' : '🔗 Create Edge'}
      </button>

      <button onClick={onLoadEdges} className="button button-secondary">
        🔄 Load All Edges
      </button>

      <button
        onClick={onSaveModel}
        disabled={isSaving}
        className={`button button-success ${isSaving ? 'button-disabled' : ''}`}
      >
        {isSaving ? '💾 Saving...' : '💾 Save Model'}
      </button>

      <button onClick={onSaveVersion} className="button button-secondary">
        💾 Save Version
      </button>

      <button onClick={onOpenVersionManager} className="button button-secondary">
        🗂 Versions
      </button>

      <button onClick={onOpenHelp} className="button button-secondary">
        ❓ Help
      </button>

      <button onClick={handleImportClick} className="button button-secondary">
        📥 Import EKS
      </button>

      <button onClick={onExportEKS} className="button button-secondary">
        📤 Export EKS
      </button>

      <button onClick={onRelayout} className="button button-secondary">
        📊 Re-layout
      </button>

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
