
import { Dispatch, SetStateAction } from 'react';

import { AppNode } from '../../nodes/types';
import { NodeAttributes } from '../../nodes/nodeModal';
import { BMRGData } from '../../utils/stateTransition';
import {
    addStateToBmrg,
    applyNodeAttributes,
    buildStateFromAttributes,
    clearNodeSelection,
    createCustomNode,
    deriveModalValues,
    selectNodeForEdgeCreation,
    updateBmrgStateName,
    updateNodeLabel,
} from './graphMutations';
import { nextId, parseStateId } from './graph-utils';

interface Dependencies {
    getNodes: () => AppNode[];
    setNodes: Dispatch<SetStateAction<AppNode[]>>;
    getEdgeCreationMode: () => boolean;
    getStartNodeId: () => string | null;
    setStartNodeId: Dispatch<SetStateAction<string | null>>;
    setEdgeCreationMode: Dispatch<SetStateAction<boolean>>;
    createTransition: (sourceNodeId: string, targetNodeId: string) => void;
    setCurrentNodeId: Dispatch<SetStateAction<string | null>>;
    setInitialNodeValues: Dispatch<SetStateAction<NodeAttributes | undefined>>;
    setIsEditing: Dispatch<SetStateAction<boolean>>;
    setIsNodeModalOpen: Dispatch<SetStateAction<boolean>>;
    getIsEditing: () => boolean;
    getCurrentNodeId: () => string | null;
    setData: Dispatch<SetStateAction<BMRGData | null>>;
    handleNodeLabelChange: (nodeId: string, label: string) => void;
}

export function createNodeHandlers({
    getNodes,
    setNodes,
    getEdgeCreationMode,
    getStartNodeId,
    setStartNodeId,
    setEdgeCreationMode,
    createTransition,
    setCurrentNodeId,
    setInitialNodeValues,
    setIsEditing,
    setIsNodeModalOpen,
    getIsEditing,
    getCurrentNodeId,
    setData,
    handleNodeLabelChange,
}: Dependencies) {
    const handleNodeClick = (nodeId: string) => {
        if (getEdgeCreationMode()) {
            const startNodeId = getStartNodeId();
            if (!startNodeId) {
                setStartNodeId(nodeId);
                setNodes((prev) => selectNodeForEdgeCreation(prev, nodeId));
                return;
            }

            createTransition(startNodeId, nodeId);
            setNodes((prev) => clearNodeSelection(prev));
            setStartNodeId(null);
            setEdgeCreationMode(false);
            return;
        }

        const node = getNodes().find((item) => item.id === nodeId);
        if (!node) {
            return;
        }

        setCurrentNodeId(nodeId);
        setInitialNodeValues(deriveModalValues(node));
        setIsEditing(true);
        setIsNodeModalOpen(true);
    };

    const handleNodeLabelChangeInternal = (nodeId: string, newLabel: string) => {
        setNodes((prev) => updateNodeLabel(prev, nodeId, newLabel));
    };

    const handleSaveNode = (attributes: NodeAttributes) => {
        if (getIsEditing()) {
            const currentNodeId = getCurrentNodeId();
            if (!currentNodeId) {
                return;
            }

            setNodes((prev) => applyNodeAttributes(prev, currentNodeId, attributes));
            setData((prev) => {
                if (!prev) {
                    return prev;
                }

                const stateId = parseStateId(currentNodeId);
                if (stateId === null) {
                    return prev;
                }

                return updateBmrgStateName(prev, stateId, attributes);
            });
        } else {
            setNodes((prev) => [
                ...prev,
                createCustomNode(attributes, handleNodeLabelChange, handleNodeClick),
            ]);
            setData((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextStateId = nextId(prev.states.map((state) => state.state_id));
                const newState = buildStateFromAttributes(attributes, nextStateId);
                return addStateToBmrg(prev, newState);
            });
        }

        setIsNodeModalOpen(false);
    };

    const toggleEdgeCreationMode = () => {
        setEdgeCreationMode((prev) => {
            if (prev) {
                setStartNodeId(null);
                setNodes((nodes) => clearNodeSelection(nodes));
            }
            return !prev;
        });
    };

    const openAddNodeModal = () => {
        setCurrentNodeId(null);
        setInitialNodeValues(undefined);
        setIsEditing(false);
        setIsNodeModalOpen(true);
    };

    const closeNodeModal = () => {
        setIsNodeModalOpen(false);
    };

    return {
        handleNodeClick,
        handleNodeLabelChange: handleNodeLabelChangeInternal,
        handleSaveNode,
        toggleEdgeCreationMode,
        openAddNodeModal,
        closeNodeModal,
    };
}
