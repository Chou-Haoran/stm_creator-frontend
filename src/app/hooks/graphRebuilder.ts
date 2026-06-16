
import { Edge } from '@xyflow/react';

import { AppNode } from '../../nodes/types';
import { TransitionData, ModelData, transitionsToEdges } from '../../utils/stateTransition';
import { DeltaFilterOption } from '../types';
import { filterEdgesByDelta } from './graph-utils';

interface Dependencies {
    getData: () => ModelData | null;
    getNodes: () => AppNode[];
    getIncludeSelfTransitions: () => boolean;
    getDeltaFilter: () => DeltaFilterOption;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

interface Options {
    transitions?: TransitionData[];
    includeSelfTransitions?: boolean;
    filter?: DeltaFilterOption;
    dataOverride?: ModelData | null;
    // Lets callers pass freshly-built nodes when React state hasn't committed
    // them yet (e.g. during initial load, right after setNodes). Without this,
    // getNodes() would still return the previous (empty) nodes and edge handles
    // would be computed against nothing.
    nodes?: AppNode[];
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
                nodes,
            }: Options = {}) => {
        const data = dataOverride ?? getData();
        if (!data) {
            return;
        }

        const projectedEdges = transitionsToEdges(
            transitions ?? data.transitions,
            nodes ?? getNodes(),
            includeSelfTransitions ?? getIncludeSelfTransitions(),
        );
        const filteredEdges = filterEdgesByDelta(
            projectedEdges,
            filter ?? getDeltaFilter(),
        );
        setEdges(filteredEdges);
    };
}
