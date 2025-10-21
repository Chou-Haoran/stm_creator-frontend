import ELK from 'elkjs/lib/elk.bundled.js';
import type { StateData, TransitionData } from './stateTransition/types';
import type { BMRGData } from './stateTransition/types';

export type LayoutStrategy = 'grid' | 'layered' | 'force' | 'heuristic';

type Position = { x: number; y: number };

function gridPositions(states: StateData[]): Map<number, Position> {
  const positions = new Map<number, Position>();
  const n = states.length;
  if (n === 0) return positions;
  const cols = Math.ceil(Math.sqrt(n));
  const spacingX = 240;
  const spacingY = 160;
  const startX = 50;
  const startY = 50;
  states.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(s.state_id, { x: startX + col * spacingX, y: startY + row * spacingY });
  });
  return positions;
}

async function elkPositions(algorithm: 'layered' | 'force', states: StateData[], transitions: TransitionData[]): Promise<Map<number, Position>> {
  const elk = new ELK();
  const nodes = states.map((s) => ({ id: `state-${s.state_id}`, width: 180, height: 80 }));
  const edges = transitions
    .filter((t) => t.start_state_id !== t.end_state_id)
    .map((t, i) => ({ id: `e-${i}-${t.start_state_id}-${t.end_state_id}`, sources: [`state-${t.start_state_id}`], targets: [`state-${t.end_state_id}`] }));

  const graph: any = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': algorithm,
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.spacing.nodeNode': '50',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: nodes,
    edges,
  };

  const res = await elk.layout(graph);
  const positions = new Map<number, Position>();
  for (const child of res.children || []) {
    const id = child.id as string; // state-<id>
    const stateId = Number(id.split('-')[1]);
    positions.set(stateId, { x: child.x || 0, y: child.y || 0 });
  }
  return positions;
}

export async function computeLayoutPositions(strategy: LayoutStrategy, data: BMRGData): Promise<Map<number, Position>> {
  const { states, transitions } = data;
  if (strategy === 'grid') return gridPositions(states);
  if (strategy === 'layered') return elkPositions('layered', states, transitions);
  if (strategy === 'force') return elkPositions('force', states, transitions);
  return gridPositions(states);
}

