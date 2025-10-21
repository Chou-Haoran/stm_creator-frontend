
import { Edge } from '@xyflow/react';

import { NodeAttributes } from '../../nodes/nodeModal';
import { AppNode, CustomNodeData } from '../../nodes/types';
import { BMRGData, StateData, TransitionData, getGraphStateId } from '../../utils/stateTransition';

export function updateNodeLabel(nodes: AppNode[], nodeId: string, newLabel: string): AppNode[] {
    return nodes.map((node) => {
        if (node.id !== nodeId) {
            return node;
        }

        return {
            ...node,
            data: { ...node.data, label: newLabel },
        } as AppNode;
    });
}

export function selectNodeForEdgeCreation(nodes: AppNode[], selectedNodeId: string): AppNode[] {
    return nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            isSelected: node.id === selectedNodeId,
        },
    }));
}

export function clearNodeSelection(nodes: AppNode[]): AppNode[] {
    return nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            isSelected: false,
        },
    }));
}

export function deriveModalValues(node: AppNode): NodeAttributes {
    return {
        stateName: node.data.label,
        stateNumber: node.data.attributes?.stateNumber ?? '',
        vastClass: node.data.attributes?.vastClass ?? '',
        condition: node.data.attributes?.condition ?? '',
        imageUrl: node.data.attributes?.imageUrl ?? '',
        note: node.data.attributes?.note ?? '',
        id: node.id,
    };
}

export function applyNodeAttributes(nodes: AppNode[], nodeId: string, attributes: NodeAttributes): AppNode[] {
    return nodes.map((node) => {
        if (node.id !== nodeId) {
            return node;
        }

        return {
            ...node,
            data: {
                ...node.data,
                label: attributes.stateName,
                attributes: {
                    stateName: attributes.stateName,
                    stateNumber: attributes.stateNumber,
                    vastClass: attributes.vastClass,
                    condition: attributes.condition,
                    imageUrl: attributes.imageUrl,
                    note: attributes.note,
                },
            },
        } as AppNode;
    });
}

export function createCustomNode(
    attributes: NodeAttributes,
    onLabelChange: (id: string, label: string) => void,
    onNodeClick: (id: string) => void,
): AppNode {
    const nodeData: CustomNodeData = {
        label: attributes.stateName,
        onLabelChange,
        onNodeClick,
        attributes: {
            stateName: attributes.stateName,
            stateNumber: attributes.stateNumber,
            vastClass: attributes.vastClass,
            condition: attributes.condition,
            imageUrl: attributes.imageUrl,
            note: attributes.note,
        },
    };

    return {
        id: `node-${Date.now()}`,
        type: 'custom',
        data: nodeData,
        position: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        },
    } as AppNode;
}

export function updateBmrgStateName(
    data: BMRGData,
    stateId: number,
    attributes: NodeAttributes,
): BMRGData {
    const states = data.states.map((state) => {
        if (getGraphStateId(state) !== stateId) {
            return state;
        }

        const nextAttributes = {
            ...(state.attributes ?? {}),
            ...(attributes.imageUrl !== undefined ? { imageUrl: attributes.imageUrl } : {}),
            ...(attributes.note !== undefined ? { note: attributes.note } : {}),
        };

        return {
            ...state,
            state_name: attributes.stateName,
            attributes: nextAttributes,
        };
    });

    return {
        ...data,
        states,
    };
}



export function buildStateFromAttributes(
    attributes: NodeAttributes,
    newStateId: number,
): StateData {
    return {
        frontend_state_id: newStateId,
        state_name: attributes.stateName,
        vast_state: {
            vast_class: attributes.vastClass,
            vast_name: '',
            vast_eks_state: -9999,
            eks_overstorey_class: '',
            eks_understorey_class: '',
            eks_substate: '',
            link: '',
        },
        condition_upper: 1.0,
        condition_lower: 0.0,
        eks_condition_estimate: -9999,
        elicitation_type: 'user-created',
        attributes: attributes.imageUrl ? { imageUrl: attributes.imageUrl } : null,
    };
}
export function addStateToBmrg(data: BMRGData, state: StateData): BMRGData {
    return {
        ...data,
        states: [...data.states, state],
    };
}

export function buildStateNameMap(data: BMRGData | null): Record<number, string> {
    if (!data) {
        return {};
    }

    return data.states.reduce<Record<number, string>>((map, state) => {
        const id = getGraphStateId(state);
        map[id] = state.state_name;
        return map;
    }, {});
}

export function updateEdgeWithTransition(
    edges: Edge[],
    transition: TransitionData,
): Edge[] {
    return edges.map((edge) => {
        if (edge.id !== `transition-${transition.transition_id}`) {
            return edge;
        }

        return {
            ...edge,
            data: {
                ...edge.data,
                transitionDelta: transition.transition_delta,
                time25: transition.time_25,
                time100: transition.time_100,
                notes: transition.notes,
            },
        };
    });
}
