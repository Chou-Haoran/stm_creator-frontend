
import { Edge, EdgeChange, EdgeMouseHandler, applyEdgeChanges } from '@xyflow/react';

import { AppNode } from '../../nodes/types';
import { TransitionData, BMRGData, transitionsToEdges } from '../../utils/stateTransition';
import { updateTransition } from '../../utils/dataLoader';
import { DeltaFilterOption } from '../types';
import { filterEdgesByDelta, nextId, parseStateId } from './graph-utils';

interface TransitionCreatorDeps {
    bmrgData: () => BMRGData | null;
    setBmrgData: (updater: (data: BMRGData) => BMRGData) => void;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    nodes: () => AppNode[];
    includeSelfTransitions: () => boolean;
    getDeltaFilter: () => DeltaFilterOption;
}

export function createTransitionCreator({
    bmrgData,
    setBmrgData,
    setEdges,
    nodes,
    includeSelfTransitions,
    getDeltaFilter,
}: TransitionCreatorDeps) {
    return (sourceNodeId: string, targetNodeId: string) => {
        const data = bmrgData();
        if (!data) {
            return;
        }

        const sourceStateId = parseStateId(sourceNodeId);
        const targetStateId = parseStateId(targetNodeId);
        if (sourceStateId === null || targetStateId === null) {
            return;
        }

        const sourceState = data.states.find((state) => state.state_id === sourceStateId);
        const targetState = data.states.find((state) => state.state_id === targetStateId);
        if (!sourceState || !targetState) {
            return;
        }

        const newTransitionId = nextId(data.transitions.map((transition) => transition.transition_id));

        const newTransition: TransitionData = {
            transition_id: newTransitionId,
            stm_name: data.stm_name,
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

        const updatedTransitions = [...data.transitions, newTransition];
        setBmrgData(() => ({
            ...data,
            transitions: updatedTransitions,
        }));

        const projectedEdges = transitionsToEdges(
            updatedTransitions,
            nodes(),
            includeSelfTransitions(),
        );
        const filteredEdges = filterEdgesByDelta(projectedEdges, getDeltaFilter());
        setEdges(filteredEdges);

        return newTransition;
    };
}

interface EdgeHandlerDeps {
    bmrgData: () => BMRGData | null;
    setBmrgData: React.Dispatch<React.SetStateAction<BMRGData | null>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    createTransition: (sourceNodeId: string, targetNodeId: string) => TransitionData | void;
    setCurrentTransition: React.Dispatch<React.SetStateAction<TransitionData | null>>;
    openTransitionModal: () => void;
}

export function createEdgeHandlers({
    bmrgData,
    setBmrgData,
    setEdges,
    createTransition,
    setCurrentTransition,
    openTransitionModal,
}: EdgeHandlerDeps) {
    const handleEdgesChange = (changes: EdgeChange[]) => {
        setEdges((currentEdges) => {
            const updatedEdges = applyEdgeChanges(changes, currentEdges);
            const data = bmrgData();

            if (!data) {
                return updatedEdges;
            }

            for (const change of changes) {
                if (change.type !== 'select' || change.selected !== false || !('id' in change)) {
                    continue;
                }

                const edgeId = change.id;
                const existingEdge = currentEdges.find((edge) => edge.id === edgeId);
                const newEdge = updatedEdges.find((edge) => edge.id === edgeId);

                if (!existingEdge || !newEdge) {
                    continue;
                }

                const transitionId = newEdge.data?.transitionId as number | undefined;
                if (!transitionId) {
                    continue;
                }

                const sourceStateId = parseStateId(newEdge.source);
                const targetStateId = parseStateId(newEdge.target);
                if (sourceStateId === null || targetStateId === null) {
                    continue;
                }

                const transition = data.transitions.find(
                    (item) => item.transition_id === transitionId,
                );
                if (!transition) {
                    continue;
                }

                const updatedTransition: TransitionData = {
                    ...transition,
                    start_state_id: sourceStateId,
                    end_state_id: targetStateId,
                };

                const nextData = updateTransition(data, updatedTransition);
                setBmrgData(nextData);
            }

            return updatedEdges;
        });
    };

    const onEdgeClick: EdgeMouseHandler = (event) => {
        event.stopPropagation();
    };

    const onEdgeDoubleClick: EdgeMouseHandler = (event, edge) => {
        event.stopPropagation();

        const data = bmrgData();
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
            const nextTransition = createTransition(edge.source, edge.target);
            if (nextTransition) {
                setCurrentTransition(nextTransition);
                openTransitionModal();
            }
        }
    };

    const handleSaveTransition = (updatedTransition: TransitionData) => {
        const data = bmrgData();
        if (!data) {
            return;
        }

        const nextData = updateTransition(data, updatedTransition);
        setBmrgData(nextData);

        setEdges((prevEdges) =>
            prevEdges.map((edge) => {
                if (edge.id === `transition-${updatedTransition.transition_id}`) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            transitionDelta: updatedTransition.transition_delta,
                            time25: updatedTransition.time_25,
                            time100: updatedTransition.time_100,
                            notes: updatedTransition.notes,
                        },
                    };
                }
                return edge;
            }),
        );
    };

    return {
        handleEdgesChange,
        onEdgeClick,
        onEdgeDoubleClick,
        handleSaveTransition,
    };
}
