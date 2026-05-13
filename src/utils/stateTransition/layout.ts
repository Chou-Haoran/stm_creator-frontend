import { StateData, TransitionData } from './types';
import { getGraphStateId } from './helpers';

const CLASS_ORDER: Record<string, number> = {
    'Class I': 1,
    'Class II': 2,
    'Class III': 3,
    'Class IV': 4,
    'Class V': 5,
    'Class VI': 6,
};

function getVastClassNumber(vastClass: string): number {
    return CLASS_ORDER[vastClass] ?? 99;
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

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return `Class ${['I', 'II', 'III', 'IV', 'V', 'VI'][candidate - 1] ?? candidate}`;
    }
    if (typeof candidate !== 'string') {
        return 'Unknown';
    }
    const trimmed = candidate.trim();
    const numberMatch = /(?:class\s*)?([1-6])$/i.exec(trimmed);
    if (numberMatch) {
        return `Class ${['I', 'II', 'III', 'IV', 'V', 'VI'][Number(numberMatch[1]) - 1]}`;
    }
    return trimmed || 'Unknown';
}

function getConditionMidpoint(state: StateData): number {
    const lower = getNumericField(state, ['condition_lower', 'conditionLower', 'condition_min', 'conditionMin', 'lower']);
    const upper = getNumericField(state, ['condition_upper', 'conditionUpper', 'condition_max', 'conditionMax', 'upper']);
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
        return -1;
    }
    if (lower === -9999 || upper === -9999) {
        return -1;
    }
    return (lower + upper) / 2;
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

function getStatePriority(state: StateData): number {
    const name = state.state_name.toLowerCase();
    if (name === 'reference' || name.includes('reference')) {
        return -100;
    }
    if (name.includes('removed')) {
        return 100;
    }
    if (name.includes('cropping')) {
        return 80;
    }
    return 0;
}

export function optimizeNodeLayout(
    states: StateData[],
    transitions: TransitionData[],
): Map<number, { x: number; y: number }> {
    const positions = new Map<number, { x: number; y: number }>();
    const statesByClass = new Map<string, StateData[]>();
    const connectionWeights = new Map<number, { inbound: number; outbound: number; total: number }>();

    states.forEach((state) => {
        const id = getGraphStateId(state);
        connectionWeights.set(id, { inbound: 0, outbound: 0, total: 0 });
        const vastClass = getVastClass(state);
        statesByClass.set(vastClass, [...(statesByClass.get(vastClass) ?? []), state]);
    });

    transitions
        .filter((transition) => transition.time_25 === 1)
        .forEach((transition) => {
            if (transition.start_state_id === transition.end_state_id) {
                return;
            }

            const startWeights = connectionWeights.get(transition.start_state_id);
            const endWeights = connectionWeights.get(transition.end_state_id);
            if (startWeights) {
                startWeights.outbound += 1;
                startWeights.total += 1;
            }
            if (endWeights) {
                endWeights.inbound += 1;
                endWeights.total += 1;
            }
        });

    const sortedClasses = Array.from(statesByClass.keys()).sort((a, b) => {
        const classDelta = getVastClassNumber(a) - getVastClassNumber(b);
        return classDelta !== 0 ? classDelta : a.localeCompare(b);
    });

    const columnSpacing = 260;
    const rowSpacing = 128;
    const leftMargin = 70;
    const topMargin = 60;

    sortedClasses.forEach((vastClass, classIndex) => {
        const classStates = [...(statesByClass.get(vastClass) ?? [])].sort((a, b) => {
            const priorityDelta = getStatePriority(a) - getStatePriority(b);
            if (priorityDelta !== 0) {
                return priorityDelta;
            }

            const midpointDelta = getConditionMidpoint(b) - getConditionMidpoint(a);
            if (Math.abs(midpointDelta) > 0.001) {
                return midpointDelta;
            }

            const degreeA = connectionWeights.get(getGraphStateId(a))?.total ?? 0;
            const degreeB = connectionWeights.get(getGraphStateId(b))?.total ?? 0;
            if (degreeA !== degreeB) {
                return degreeB - degreeA;
            }

            return a.state_name.localeCompare(b.state_name);
        });

        const x = leftMargin + classIndex * columnSpacing;
        const stagger = classIndex % 2 === 0 ? 0 : 36;

        classStates.forEach((state, rowIndex) => {
            positions.set(getGraphStateId(state), {
                x,
                y: topMargin + stagger + rowIndex * rowSpacing,
            });
        });
    });

    return positions;
}
