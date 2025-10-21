import { StateData } from './types';

export function hasPersistedStateId(state: StateData): state is StateData & { state_id: number } {
  return typeof state.state_id === 'number';
}

export function hasFrontendStateId(state: StateData): state is StateData & { frontend_state_id: number } {
  return typeof state.frontend_state_id === 'number';
}

export function getGraphStateId(state: StateData): number {
  if (hasPersistedStateId(state)) {
    return state.state_id;
  }
  if (hasFrontendStateId(state)) {
    return state.frontend_state_id;
  }
  throw new Error('State must include either state_id or frontend_state_id.');
}

export function findStateByGraphId(states: StateData[], id: number): StateData | undefined {
  return states.find((state) => {
    if (hasPersistedStateId(state) && state.state_id === id) return true;
    if (hasFrontendStateId(state) && state.frontend_state_id === id) return true;
    return false;
  });
}

export function collectAllStateIds(states: StateData[]): number[] {
  return states.flatMap((state) => {
    const ids: number[] = [];
    if (hasPersistedStateId(state)) ids.push(state.state_id);
    if (hasFrontendStateId(state)) ids.push(state.frontend_state_id);
    return ids;
  });
}
