import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useState } from 'react';
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
import { HelpModal } from './app/components/HelpModal';
import { useGraphEditor } from './app/hooks/useGraphEditor';
import { NodeModal } from './nodes/nodeModal';
import { TransitionModal } from './transitions/transitionModal';
import { TransitionFilterPanel } from './extensions/TransitionFilterPanel';
import './extensions/extensions.css';
import AuthPage from './app/auth/AuthPage';
import { authStorage, type AuthUser } from './app/auth/api';

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();
    return token && user ? { token, user } : null;
  });
  const [isGuest, setIsGuest] = useState(false);
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
    exportToEKS,
    importFromEKS,
  } = useGraphEditor();

  if (!auth && !isGuest) {
    return (
      <AuthPage
        onAuthenticated={(a) => setAuth(a)}
        onContinueGuest={() => setIsGuest(true)}
      />
    );
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="app-container">
      {/* Toolbar WITHOUT the old Delta filter box */}
      <GraphToolbar
        onAddNode={openAddNodeModal}
        onToggleEdgeCreation={toggleEdgeCreationMode}
        onLoadEdges={loadExistingEdges}
        onSaveModel={handleSaveModel}
        onSaveVersion={saveCurrentVersion}
        onOpenVersionManager={openVersionManager}
        onImportEKS={importFromEKS}
        onExportEKS={exportToEKS}
        onRelayout={handleReLayout}
        onToggleSelfTransitions={toggleSelfTransitions}
        edgeCreationMode={edgeCreationMode}
        isSaving={isSaving}
        showSelfTransitions={showSelfTransitions}
        bmrgData={bmrgData}
        onOpenHelp={() => setIsHelpOpen(true)}
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


        <Panel position="top-right" style={{ top: 100, right: 8, width: 360 }}>
          <TipsPanel />
        </Panel>

        {/* P2: 4. Transition Filtering*/}
        <TransitionFilterPanel
          bmrgData={bmrgData}
          showSelfTransitions={showSelfTransitions}
          deltaFilter={deltaFilter}
          onToggleSelfTransitions={toggleSelfTransitions}
          onDeltaFilterChange={toggleDeltaFilter}
          onReset={loadExistingEdges}
        />
      </ReactFlow>

      {/* Simple auth indicator + logout */}
      <Panel position="top-left" style={{ top: 8, left: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {auth ? (
            <>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>Signed in as {auth.user.email}</span>
              <button
                onClick={() => { authStorage.clear(); setAuth(null); }}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >Logout</button>
            </>
          ) : (
            <>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>Guest mode</span>
              <button
                onClick={() => { setIsGuest(false); }}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >Sign in</button>
            </>
          )}
        </div>
      </Panel>

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

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
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
