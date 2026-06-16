
import { Edge } from '@xyflow/react';

import { NodeAttributes } from '../../nodes/nodeModal';
import { AppNode, CustomNodeData } from '../../nodes/types';
import { ModelData, StateData, TransitionData, getGraphStateId } from '../../utils/stateTransition';

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
    const imageUrls = normaliseImageUrls(node.data.attributes);
    return {
        stateName: node.data.label,
        stateNumber: node.data.attributes?.stateNumber ?? '',
        vastClass: node.data.attributes?.vastClass ?? '',
        condition: node.data.attributes?.condition ?? '',
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
        note: node.data.attributes?.note ?? '',
        id: node.id,
        template: node.data.attributes?.template,
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
                    imageUrl: normaliseImageUrls(attributes)[0] ?? '',
                    imageUrls: normaliseImageUrls(attributes),
                    note: attributes.note,
                    template: attributes.template,
                },
            },
        } as AppNode;
    });
}

function parseConditionBounds(condition: string | undefined): { lower: string; upper: string } {
    const regex = /Condition\s*range:\s*([\d.+-]+)\s*-\s*([\d.+-]+)/i;
    const match = regex.exec(condition ?? '');
    return {
        lower: match?.[1] ?? '',
        upper: match?.[2] ?? '',
    };
}

function formatConditionRange(lowerRaw: string, upperRaw: string, fallback: string): string {
    const lower = parseFloat(lowerRaw);
    const upper = parseFloat(upperRaw);
    if (Number.isNaN(lower) || Number.isNaN(upper)) {
        return fallback;
    }
    return `Condition range: ${lower.toFixed(2)} - ${upper.toFixed(2)}`;
}

function isPositionValue(value: unknown): value is { x: number; y: number } {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const maybePosition = value as { x?: unknown; y?: unknown };
    return typeof maybePosition.x === 'number' && Number.isFinite(maybePosition.x)
        && typeof maybePosition.y === 'number' && Number.isFinite(maybePosition.y);
}

export function applyNodePatch(nodes: AppNode[], nodeId: string, field: string, value: unknown): AppNode[] {
    return nodes.map((node) => {
        if (node.id !== nodeId) {
            return node;
        }

        const currentAttributes = node.data.attributes ?? {
            stateName: node.data.label,
            stateNumber: '',
            vastClass: '',
            condition: '',
            imageUrl: '',
            imageUrls: [],
            note: '',
            template: undefined,
        };

        const nextAttributes = { ...currentAttributes };
        let nextLabel = node.data.label;

        if (field === 'stateName' && typeof value === 'string') {
            nextLabel = value;
            nextAttributes.stateName = value;
        } else if (field === 'stateNumber' && typeof value === 'string') {
            nextAttributes.stateNumber = value;
        } else if (field === 'vastClass' && typeof value === 'string') {
            nextAttributes.vastClass = value;
        } else if (field === 'note' && typeof value === 'string') {
            nextAttributes.note = value;
        } else if (field === 'imageUrl' && typeof value === 'string') {
            nextAttributes.imageUrl = value;
            nextAttributes.imageUrls = value ? [value] : [];
        } else if (field === 'imageUrls' && isStringArray(value)) {
            nextAttributes.imageUrls = value;
            nextAttributes.imageUrl = value[0] ?? '';
        } else if (field === 'template') {
            nextAttributes.template = value as NodeAttributes['template'];
        } else if (field === 'conditionLower' || field === 'conditionUpper') {
            const current = parseConditionBounds(currentAttributes.condition);
            const lower = field === 'conditionLower' ? String(value ?? '') : current.lower;
            const upper = field === 'conditionUpper' ? String(value ?? '') : current.upper;
            nextAttributes.condition = formatConditionRange(lower, upper, currentAttributes.condition ?? '');
        } else if (field === 'position' && isPositionValue(value)) {
            return {
                ...node,
                position: {
                    x: value.x,
                    y: value.y,
                },
                data: {
                    ...node.data,
                    label: nextLabel,
                    attributes: nextAttributes,
                },
            } as AppNode;
        }

        return {
            ...node,
            data: {
                ...node.data,
                label: nextLabel,
                attributes: nextAttributes,
            },
        } as AppNode;
    });
}

