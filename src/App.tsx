// App.tsx — tour opens after auth with rAF delay, and is rendered OUTSIDE ReactFlow

import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import { ModelListModal } from './app/components/ModelListModal';
import { HelpModal } from './app/components/HelpModal';
import { useGraphEditor } from './app/hooks/useGraphEditor';
import { NodeModal } from './nodes/nodeModal';
import { TransitionModal } from './transitions/transitionModal';

import { TransitionFilterPanel } from './extensions/TransitionFilterPanel';
import './extensions/extensions.css';

import AuthPage from './app/auth/AuthPage';
import { authStorage, type AuthUser } from './app/auth/api';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Onboarding
import { Tour } from './extensions/onboarding/Tour';
import { coachSteps } from './extensions/onboarding/coachmarks';

/** Graph Editor Page */
function GraphEditor() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isModelListOpen, setIsModelListOpen] = useState(false);

  // Auth state
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();
    return token && user ? { token, user } : null;
  });
  const [isGuest, setIsGuest] = useState(false);

  // Tour visibility (do not open until after auth)
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const closeTour = () => setTourOpen(false);

  // Open tour AFTER auth/guest gate, and AFTER the editor UI has painted
  useEffect(() => {
    if (!(auth || isGuest)) return;

    // Use double rAF to ensure toolbar/panels have mounted and laid out
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setTourOpen(true));
      // store id2 on globalThis to avoid TS unused var complaint
      (globalThis as any).__raf2 = id2;
    });
    return () => cancelAnimationFrame(id1);
  }, [auth, isGuest]);

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
    applyLayout,
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

  const handleCreateNewModel = (modelName: string) => {
    // Create new model with the specified name, jump to editor with model parameter
    globalThis.location.href = `/editor?model=${encodeURIComponent(modelName)}`;
  };

  const handleLoadExistingModel = (modelName: string) => {
    // Load existing model, jump to editor with model parameter
    globalThis.location.href = `/editor?model=${encodeURIComponent(modelName)}`;
  };

  const handleModelSelection = (modelName: string, isNew: boolean) => {
    if (isNew) {
      handleCreateNewModel(modelName);
    } else {
      handleLoadExistingModel(modelName);
    }
  };

  // Auth gate
  if (!auth && !isGuest) {
    return (
      <AuthPage
        onAuthenticated={(a) => setAuth(a)}
        onContinueGuest={() => setIsGuest(true)}
        onModelSelected={handleModelSelection}
      />
    );
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => globalThis.location.reload()} />;

  return (
    <div className="app-container">
      {/* Wrap toolbar with an anchor so tour has a stable target even if buttons shift */}
      <div data-tour="toolbar">
        <GraphToolbar
          onAddNode={openAddNodeModal}
          onToggleEdgeCreation={toggleEdgeCreationMode}
          onLoadEdges={loadExistingEdges}
          onSaveModel={handleSaveModel}
          onOpenModelList={() => setIsModelListOpen(true)}
          onApplyLayout={applyLayout}
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
          userEmail={auth?.user.email ?? null}
          isGuest={isGuest}
          onLogout={() => {
            authStorage.clear();
            setAuth(null);
            setIsGuest(false);
          }}
          onSignIn={() => {
            setIsGuest(false);
          }}
        />
      </div>

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

        {/* Tips anchor */}
        <Panel
          position="top-right"
          style={{ top: 156, right: 8, width: 360, zIndex: 18 }}
          data-tour="tips"
        >
          <TipsPanel />
        </Panel>

        {/* Filters anchor wrapper so the 'filters' step always finds a target */}
          <TransitionFilterPanel
            dataTourId="filters"
            bmrgData={bmrgData}
            showSelfTransitions={showSelfTransitions}
            deltaFilter={deltaFilter}
            onToggleSelfTransitions={toggleSelfTransitions}
            onDeltaFilterChange={toggleDeltaFilter}
            onReset={loadExistingEdges}
          />
      </ReactFlow>

      {/* IMPORTANT: Tour is OUTSIDE ReactFlow to avoid clipping/z-index issues */}
      <Tour open={tourOpen} onClose={closeTour} steps={coachSteps} />

      {/* Edge creation hint banner */}
      <EdgeCreationHint isActive={edgeCreationMode} hasStartNode={Boolean(startNodeId)} />

      {/* Modals */}
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
      <ModelListModal isOpen={isModelListOpen} onClose={() => setIsModelListOpen(false)} />
    </div>
  );
}

/** Router Shell */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<GraphEditor />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Navigate to="/editor" replace />} />
        <Route path="/notfound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </Router>
  );
}

export default function AppWithProvider() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}
