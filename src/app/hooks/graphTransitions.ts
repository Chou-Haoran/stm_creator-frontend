
import { Dispatch, SetStateAction } from 'react';
import { Edge, EdgeChange, EdgeMouseHandler, applyEdgeChanges } from '@xyflow/react';

import { TransitionData, BMRGData } from '../../utils/stateTransition';
import { updateTransition } from '../../utils/dataLoader';
import { parseStateId, nextId } from './graph-utils';

interface BaseDeps {
    getData: () => BMRGData | null;
    setData: Dispatch<SetStateAction<BMRGData | null>>;
}

interface TransitionCreatorDeps extends BaseDeps {
    rebuildEdges: (options?: { transitions?: TransitionData[]; dataOverride?: BMRGData | null }) => void;
    setCurrentTransition: Dispatch<SetStateAction<TransitionData | null>>;
    openTransitionModal: () => void;
}

export function createTransitionCreator({
    getData,
    setData,
    rebuildEdges,
    setCurrentTransition,
    openTransitionModal,
}: TransitionCreatorDeps) {
    return (sourceNodeId: string, targetNodeId: string) => {
        const currentData = getData();
        if (!currentData) {
            return;
        }

        setData((prev) => {
            const base = prev ?? currentData;
            const prevData = base;

            const sourceStateId = parseStateId(sourceNodeId);
            const targetStateId = parseStateId(targetNodeId);
            if (sourceStateId === null || targetStateId === null) {
                return prev;
            }

            const sourceState = prevData.states.find((state) => state.state_id === sourceStateId);
            const targetState = prevData.states.find((state) => state.state_id === targetStateId);
            if (!sourceState || !targetState) {
                return prev;
            }

            const transition: TransitionData = {
                transition_id: nextId(prevData.transitions.map((item) => item.transition_id)),
                stm_name: prevData.stm_name,
                start_state: sourceState.state_name,
                start_state_id: sourceStateId,
                end_state: targetState.state_name,
                end_state_id: targetStateId,
                time_25: 1,
                time_100: 0,
                likelihood_25: 1,
                likelihood_100: 0,
                notes: '',
                causal_chain: [],
                transition_delta: 0,
            };

            const nextData: BMRGData = {
                ...prevData,
                transitions: [...prevData.transitions, transition],
            };

            rebuildEdges({ transitions: nextData.transitions, dataOverride: nextData });
            setCurrentTransition(transition);
            openTransitionModal();

            return nextData;
        });
    };
}

interface EdgeHandlersDeps extends BaseDeps {
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    createTransition: (sourceNodeId: string, targetNodeId: string) => void;
    openTransitionModal: () => void;
    setCurrentTransition: Dispatch<SetStateAction<TransitionData | null>>;
}

export function createEdgeHandlers({
    getData,
    setData,
    setEdges,
    createTransition,
    openTransitionModal,
    setCurrentTransition,
}: EdgeHandlersDeps) {
    const handleEdgesChange = (changes: EdgeChange[]) => {
        setEdges((currentEdges) => {
            const updatedEdges = applyEdgeChanges(changes, currentEdges);
            const data = getData();
            if (!data) {
                return updatedEdges;
            }

            for (const change of changes) {
                if (change.type !== 'select' || change.selected !== false || !('id' in change)) {
                    continue;
                }

                const edgeId = change.id;
                const nextEdge = updatedEdges.find((edge) => edge.id === edgeId);
                const previousEdge = currentEdges.find((edge) => edge.id === edgeId);

                if (!nextEdge || !previousEdge) {
                    continue;
                }

                if (
                    nextEdge.source === previousEdge.source &&
                    nextEdge.target === previousEdge.target &&
                    nextEdge.sourceHandle === previousEdge.sourceHandle &&
                    nextEdge.targetHandle === previousEdge.targetHandle
                ) {
                    continue;
                }

                const transitionId = nextEdge.data?.transitionId as number | undefined;
                if (!transitionId) {
                    continue;
                }

                const sourceStateId = parseStateId(nextEdge.source);
                const targetStateId = parseStateId(nextEdge.target);
                if (sourceStateId === null || targetStateId === null) {
                    continue;
                }

                const transition = data.transitions.find(
                    (item) => item.transition_id === transitionId,
                );
                if (!transition) {
                    continue;
                }

                setData((prev) => (prev ? updateTransition(prev, {
                    ...transition,
                    start_state_id: sourceStateId,
                    end_state_id: targetStateId,
                }) : prev));
            }

            return updatedEdges;
        });
    };

    const onEdgeClick: EdgeMouseHandler = (event) => {
        event.stopPropagation();
    };

    const onEdgeDoubleClick: EdgeMouseHandler = (event, edge) => {
        event.stopPropagation();

        const data = getData();
        if (!data) {
            return;
        }

        const transitionId = parseInt(edge.id.replace('transition-', ''), 10);
        const transition = data.transitions.find((item) => item.transition_id === transitionId);

        if (transition) {
            setCurrentTransition(transition);
            openTransitionModal();
            return;
        }

        if (edge.source && edge.target) {
            createTransition(edge.source, edge.target);
        }
    };

    const handleSaveTransition = (transition: TransitionData) => {
        setData((prev) => (prev ? updateTransition(prev, transition) : prev));
        setEdges((prev) =>
            prev.map((edge) =>
                edge.id === `transition-${transition.transition_id}`
                    ? {
                          ...edge,
                          data: {
                              ...edge.data,
                              transitionDelta: transition.transition_delta,
                              time25: transition.time_25,
                              time100: transition.time_100,
                              notes: transition.notes,
                          },
                      }
                    : edge,
            ),
        );
    };

    return { handleEdgesChange, onEdgeClick, onEdgeDoubleClick, handleSaveTransition };
}
