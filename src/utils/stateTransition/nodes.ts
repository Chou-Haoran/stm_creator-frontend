import { AppNode, CustomNodeData } from '../../nodes/types';
import { NodeAttributes } from '../../nodes/nodeModal';

import { optimizeNodeLayout } from './layout';
import { StateData, TransitionData } from './types';
import { getGraphStateId } from './helpers';

function getConditionString(state: StateData): string {
    const lower = getNumericField(state, ['condition_lower', 'conditionLower', 'condition_min', 'conditionMin', 'lower']);
    const upper = getNumericField(state, ['condition_upper', 'conditionUpper', 'condition_max', 'conditionMax', 'upper']);
    if (upper === -9999 || lower === -9999) {
        return 'No condition data';
    }
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
        return '';
    }
    return `Condition range: ${lower.toFixed(2)} - ${upper.toFixed(2)}`;
}

function stateToNodeAttributes(state: StateData): NodeAttributes {
    const id = getGraphStateId(state);
    const imageUrls = normaliseImageUrls(state.attributes);
    return {
        stateName: getStateName(state),
        stateNumber: id.toString(),
        vastClass: getVastClass(state),
        condition: getConditionString(state),
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
        note: state.attributes?.note ?? '',
        template: state.attributes?.template,
    };
}

function getStateName(state: StateData): string {
    const candidate = (state as any).state_name ?? (state as any).stateName ?? (state as any).name ?? (state as any).label;
    return typeof candidate === 'string' && candidate.trim() ? candidate : `State ${getGraphStateId(state)}`;
}

function getVastClass(state: StateData): string {
    const candidate =
        state.vast_state?.vast_class ??
        (state as any).vast_class ??
        (state as any).vastClass ??
        (state as any).condition_class ??
        (state as any).conditionClass ??
        state.attributes?.vastClass ??
        state.attributes?.vast_class ??
        state.attributes?.conditionClass ??
        state.attributes?.condition_class;
    return normaliseVastClass(candidate);
}

function normaliseVastClass(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `Class ${toRoman(value)}`;
    }
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    if (/^Class\s+(I|II|III|IV|V|VI)$/i.test(trimmed)) {
        return `Class ${trimmed.replace(/^Class\s+/i, '').toUpperCase()}`;
    }

    const numberMatch = /(?:class\s*)?([1-6])$/i.exec(trimmed);
    if (numberMatch) {
        return `Class ${toRoman(Number(numberMatch[1]))}`;
    }

    return trimmed;
}

function toRoman(value: number): string {
    return ['I', 'II', 'III', 'IV', 'V', 'VI'][value - 1] ?? String(value);
}

function getNumericField(state: StateData, keys: string[]): number {
    for (const key of keys) {
        const value = (state as any)[key] ?? state.attributes?.[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }
    return Number.NaN;
}

function normaliseImageUrls(attributes: any): string[] {
    if (!attributes) {
        return [];
    }
    if (Array.isArray(attributes.imageUrls)) {
        return attributes.imageUrls.filter((url: unknown): url is string => typeof url === 'string' && url.trim() !== '');
    }
    return typeof attributes.imageUrl === 'string' && attributes.imageUrl.trim() !== '' ? [attributes.imageUrl] : [];
}

function getStoredPosition(state: StateData): { x: number; y: number } | null {
    const position =
        state.attributes?.position ??
        (state as any).position ??
        ((typeof (state as any).x === 'number' || typeof (state as any).y === 'number')
            ? { x: (state as any).x, y: (state as any).y }
            : null);
    if (!position || typeof position !== 'object') {
        return null;
    }

    const { x, y } = position as { x?: unknown; y?: unknown };
    if (typeof x !== 'number' || !Number.isFinite(x) || typeof y !== 'number' || !Number.isFinite(y)) {
        return null;
    }

    if (x === 0 && y === 0) {
        return null;
    }

    return { x, y };
}

export function statesToNodes(
    states: StateData[],
    onLabelChange: (id: string, newLabel: string) => void,
    onNodeClick: (id: string) => void,
    transitions: TransitionData[] = []
): AppNode[] {
    const positions = optimizeNodeLayout(states, transitions);

    return states.map((state) => {
        const graphId = getGraphStateId(state);
        const position = getStoredPosition(state) ?? positions.get(graphId) ?? { x: 0, y: 0 };

        return {
            id: `state-${graphId}`,
            type: 'custom',
            position,
            data: {
                label: getStateName(state),
                onLabelChange,
                onNodeClick,
                attributes: stateToNodeAttributes(state),
            } as CustomNodeData,
        } as AppNode;
    });
}
