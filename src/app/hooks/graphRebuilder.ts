
import { Edge } from '@xyflow/react';

import { AppNode } from '../../nodes/types';
import { TransitionData, BMRGData, transitionsToEdges } from '../../utils/stateTransition';
import { DeltaFilterOption } from '../types';
import { filterEdgesByDelta } from './graph-utils';

interface Dependencies {
    getData: () => BMRGData | null;
    getNodes: () => AppNode[];
    getIncludeSelfTransitions: () => boolean;
    getDeltaFilter: () => DeltaFilterOption;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

interface Options {
    transitions?: TransitionData[];
    includeSelfTransitions?: boolean;
    filter?: DeltaFilterOption;
    dataOverride?: BMRGData | null;
}

export function createRebuildEdges({
    getData,
    getNodes,
    getIncludeSelfTransitions,
    getDeltaFilter,
    setEdges,
}: Dependencies) {
    return ({
        transitions,
        includeSelfTransitions,
        filter,
        dataOverride,
    }: Options = {}) => {
        const data = dataOverride ?? getData();
        if (!data) {
            return;
        }

        const projectedEdges = transitionsToEdges(
            transitions ?? data.transitions,
            getNodes(),
            includeSelfTransitions ?? getIncludeSelfTransitions(),
        );
        const filteredEdges = filterEdgesByDelta(
            projectedEdges,
            filter ?? getDeltaFilter(),
        );
        setEdges(filteredEdges);
    };
}
