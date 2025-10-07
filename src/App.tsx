
import {
    Background,
    Controls,
    MiniMap,
    Panel,
    ReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './EdgeStyles.css';
import './SwimlaneStyle.css';
import './App.css';

import { GraphToolbar } from './app/components/GraphToolbar';
import { EdgeCreationHint } from './app/components/EdgeCreationHint';
import { ErrorState } from './app/components/ErrorState';
import { LoadingState } from './app/components/LoadingState';
import { TipsPanel } from './app/components/TipsPanel';
import { VersionManagerModal } from './app/components/VersionManagerModal';
import { useGraphEditor } from './app/hooks/useGraphEditor';
import { NodeModal } from './nodes/nodeModal';
import { TransitionModal } from './transitions/transitionModal';

function App() {
    const {
        nodesWithCallbacks,
        edges,
        nodeTypes,
        customEdgeTypes,
        defaultEdgeOptions,
        bmrgData,
        isLoading,
        error,
        isSaving,
        edgeCreationMode,
        startNodeId,
        showSelfTransitions,
        deltaFilter,
        isNodeModalOpen,
        isTransitionModalOpen,
        isEditing,
        initialNodeValues,
        currentTransition,
        stateNameMap,
        versions,
        isVersionModalOpen,
        onNodesChange,
        onConnect,
        onEdgeClick,
        onEdgeDoubleClick,
        handleEdgesChange,
        handleSaveNode,
        handleSaveTransition,
        handleSaveModel,
        handleReLayout,
        toggleEdgeCreationMode,
        loadExistingEdges,
        toggleSelfTransitions,
        toggleDeltaFilter,
        openAddNodeModal,
        closeNodeModal,
        closeTransitionModal,
        saveCurrentVersion,
        openVersionManager,
        closeVersionManager,
        restoreVersion,
        deleteVersion,
    } = useGraphEditor();

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={() => window.location.reload()} />;
    }

    return (
        <div className="app-container">
            <GraphToolbar
                onAddNode={openAddNodeModal}
                onToggleEdgeCreation={toggleEdgeCreationMode}
                onLoadEdges={loadExistingEdges}
                onSaveModel={handleSaveModel}
                onSaveVersion={saveCurrentVersion}
                onOpenVersionManager={openVersionManager}
                onRelayout={handleReLayout}
                onToggleSelfTransitions={toggleSelfTransitions}
                onDeltaFilterChange={toggleDeltaFilter}
                edgeCreationMode={edgeCreationMode}
                isSaving={isSaving}
                showSelfTransitions={showSelfTransitions}
                deltaFilter={deltaFilter}
                bmrgData={bmrgData}
            />

            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={customEdgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                onNodesChange={onNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                onEdgeDoubleClick={onEdgeDoubleClick}
                edgesFocusable
                elementsSelectable
                edgesReconnectable
                reconnectRadius={10}
                fitView
                fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
                proOptions={{ hideAttribution: true }}
                minZoom={0.2}
                maxZoom={2}
                nodesDraggable
                connectOnClick={false}
                zoomOnDoubleClick={false}
                panOnDrag
                panOnScroll
                snapToGrid
                snapGrid={[20, 20]}
            >
                <Background />
                <MiniMap />
                <Controls />

                <Panel position="top-right">
                    <TipsPanel />
                </Panel>
            </ReactFlow>

            <EdgeCreationHint isActive={edgeCreationMode} hasStartNode={Boolean(startNodeId)} />

            <NodeModal
                isOpen={isNodeModalOpen}
                onClose={closeNodeModal}
                onSave={handleSaveNode}
                initialValues={initialNodeValues}
                isEditing={isEditing}
            />

            <TransitionModal
                isOpen={isTransitionModalOpen}
                onClose={closeTransitionModal}
                onSave={handleSaveTransition}
                transition={currentTransition}
                stateNames={stateNameMap}
            />

            <VersionManagerModal
                isOpen={isVersionModalOpen}
                versions={versions}
                onClose={closeVersionManager}
                onRestore={restoreVersion}
                onDelete={deleteVersion}
            />
        </div>
    );
}

export default function AppWithProvider() {
    return (
        <ReactFlowProvider>
            <App />
        </ReactFlowProvider>
    );
}
