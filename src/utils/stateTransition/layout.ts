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
    return CLASS_ORDER[vastClass] ?? 0;
}

export function optimizeNodeLayout(
    states: StateData[],
    transitions: TransitionData[]
): Map<number, { x: number; y: number }> {
    const positions = new Map<number, { x: number; y: number }>();
    const statesByClass = new Map<string, StateData[]>();

    states.forEach((state) => {
        const vastClass = state.vast_state.vast_class;
        const collection = statesByClass.get(vastClass);
        if (collection) {
            collection.push(state);
        } else {
            statesByClass.set(vastClass, [state]);
        }
    });

    const sortedClasses = Array.from(statesByClass.keys()).sort(
        (a, b) => getVastClassNumber(a) - getVastClassNumber(b)
    );

    const connectionWeights = new Map<
        number,
        { inbound: number; outbound: number; total: number }
    >();

    states.forEach((state) => {
        const id = getGraphStateId(state);
        connectionWeights.set(id, { inbound: 0, outbound: 0, total: 0 });
    });

    transitions
        .filter((transition) => transition.time_25 === 1)
        .forEach((transition) => {
            const startId = transition.start_state_id;
            const endId = transition.end_state_id;

            if (startId === endId) {
                return;
            }

            const startWeights =
                connectionWeights.get(startId) ?? { inbound: 0, outbound: 0, total: 0 };
            const endWeights =
                connectionWeights.get(endId) ?? { inbound: 0, outbound: 0, total: 0 };

            startWeights.outbound += 1;
            startWeights.total += 1;

            endWeights.inbound += 1;
            endWeights.total += 1;

            connectionWeights.set(startId, startWeights);
            connectionWeights.set(endId, endWeights);
        });

    const viewportWidth = 1400;
    const leftMargin = 100;
    const rightMargin = 100;
    const usableWidth = viewportWidth - leftMargin - rightMargin;
    const horizontalSpacing = sortedClasses.length
        ? usableWidth / sortedClasses.length
        : usableWidth;

    const specialStates = new Set<number>();

    sortedClasses.forEach((vastClass, classIndex) => {
        const classStates = statesByClass.get(vastClass) ?? [];
        if (classStates.length === 0) {
            return;
        }

        classStates.sort((a, b) => {
            const weightA = connectionWeights.get(getGraphStateId(a))?.total ?? 0;
            const weightB = connectionWeights.get(getGraphStateId(b))?.total ?? 0;
            return weightB - weightA;
        });

        const x = leftMargin + classIndex * horizontalSpacing;

        const referenceStateIndex = classStates.findIndex(
            (state) => state.state_name === 'Reference'
        );
        if (referenceStateIndex >= 0) {
            const referenceState = classStates[referenceStateIndex];
            const refId = getGraphStateId(referenceState);
            positions.set(refId, { x, y: 50 });
            specialStates.add(refId);
        }

        const removedStateIndex = classStates.findIndex(
            (state) => state.state_name === 'Removed'
        );
        if (removedStateIndex >= 0) {
            const removedState = classStates[removedStateIndex];
            const removedId = getGraphStateId(removedState);
            positions.set(removedId, { x, y: 600 });
            specialStates.add(removedId);
        }

        const croppingStateIndex = classStates.findIndex((state) =>
            state.state_name.includes('Cropping')
        );
        if (croppingStateIndex >= 0) {
            const croppingState = classStates[croppingStateIndex];
            const cropId = getGraphStateId(croppingState);
            positions.set(cropId, { x, y: 500 });
            specialStates.add(cropId);
        }

        const remainingStates = classStates.filter(
            (state) => !specialStates.has(getGraphStateId(state))
        );

        const verticalSpacing = 120;
        const startY = 150;

        remainingStates.forEach((state, index) => {
            const y = startY + index * verticalSpacing;
            const id = getGraphStateId(state);
            positions.set(id, { x, y });
        });
    });

    return positions;
}
