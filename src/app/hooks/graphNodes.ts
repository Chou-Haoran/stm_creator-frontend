
import { Dispatch, SetStateAction } from 'react';

import { AppNode } from '../../nodes/types';
import { NodeAttributes } from '../../nodes/nodeModal';
import { ModelData } from '../../utils/stateTransition';
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
import { findStateByGraphId, nextFrontendStateId, parseStateId } from './graph-utils';

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
    getData: () => ModelData | null;
    setData: Dispatch<SetStateAction<ModelData | null>>;
    handleNodeLabelChange: (nodeId: string, label: string) => void;
    requestNodeEdit?: (nodeId: string) => Promise<boolean>;
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
    getData,
    setData,
    handleNodeLabelChange,
    requestNodeEdit,
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

        void (async () => {
            const allowed = requestNodeEdit ? await requestNodeEdit(nodeId) : true;
            if (!allowed) {
                return;
            }

            setCurrentNodeId(nodeId);
            setInitialNodeValues(deriveModalValues(node));
            setIsEditing(true);
            setIsNodeModalOpen(true);
        })();
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
            // Use the same numeric id for BOTH the React Flow node (`state-N`)
            // and the BMRG state's frontend_state_id, so parseStateId() can
            // recover the BMRG state from the React Flow edge endpoints. This
            // is required for transition creation/editing to work for newly
            // added nodes.
            const data = getData();
            if (!data) {
                return;
            }
            const nextStateId = nextFrontendStateId(data.states);

            setNodes((prev) => [
                ...prev,
                createCustomNode(
                    attributes,
                    nextStateId,
                    handleNodeLabelChange,
                    handleNodeClick,
                ),
            ]);
            setData((prev) => {
                if (!prev) {
                    return prev;
                }
                const newState = buildStateFromAttributes(attributes, nextStateId);
                return addStateToBmrg(prev, newState);
            });
        }

        setIsNodeModalOpen(false);
    };

    const handleDuplicateState = (nodeId: string) => {
        const data = getData();
        const graphStateId = parseStateId(nodeId);
        if (!data || graphStateId === null) {
            return;
        }

        const sourceState = findStateByGraphId(data.states, graphStateId);
        const sourceNode = getNodes().find((node) => node.id === nodeId);
        if (!sourceState || !sourceNode) {
            return;
        }

        const nextStateId = nextFrontendStateId(data.states);
        const nextName = uniqueCopyName(
            sourceState.state_name || 'State',
            data.states.map((state) => state.state_name),
        );
        const nextPosition = {
            x: sourceNode.position.x + 48,
            y: sourceNode.position.y + 48,
        };
        const copiedAttributes = cloneValue(sourceState.attributes ?? {}) as Record<string, unknown>;
        copiedAttributes.position = nextPosition;

        const duplicatedState = cloneValue(sourceState) as ModelData['states'][number];
        delete duplicatedState.state_id;
        duplicatedState.frontend_state_id = nextStateId;
        duplicatedState.state_name = nextName;
        duplicatedState.attributes = copiedAttributes;

        const imageUrls = normaliseStateImageUrls(copiedAttributes);
        const attributes: NodeAttributes = {
            stateName: nextName,
            stateNumber: String(nextStateId),
            vastClass: sourceState.vast_state?.vast_class ?? '',
            condition: getConditionString(sourceState),
            imageUrl: imageUrls[0] ?? '',
            imageUrls,
            note: typeof copiedAttributes.note === 'string' ? copiedAttributes.note : '',
            template: copiedAttributes.template as NodeAttributes['template'],
        };

        setData((prev) => {
            if (!prev) {
                return prev;
            }
            return addStateToBmrg(prev, duplicatedState);
        });
        setNodes((prev) => [
            ...prev,
            createCustomNode(
                attributes,
                nextStateId,
                handleNodeLabelChange,
                handleNodeClick,
                nextPosition,
            ),
        ]);
        setCurrentNodeId(null);
        setInitialNodeValues(undefined);
        setIsEditing(false);
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

    // Begin creating a transition with `nodeId` pre-selected as the source.
    // The next node click completes it via handleNodeClick's edge-creation path.
    const beginTransitionFromNode = (nodeId: string) => {
        setEdgeCreationMode(true);
        setStartNodeId(nodeId);
        setNodes((prev) => selectNodeForEdgeCreation(prev, nodeId));
    };

    // Round every node's position to the nearest `size` grid step. This is a
    // one-shot reposition; the new positions persist on the next model save
    // (saveModel reads positions from the live nodes).
    const snapAllNodesToGrid = (size: number) => {
        const grid = Math.max(1, Math.round(size));
        setNodes((prev) =>
            prev.map((node) => ({
                ...node,
                position: {
                    x: Math.round(node.position.x / grid) * grid,
                    y: Math.round(node.position.y / grid) * grid,
                },
            })),
        );
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
        handleDuplicateState,
        toggleEdgeCreationMode,
        beginTransitionFromNode,
        snapAllNodesToGrid,
        openAddNodeModal,
        closeNodeModal,
    };
}

function getConditionString(state: ModelData['states'][number]): string {
    if (state.condition_upper === -9999 || state.condition_lower === -9999) {
        return 'No condition data';
    }
    return `Condition range: ${state.condition_lower.toFixed(2)} - ${state.condition_upper.toFixed(2)}`;
}

function uniqueCopyName(baseName: string, existingNames: string[]): string {
    const baseCopyName = `${baseName} Copy`;
    const existing = new Set(existingNames);
    if (!existing.has(baseCopyName)) {
        return baseCopyName;
    }

    let index = 2;
    while (existing.has(`${baseCopyName} ${index}`)) {
        index += 1;
    }
    return `${baseCopyName} ${index}`;
}

function normaliseStateImageUrls(attributes: Record<string, unknown>): string[] {
    if (Array.isArray(attributes.imageUrls)) {
        return attributes.imageUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '');
    }
    return typeof attributes.imageUrl === 'string' && attributes.imageUrl.trim() !== '' ? [attributes.imageUrl] : [];
}

function cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}
