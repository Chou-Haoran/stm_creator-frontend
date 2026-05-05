
import { useEffect } from 'react';
import { addEdge, Connection, OnConnect } from '@xyflow/react';

import { DEFAULT_EDGE_OPTIONS, EXTENDED_EDGE_TYPES, EXTENDED_NODE_TYPES } from './graphConstants';
import { UseGraphEditorResult } from './useGraphEditor.types';
import { TransitionData, statesToNodes } from '../../utils/stateTransition';
import { useGraphBaseState } from './useGraphBaseState';
import { applyBmrgNodePatch, applyNodePatch, buildStateNameMap, updateNodeLabel } from './graphMutations';
import { createRebuildEdges } from './graphRebuilder';
import { createTransitionCreator, createEdgeHandlers } from './graphTransitions';
import { createNodeHandlers } from './graphNodes';
import { createFilterActions } from './graphFilters';
import { createModelActions } from './graphModel';
import { createDeleteActions } from './graphDeletes';
import { createImportExportActions } from './graphImportExport';
import { createVersionActions } from './graphVersions';
import { createLayoutActions } from './graphLayout';

interface UseGraphEditorOptions {
    canEdit?: boolean;
    onReadOnlyAction?: () => void;
    requestNodeEdit?: (nodeId: string) => Promise<boolean>;
    nodeLocks?: Record<
        string,
        {
            lockOwner?: string | null;
            lockColor?: string | null;
            ownedByMe?: boolean;
        }
    >;
}

