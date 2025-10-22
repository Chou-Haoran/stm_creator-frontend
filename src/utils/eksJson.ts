import { BMRGData, StateData, TransitionData, getGraphStateId } from './stateTransition';

export interface EKSState {
    id: number;
    name: string;
    condition: {
        lower: number;
        upper: number;
    };
    estimate: number;
}

export interface EKSTransition {
    id: number;
    start_state_id: number;
    end_state_id: number;
    time_25: number;
    time_100: number;
    likelihood_25: number;
    likelihood_100: number;
    delta: number;
}

export interface EKSModel {
    name?: string;
    description?: string;
    states: EKSState[];
    transitions: EKSTransition[];
}

export function toEKSModel(data: BMRGData): EKSModel {
    const states: EKSState[] = data.states.map((state) => ({
        id: getGraphStateId(state),
        name: state.state_name,
        condition: {
            lower: state.condition_lower,
            upper: state.condition_upper,
        },
        estimate: state.eks_condition_estimate,
    }));

    const transitions: EKSTransition[] = data.transitions.map((transition) => ({
        id: transition.transition_id,
        start_state_id: transition.start_state_id,
        end_state_id: transition.end_state_id,
        time_25: transition.time_25,
        time_100: transition.time_100,
        likelihood_25: transition.likelihood_25,
        likelihood_100: transition.likelihood_100,
        delta: transition.transition_delta,
    }));

    return {
        name: data.stm_name,
        states,
        transitions,
    };
}

function createBaseState(id: number, name: string, lower: number, upper: number, estimate: number): StateData {
    return {
        state_id: id,
        state_name: name,
        vast_state: {
            vast_class: '',
            vast_name: '',
            vast_eks_state: -9999,
            eks_overstorey_class: '',
            eks_understorey_class: '',
            eks_substate: '',
            link: '',
        },
        condition_upper: upper,
        condition_lower: lower,
        eks_condition_estimate: estimate,
        elicitation_type: 'imported',
        attributes: null,
    };
}

export function fromEKSModel(model: EKSModel): BMRGData {
    if (!Array.isArray(model.states) || !Array.isArray(model.transitions)) {
        throw new Error('EKS JSON must contain "states" and "transitions" arrays.');
    }

    const states = model.states.map((state) => {
        if (
            typeof state.id !== 'number' ||
            typeof state.name !== 'string' ||
            !state.condition ||
            typeof state.condition.lower !== 'number' ||
            typeof state.condition.upper !== 'number'
        ) {
            throw new Error('Each state requires numeric "id", string "name", and numeric condition bounds.');
        }

        return createBaseState(
            state.id,
            state.name,
            state.condition.lower,
            state.condition.upper,
            typeof state.estimate === 'number' ? state.estimate : -9999,
        );
    });

    const stateNameMap = states.reduce<Record<number, string>>((acc, state) => {
        const key = getGraphStateId(state);
        acc[key] = state.state_name;
        return acc;
    }, {});

    const transitions: TransitionData[] = model.transitions.map((transition) => {
        if (
            typeof transition.id !== 'number' ||
            typeof transition.start_state_id !== 'number' ||
            typeof transition.end_state_id !== 'number'
        ) {
            throw new Error('Each transition requires numeric id, start_state_id, and end_state_id.');
        }

        const startName = stateNameMap[transition.start_state_id] ?? `State ${transition.start_state_id}`;
        const endName = stateNameMap[transition.end_state_id] ?? `State ${transition.end_state_id}`;

        return {
            transition_id: transition.id,
            stm_name: model.name ?? fallbackNamePlaceholder(),
            start_state: startName,
            start_state_id: transition.start_state_id,
            end_state: endName,
            end_state_id: transition.end_state_id,
            time_25: typeof transition.time_25 === 'number' ? transition.time_25 : 0,
            time_100: typeof transition.time_100 === 'number' ? transition.time_100 : 0,
            likelihood_25: typeof transition.likelihood_25 === 'number' ? transition.likelihood_25 : 0,
            likelihood_100: typeof transition.likelihood_100 === 'number' ? transition.likelihood_100 : 0,
            notes: '',
            causal_chain: [],
            transition_delta: typeof transition.delta === 'number' ? transition.delta : 0,
        };
    });

    return {
        stm_name: model.name ?? fallbackNamePlaceholder(),
        version: '',
        release_date: '',
        authorised_by: '',
        contributing_experts: [],
        //region: '',
        //region_id: 0,
        climate: '',
        ecosystem_type: '',
        //aus_eco_archetype_code: 0,
        aus_eco_archetype_name: '',
        aus_eco_umbrella_code: 0,
        peer_reviewed: '',
        no_peer_reviewers: 0,
        states,
        transitions,
        method_alignment: '',
    };
}

function fallbackNamePlaceholder(): string {
    return 'Imported STM';
}
