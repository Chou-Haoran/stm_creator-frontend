
import { useEffect } from 'react';
import { addEdge, Connection, OnConnect } from '@xyflow/react';

import { DEFAULT_EDGE_OPTIONS, EXTENDED_EDGE_TYPES, EXTENDED_NODE_TYPES } from './graphConstants';
import { UseGraphEditorResult } from './useGraphEditor.types';
import { TransitionData } from '../../utils/stateTransition';
import { useGraphBaseState } from './useGraphBaseState';
import { buildStateNameMap, updateNodeLabel } from './graphMutations';
import { createRebuildEdges } from './graphRebuilder';
import { createTransitionCreator, createEdgeHandlers } from './graphTransitions';
import { createNodeHandlers } from './graphNodes';
import { createFilterActions } from './graphFilters';
import { createModelActions } from './graphModel';

export function useGraphEditor(): UseGraphEditorResult {
    const state = useGraphBaseState();

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
        setData: state.setBmrgData,
        handleNodeLabelChange,
    });

    const filterActions = createFilterActions({
        rebuildEdges,
        setShowSelfTransitions: state.setShowSelfTransitions,
        setDeltaFilter: state.setDeltaFilter,
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
    });

    useEffect(() => {
        modelActions.initialise();
    }, []);

    const nodesWithCallbacks = state.nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            onLabelChange: handleNodeLabelChange,
            onNodeClick: nodeHandlers.handleNodeClick,
            isEdgeCreationMode: state.edgeCreationMode,
        },
    }));

    const stateNameMap = buildStateNameMap(state.bmrgData);

    const onConnect: OnConnect = (connection: Connection) => {
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
        edgeHandlers.handleSaveTransition(transition);
        closeTransitionModal();
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
        onNodesChange: state.onNodesChange,
        onConnect,
        onEdgeClick: edgeHandlers.onEdgeClick,
        onEdgeDoubleClick: edgeHandlers.onEdgeDoubleClick,
        handleEdgesChange: edgeHandlers.handleEdgesChange,
        handleSaveNode: nodeHandlers.handleSaveNode,
        handleSaveTransition,
        handleSaveModel: modelActions.handleSaveModel,
        handleReLayout: modelActions.handleReLayout,
        toggleEdgeCreationMode: nodeHandlers.toggleEdgeCreationMode,
        loadExistingEdges: filterActions.loadExistingEdges,
        toggleSelfTransitions: filterActions.toggleSelfTransitions,
        toggleDeltaFilter: filterActions.toggleDeltaFilter,
        openAddNodeModal: nodeHandlers.openAddNodeModal,
        closeNodeModal: nodeHandlers.closeNodeModal,
        closeTransitionModal,
    };
}
