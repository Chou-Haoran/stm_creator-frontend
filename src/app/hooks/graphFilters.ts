
import { Dispatch, SetStateAction } from 'react';

import { TransitionData } from '../../utils/stateTransition';
import { DeltaFilterOption } from '../types';

interface Dependencies {
    rebuildEdges: (options?: { includeSelfTransitions?: boolean; filter?: DeltaFilterOption; transitions?: TransitionData[] }) => void;
    setShowSelfTransitions: Dispatch<SetStateAction<boolean>>;
    setDeltaFilter: Dispatch<SetStateAction<DeltaFilterOption>>;
}

export function createFilterActions({
    rebuildEdges,
    setShowSelfTransitions,
    setDeltaFilter,
}: Dependencies) {
    const loadExistingEdges = () => rebuildEdges();

    const toggleSelfTransitions = () => {
        setShowSelfTransitions((prev) => {
            const nextValue = !prev;
            rebuildEdges({ includeSelfTransitions: nextValue });
            return nextValue;
        });
    };

    const toggleDeltaFilter = (option: DeltaFilterOption) => {
        setDeltaFilter(option);
        rebuildEdges({ filter: option });
    };

    return { loadExistingEdges, toggleSelfTransitions, toggleDeltaFilter };
}
