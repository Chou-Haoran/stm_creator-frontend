
import { BMRGData } from '../../utils/stateTransition';
import { DeltaFilterOption } from '../types';

interface GraphToolbarProps {
    onAddNode: () => void;
    onToggleEdgeCreation: () => void;
    onLoadEdges: () => void;
    onSaveModel: () => void | Promise<void>;
    onSaveVersion: () => void;
    onOpenVersionManager: () => void;
    onRelayout: () => void;
    onToggleSelfTransitions: () => void;
    onDeltaFilterChange: (option: DeltaFilterOption) => void;
    edgeCreationMode: boolean;
    isSaving: boolean;
    showSelfTransitions: boolean;
    deltaFilter: DeltaFilterOption;
    bmrgData: BMRGData | null;
}

export function GraphToolbar({
    onAddNode,
    onToggleEdgeCreation,
    onLoadEdges,
    onSaveModel,
    onRelayout,
    onSaveVersion,
    onOpenVersionManager,
    onToggleSelfTransitions,
    onDeltaFilterChange,
    edgeCreationMode,
    isSaving,
    showSelfTransitions,
    deltaFilter,
    bmrgData,
}: GraphToolbarProps) {
    const plausibleTransitionCount = bmrgData
        ? bmrgData.transitions.filter((transition) => transition.time_25 === 1).length
        : 0;

    return (
        <div className="controls-toolbar">
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

            <button onClick={onRelayout} className="button button-secondary">
                📊 Re-layout
            </button>

            <button
                onClick={onToggleSelfTransitions}
                className={`button ${showSelfTransitions ? 'button-info' : 'button-secondary'}`}
            >
                {showSelfTransitions ? '🔄 Hide Self Transitions' : '🔄 Show Self Transitions'}
            </button>

            <div className="filter-group">
                <span className="filter-label">Filter by Delta:</span>
                <button
                    onClick={() => onDeltaFilterChange('all')}
                    className={`button button-filter ${deltaFilter === 'all' ? 'active' : ''}`}
                >
                    All
                </button>
                <button
                    onClick={() => onDeltaFilterChange('positive')}
                    className={`button button-filter positive ${
                        deltaFilter === 'positive' ? 'active' : ''
                    }`}
                >
                    Positive Δ
                </button>
                <button
                    onClick={() => onDeltaFilterChange('neutral')}
                    className={`button button-filter neutral ${
                        deltaFilter === 'neutral' ? 'active' : ''
                    }`}
                >
                    Neutral Δ
                </button>
                <button
                    onClick={() => onDeltaFilterChange('negative')}
                    className={`button button-filter negative ${
                        deltaFilter === 'negative' ? 'active' : ''
                    }`}
                >
                    Negative Δ
                </button>
            </div>

            {bmrgData && (
                <div className="info-panel">
                    <strong>{bmrgData.stm_name}</strong>
                    <span className="info-separator">•</span>
                    <span>{bmrgData.states.length} states</span>
                    <span className="info-separator">•</span>
                    <span>
                        {plausibleTransitionCount} plausible transitions
                        <span className="info-text-muted">
                            {' '}(of {bmrgData.transitions.length} total)
                        </span>
                    </span>
                    {deltaFilter !== 'all' && (
                        <>
                            <span className="info-separator">•</span>
                            <span className={`delta-filter-badge ${deltaFilter}`}>
                                Showing {deltaFilter} Δ transitions
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