export function createCustomNode(
    attributes: NodeAttributes,
    stateId: number,
    onLabelChange: (id: string, label: string) => void,
    onNodeClick: (id: string) => void,
    position?: { x: number; y: number },
): AppNode {
    const imageUrls = normaliseImageUrls(attributes);
    const nodeData: CustomNodeData = {
        label: attributes.stateName,
        onLabelChange,
        onNodeClick,
        attributes: {
            stateName: attributes.stateName,
            stateNumber: attributes.stateNumber,
            vastClass: attributes.vastClass,
            condition: attributes.condition,
            imageUrl: imageUrls[0] ?? '',
            imageUrls,
            note: attributes.note,
            template: attributes.template,
        },
    };

    return {
        // Use the BMRG frontend_state_id as the React Flow node id so it stays
        // in sync with transitionsToEdges() and parseStateId() (both expect
        // the `state-N` prefix). Using a timestamp here would orphan the node
        // from the BMRG state and silently break edge creation/editing.
        id: `state-${stateId}`,
        type: 'custom',
        data: nodeData,
        position: position ?? {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        },
    } as AppNode;
}

export function updateBmrgStateName(
    data: ModelData,
    stateId: number,
    attributes: NodeAttributes,
): ModelData {
    const imageUrls = normaliseImageUrls(attributes);
    const bounds = parseConditionBounds(attributes.condition);
    const lower = Number.parseFloat(bounds.lower);
    const upper = Number.parseFloat(bounds.upper);

    const states = data.states.map((state) => {
        if (getGraphStateId(state) !== stateId) {
            return state;
        }

        const nextAttributes = {
            ...(state.attributes ?? {}),
            imageUrl: imageUrls[0] ?? '',
            imageUrls,
            ...(attributes.note !== undefined ? { note: attributes.note } : {}),
            ...(attributes.template !== undefined ? { template: attributes.template } : {}),
        };

        return {
            ...state,
            state_name: attributes.stateName,
            vast_state: {
                ...state.vast_state,
                vast_class: attributes.vastClass,
            },
            condition_lower: Number.isFinite(lower) ? lower : state.condition_lower,
            condition_upper: Number.isFinite(upper) ? upper : state.condition_upper,
            attributes: nextAttributes,
        };
    });

    return {
        ...data,
        states,
    };
}

export function applyBmrgNodePatch(
    data: ModelData,
    stateId: number,
    field: string,
    value: unknown,
): ModelData {
    const states = data.states.map((state) => {
        if (getGraphStateId(state) !== stateId) {
            return state;
        }

        if (field === 'stateName' && typeof value === 'string') {
            return { ...state, state_name: value };
        }

        if (field === 'vastClass' && typeof value === 'string') {
            return {
                ...state,
                vast_state: {
                    ...state.vast_state,
                    vast_class: value,
                },
            };
        }

        if (field === 'conditionLower') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? { ...state, condition_lower: parsed } : state;
        }

        if (field === 'conditionUpper') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? { ...state, condition_upper: parsed } : state;
        }

        if (field === 'note' || field === 'imageUrl' || field === 'imageUrls' || field === 'template') {
            return {
                ...state,
                attributes: {
                    ...(state.attributes ?? {}),
                    [field]: value,
                },
            };
        }

        if (field === 'position' && isPositionValue(value)) {
            return {
                ...state,
                attributes: {
                    ...(state.attributes ?? {}),
                    position: {
                        x: value.x,
                        y: value.y,
                    },
                },
            };
        }

        return state;
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
    const imageUrls = normaliseImageUrls(attributes);
    const bounds = parseConditionBounds(attributes.condition);
    const lower = Number.parseFloat(bounds.lower);
    const upper = Number.parseFloat(bounds.upper);
    const stateAttributes = {
        ...(imageUrls.length > 0 ? { imageUrl: imageUrls[0], imageUrls } : {}),
        ...(attributes.note ? { note: attributes.note } : {}),
        ...(attributes.template ? { template: attributes.template } : {}),
    };

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
        condition_upper: Number.isFinite(upper) ? upper : 1.0,
        condition_lower: Number.isFinite(lower) ? lower : 0.0,
        eks_condition_estimate: -9999,
        elicitation_type: 'pilot region',
        attributes: Object.keys(stateAttributes).length > 0 ? stateAttributes : null,
    };
}
export function addStateToBmrg(data: ModelData, state: StateData): ModelData {
    return {
        ...data,
        states: [...data.states, state],
    };
}

export function buildStateNameMap(data: ModelData | null): Record<number, string> {
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

function normaliseImageUrls(attributes: NodeAttributes | undefined): string[] {
    if (!attributes) {
        return [];
    }
    if (Array.isArray(attributes.imageUrls)) {
        return attributes.imageUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '');
    }
    return attributes.imageUrl ? [attributes.imageUrl] : [];
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