export function useGraphEditor(options: UseGraphEditorOptions = {}): UseGraphEditorResult {
    const canEdit = options.canEdit ?? true;
    const onReadOnlyAction = options.onReadOnlyAction;
    const nodeLocks = options.nodeLocks ?? {};
    const state = useGraphBaseState();
    const blockIfReadOnly = (): boolean => {
        if (canEdit) {
            return false;
        }
        onReadOnlyAction?.();
        return true;
    };

    const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
        state.setNodes((prev) => updateNodeLabel(prev, nodeId, newLabel));
    };

    const rebuildEdges = createRebuildEdges({
        getData: () => state.bmrgData,
        getNodes: () => state.nodes,
        getIncludeSelfTransitions: () => state.showSelfTransitions,
        getDeltaFilter: () => state.deltaFilter,
        setEdges: state.setEdges,
    });

    const openTransitionModal = () => state.setIsTransitionModalOpen(true);
    const closeTransitionModal = () => state.setIsTransitionModalOpen(false);

    const createTransition = createTransitionCreator({
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        rebuildEdges,
        setCurrentTransition: state.setCurrentTransition,
        openTransitionModal,
    });

    const edgeHandlers = createEdgeHandlers({
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        setEdges: state.setEdges,
        createTransition,
        openTransitionModal,
        setCurrentTransition: state.setCurrentTransition,
    });

    const nodeHandlers = createNodeHandlers({
        getNodes: () => state.nodes,
        setNodes: state.setNodes,
        getEdgeCreationMode: () => state.edgeCreationMode,
        getStartNodeId: () => state.startNodeId,
        setStartNodeId: state.setStartNodeId,
        setEdgeCreationMode: state.setEdgeCreationMode,
        createTransition,
        setCurrentNodeId: state.setCurrentNodeId,
        setInitialNodeValues: state.setInitialNodeValues,
        setIsEditing: state.setIsEditing,
        setIsNodeModalOpen: state.setIsNodeModalOpen,
        getIsEditing: () => state.isEditing,
        getCurrentNodeId: () => state.currentNodeId,
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        handleNodeLabelChange,
        requestNodeEdit: options.requestNodeEdit,
    });

    const filterActions = createFilterActions({
        rebuildEdges,
        setShowSelfTransitions: state.setShowSelfTransitions,
        setDeltaFilter: state.setDeltaFilter,
    });

    const versionActions = createVersionActions({
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        setNodes: state.setNodes,
        handleNodeLabelChange,
        handleNodeClick: nodeHandlers.handleNodeClick,
        rebuildEdges,
        getVersions: () => state.versions,
        setVersions: state.setVersions,
        setIsVersionModalOpen: state.setIsVersionModalOpen,
    });

    const modelActions = createModelActions({
        getData: () => state.bmrgData,
        setIsSaving: state.setIsSaving,
        setNodes: state.setNodes,
        handleNodeLabelChange,
        handleNodeClick: nodeHandlers.handleNodeClick,
        setError: state.setError,
        setIsLoading: state.setIsLoading,
        setData: state.setBmrgData,
        onSaveSnapshot: (data) => {
            versionActions.saveVersionSnapshot(data, undefined, { openManager: false });
        },
    });

    const deleteActions = createDeleteActions({
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        setNodes: state.setNodes,
        rebuildEdges,
        handleNodeLabelChange,
        handleNodeClick: nodeHandlers.handleNodeClick,
    });

    const importExportActions = createImportExportActions({
        getData: () => state.bmrgData,
        setData: state.setBmrgData,
        setNodes: state.setNodes,
        rebuildEdges,
        handleNodeLabelChange,
        handleNodeClick: nodeHandlers.handleNodeClick,
        statesToNodes,
    });

    const layoutActions = createLayoutActions({
        getData: () => state.bmrgData,
        setNodes: state.setNodes,
        setData: state.setBmrgData,
    });

    useEffect(() => {
        modelActions.initialise();
        versionActions.initialise();
    }, []);

    const nodesWithCallbacks = state.nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            onLabelChange: canEdit ? handleNodeLabelChange : undefined,
            onNodeClick: canEdit ? nodeHandlers.handleNodeClick : undefined,
            isEdgeCreationMode: canEdit && state.edgeCreationMode,
            canEdit,
            enableInlineEdit: false,
            isLocked: Boolean(nodeLocks[node.id]),
            isLockedByMe: Boolean(nodeLocks[node.id]?.ownedByMe),
            lockOwner: nodeLocks[node.id]?.lockOwner ?? null,
            lockColor: nodeLocks[node.id]?.lockColor ?? null,
        },
    }));

    const stateNameMap = buildStateNameMap(state.bmrgData);

    const onConnect: OnConnect = (connection: Connection) => {
        if (blockIfReadOnly()) {
            return;
        }

        const flippedConnection: Connection = {
            ...connection,
            source: connection.target,
            target: connection.source,
            sourceHandle: connection.targetHandle
                ? connection.targetHandle.replace('target', 'source')
                : null,
            targetHandle: connection.sourceHandle
                ? connection.sourceHandle.replace('source', 'target')
                : null,
        };

        state.setEdges((prev) => addEdge(flippedConnection, prev));
    };

    const handleSaveTransition = (transition: TransitionData) => {
        if (blockIfReadOnly()) {
            return;
        }
        edgeHandlers.handleSaveTransition(transition);
        closeTransitionModal();
    };

    const applyRemoteNodePatch = (nodeId: string, graphStateId: number, field: string, value: unknown) => {
        state.setNodes((prev) => applyNodePatch(prev, nodeId, field, value));
        state.setBmrgData((prev) => {
            if (!prev) {
                return prev;
            }
            return applyBmrgNodePatch(prev, graphStateId, field, value);
        });
    };

    return {
        nodesWithCallbacks,
        edges: state.edges,
        nodeTypes: EXTENDED_NODE_TYPES,
        customEdgeTypes: EXTENDED_EDGE_TYPES,
        defaultEdgeOptions: DEFAULT_EDGE_OPTIONS,
        bmrgData: state.bmrgData,
        isLoading: state.isLoading,
        error: state.error,
        isSaving: state.isSaving,
        edgeCreationMode: state.edgeCreationMode,
        startNodeId: state.startNodeId,
        showSelfTransitions: state.showSelfTransitions,
        deltaFilter: state.deltaFilter,
        isNodeModalOpen: state.isNodeModalOpen,
        isTransitionModalOpen: state.isTransitionModalOpen,
        isEditing: state.isEditing,
        initialNodeValues: state.initialNodeValues,
        currentTransition: state.currentTransition,
        stateNameMap,
        versions: state.versions,
        isVersionModalOpen: state.isVersionModalOpen,
        onNodesChange: state.onNodesChange,
        onConnect,
        onEdgeClick: edgeHandlers.onEdgeClick,
        onEdgeDoubleClick: canEdit ? edgeHandlers.onEdgeDoubleClick : () => undefined,
        handleEdgesChange: canEdit ? edgeHandlers.handleEdgesChange : () => undefined,
        handleSaveNode: (attributes) => {
            if (blockIfReadOnly()) {
                return;
            }
            nodeHandlers.handleSaveNode(attributes);
        },
        handleDuplicateState: (nodeId) => {
            if (blockIfReadOnly()) {
                return;
            }
            nodeHandlers.handleDuplicateState(nodeId);
        },
        applyRemoteNodePatch,
        handleSaveTransition,
        handleDeleteTransition: (transition) => {
            if (blockIfReadOnly()) {
                return;
            }
            void deleteActions.handleDeleteTransition(transition);
        },
        handleSaveModel: async () => {
            if (blockIfReadOnly()) {
                throw new Error('Model is read-only.');
            }
            return modelActions.handleSaveModel();
        },
        handleDeleteState: (graphStateId) => {
            if (blockIfReadOnly()) {
                return;
            }
            void deleteActions.handleDeleteState(graphStateId);
        },
        handleDeleteModel: () => {
            if (blockIfReadOnly()) {
                return;
            }
            void deleteActions.handleDeleteModel();
        },
        // Open the node editor (NodeModal) for an existing node id. Reuses
        // the same flow as clicking on a node — including the lock-acquire
        // step. Used by the canvas right-click context menu.
        openEditNode: (nodeId) => {
            if (blockIfReadOnly()) {
                return;
            }
            nodeHandlers.handleNodeClick(nodeId);
        },
        // Open the transition editor (TransitionModal) for an existing
        // transition id. Used by the canvas right-click context menu.
        openEditTransition: (transitionId) => {
            if (blockIfReadOnly()) {
                return;
            }
            const data = state.bmrgData;
            if (!data) {
                return;
            }
            const transition = data.transitions.find(
                (item) => item.transition_id === transitionId,
            );
            if (!transition) {
                return;
            }
            state.setCurrentTransition(transition);
            openTransitionModal();
        },
        handleReLayout: modelActions.handleReLayout,
        applyLayout: canEdit
            ? layoutActions.applyLayout
            : async () => {
                  blockIfReadOnly();
              },
        toggleEdgeCreationMode: () => {
            if (blockIfReadOnly()) {
                return;
            }
            nodeHandlers.toggleEdgeCreationMode();
        },
        loadExistingEdges: filterActions.loadExistingEdges,
        toggleSelfTransitions: filterActions.toggleSelfTransitions,
        toggleDeltaFilter: filterActions.toggleDeltaFilter,
        openAddNodeModal: () => {
            if (blockIfReadOnly()) {
                return;
            }
            nodeHandlers.openAddNodeModal();
        },
        closeNodeModal: nodeHandlers.closeNodeModal,
        closeTransitionModal,
        saveCurrentVersion: (customName?: string) => {
            if (blockIfReadOnly()) {
                return;
            }
            versionActions.saveCurrentVersion(customName);
        },
        openVersionManager: versionActions.openVersionManager,
        closeVersionManager: versionActions.closeVersionManager,
        restoreVersion: versionActions.restoreVersion,
        deleteVersion: versionActions.deleteVersion,
        exportToEKS: importExportActions.exportToEKS,
        importFromEKS: async (file) => {
            if (blockIfReadOnly()) {
                return;
            }
            await importExportActions.importFromEKS(file);
        },
    };
}
