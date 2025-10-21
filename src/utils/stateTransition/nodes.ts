import { AppNode, CustomNodeData } from '../../nodes/types';
import { NodeAttributes } from '../../nodes/nodeModal';

import { optimizeNodeLayout } from './layout';
import { StateData, TransitionData } from './types';
import { getGraphStateId } from './helpers';

function getConditionString(state: StateData): string {
    if (state.condition_upper === -9999 || state.condition_lower === -9999) {
        return 'No condition data';
    }
    return `Condition range: ${state.condition_lower.toFixed(2)} - ${state.condition_upper.toFixed(2)}`;
}

function stateToNodeAttributes(state: StateData): NodeAttributes {
    const id = getGraphStateId(state);
    return {
        stateName: state.state_name,
        stateNumber: id.toString(),
        vastClass: state.vast_state.vast_class,
        condition: getConditionString(state),
        imageUrl: state.attributes?.imageUrl ?? '',
        note: state.attributes?.note ?? '',
    };
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
        const position = positions.get(graphId) ?? { x: 0, y: 0 };

        return {
            id: `state-${graphId}`,
            type: 'custom',
            position,
            data: {
                label: state.state_name,
                onLabelChange,
                onNodeClick,
                attributes: stateToNodeAttributes(state),
            } as CustomNodeData,
        } as AppNode;
    });
}
