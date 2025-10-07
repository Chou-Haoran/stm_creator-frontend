import { AppNode, CustomNodeData } from '../../nodes/types';
import { NodeAttributes } from '../../nodes/nodeModal';

import { optimizeNodeLayout } from './layout';
import { StateData, TransitionData } from './types';

function getConditionString(state: StateData): string {
    if (state.condition_upper === -9999 || state.condition_lower === -9999) {
        return 'No condition data';
    }
    return `Condition range: ${state.condition_lower.toFixed(2)} - ${state.condition_upper.toFixed(2)}`;
}

function stateToNodeAttributes(state: StateData): NodeAttributes {
    return {
        stateName: state.state_name,
        stateNumber: state.state_id.toString(),
        vastClass: state.vast_state.vast_class,
        condition: getConditionString(state),
        imageUrl: state.attributes?.imageUrl ?? '',
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
        const position = positions.get(state.state_id) ?? { x: 0, y: 0 };

        return {
            id: `state-${state.state_id}`,
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
