
import { Edge } from '@xyflow/react';

import { AppNode } from '../../nodes/types';
import { DeltaFilterOption } from '../types';
import { TransitionData } from '../../utils/stateTransition';

export function parseStateId(nodeId: string): number | null {
    if (!nodeId.startsWith('state-')) {
        return null;
    }

    const value = parseInt(nodeId.replace('state-', ''), 10);
    return Number.isNaN(value) ? null : value;
}

export function nextId(values: number[]): number {
    if (values.length === 0) {
        return 1;
    }
    return Math.max(...values) + 1;
}

export function filterEdgesByDelta(
    edges: Edge[],
    filterOption: DeltaFilterOption,
): Edge[] {
    if (filterOption === 'all') {
        return edges;
    }

    return edges.filter((edge) => {
        const delta = (edge.data?.transitionDelta as number) ?? 0;
        if (filterOption === 'positive') {
            return delta > 0;
        }
        if (filterOption === 'neutral') {
            return delta === 0;
        }
        if (filterOption === 'negative') {
            return delta < 0;
        }
        return true;
    });
}

export function buildEdgesSnapshot(
    transitions: TransitionData[],
    nodes: AppNode[],
    includeSelfTransitions: boolean,
    projectEdges: (transitions: TransitionData[], nodes: AppNode[], includeSelfTransitions: boolean) => Edge[],
): Edge[] {
    return projectEdges(transitions, nodes, includeSelfTransitions);
}
