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


export function calcTransitionDelta(
    startConditionLower: number | null | undefined,
    startConditionUpper: number | null | undefined,
    endConditionLower: number | null | undefined,
    endConditionUpper: number | null | undefined,
): number | null {
  if (
      startConditionLower == null ||
      startConditionUpper == null ||
      endConditionLower == null ||
      endConditionUpper == null
  ) {
    return null;
  }

  const startMidpoint = (startConditionUpper + startConditionLower) / 2;
  const endMidpoint = (endConditionUpper + endConditionLower) / 2;
  const delta = endMidpoint - startMidpoint;

  if (!Number.isFinite(delta)) {
    return null;
  }

  // Round to 2 decimal places to avoid floating-point display noise
  // (e.g. -0.22499999999999998 -> -0.22).
  return Math.round(delta * 100) / 100;
}
