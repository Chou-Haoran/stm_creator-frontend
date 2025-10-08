import { Edge } from '@xyflow/react';

import { AppNode } from '../../nodes/types';

import { TransitionData } from './types';

function determineOptimalHandles(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
): { sourceHandle: string; targetHandle: string } {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const absAngle = ((angle % 360) + 360) % 360;

    if (absAngle >= 45 && absAngle < 135) {
        return { sourceHandle: 'bottom-center-source', targetHandle: 'top-center-target' };
    }
    if (absAngle >= 135 && absAngle < 225) {
        return { sourceHandle: 'left-center-source', targetHandle: 'right-center-target' };
    }
    if (absAngle >= 225 && absAngle < 315) {
        return { sourceHandle: 'top-center-source', targetHandle: 'bottom-center-target' };
    }
    return { sourceHandle: 'right-center-source', targetHandle: 'left-center-target' };
}

function getHandlesForBidirectionalEdges(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    isFirstDirection: boolean
): { sourceHandle: string; targetHandle: string } {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const absAngle = ((angle % 360) + 360) % 360;

    if (isFirstDirection) {
        if (absAngle >= 45 && absAngle < 135) {
            return { sourceHandle: 'bottom-right-source', targetHandle: 'top-left-target' };
        }
        if (absAngle >= 135 && absAngle < 225) {
            return { sourceHandle: 'left-bottom-source', targetHandle: 'right-top-target' };
        }
        if (absAngle >= 225 && absAngle < 315) {
            return { sourceHandle: 'top-left-source', targetHandle: 'bottom-right-target' };
        }
        return { sourceHandle: 'right-top-source', targetHandle: 'left-bottom-target' };
    }

    if (absAngle >= 45 && absAngle < 135) {
        return { sourceHandle: 'bottom-left-source', targetHandle: 'top-right-target' };
    }
    if (absAngle >= 135 && absAngle < 225) {
        return { sourceHandle: 'left-top-source', targetHandle: 'right-bottom-target' };
    }
    if (absAngle >= 225 && absAngle < 315) {
        return { sourceHandle: 'top-right-source', targetHandle: 'bottom-left-target' };
    }
    return { sourceHandle: 'right-bottom-source', targetHandle: 'left-top-target' };
}

export function transitionsToEdges(
    transitions: TransitionData[],
    nodes: AppNode[] = [],
    includeSelfTransitions = false
): Edge[] {
    const filteredTransitions = transitions
        .filter((transition) => transition.time_25 === 1)
        .filter(
            (transition) =>
                includeSelfTransitions || transition.start_state_id !== transition.end_state_id
        );

    const connectionPairs = new Map<string, number>();
    const processedConnections = new Map<string, boolean>();

    filteredTransitions.forEach((transition) => {
        const stateA = Math.min(transition.start_state_id, transition.end_state_id);
        const stateB = Math.max(transition.start_state_id, transition.end_state_id);
        const key = `${stateA}-${stateB}`;

        connectionPairs.set(key, (connectionPairs.get(key) ?? 0) + 1);
    });

    return filteredTransitions.map((transition) => {
        if (transition.start_state_id === transition.end_state_id) {
            return {
                id: `transition-${transition.transition_id}`,
                source: `state-${transition.start_state_id}`,
                target: `state-${transition.end_state_id}`,
                sourceHandle: 'right-center-source',
                targetHandle: 'top-center-target',
                type: 'custom',
                data: {
                    transitionId: transition.transition_id,
                    startStateId: transition.start_state_id,
                    endStateId: transition.end_state_id,
                    time25: transition.time_25,
                    time100: transition.time_100,
                    transitionDelta: transition.transition_delta,
                    notes: transition.notes,
                    curvature: 0.7,
                    isBidirectional: false,
                    isLoop: true,
                },
            } as Edge;
        }

        const sourceNode = nodes.find(
            (node) => node.id === `state-${transition.start_state_id}`
        );
        const targetNode = nodes.find(
            (node) => node.id === `state-${transition.end_state_id}`
        );

        let sourceHandle = 'right-center-source';
        let targetHandle = 'left-center-target';
        let curvature = 0.25;

        const stateA = Math.min(transition.start_state_id, transition.end_state_id);
        const stateB = Math.max(transition.start_state_id, transition.end_state_id);
        const pairKey = `${stateA}-${stateB}`;
        const isBidirectional = connectionPairs.get(pairKey) === 2;

        const directionKey = `${transition.start_state_id}-${transition.end_state_id}`;
        const isFirstDirection = !processedConnections.has(directionKey);

        if (isFirstDirection) {
            processedConnections.set(directionKey, true);
        }

        if (sourceNode && targetNode) {
            if (isBidirectional) {
                const handles = getHandlesForBidirectionalEdges(
                    sourceNode.position.x,
                    sourceNode.position.y,
                    targetNode.position.x,
                    targetNode.position.y,
                    isFirstDirection
                );
                sourceHandle = handles.sourceHandle;
                targetHandle = handles.targetHandle;
                curvature = isFirstDirection ? 0.2 : 0.4;
            } else {
                const handles = determineOptimalHandles(
                    sourceNode.position.x,
                    sourceNode.position.y,
                    targetNode.position.x,
                    targetNode.position.y
                );
                sourceHandle = handles.sourceHandle;
                targetHandle = handles.targetHandle;
            }
        }

        return {
            id: `transition-${transition.transition_id}`,
            source: `state-${transition.start_state_id}`,
            target: `state-${transition.end_state_id}`,
            sourceHandle,
            targetHandle,
            type: 'custom',
            data: {
                transitionId: transition.transition_id,
                startStateId: transition.start_state_id,
                endStateId: transition.end_state_id,
                time25: transition.time_25,
                time100: transition.time_100,
                transitionDelta: transition.transition_delta,
                notes: transition.notes,
                curvature,
                isBidirectional,
            },
        } as Edge;
    });
}
