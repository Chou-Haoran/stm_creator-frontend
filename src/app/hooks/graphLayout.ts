import type { Dispatch, SetStateAction } from 'react';
import type { AppNode } from '../../nodes/types';
import type { BMRGData } from '../../utils/stateTransition/types';
import { computeLayoutPositions, type LayoutStrategy } from '../../utils/layoutStrategies';

interface Deps {
  getData: () => BMRGData | null;
  setNodes: Dispatch<SetStateAction<AppNode[]>>;
}

function parseStateId(nodeId: string): number | null {
  if (!nodeId.startsWith('state-')) return null;
  const id = Number(nodeId.slice('state-'.length));
  return Number.isFinite(id) ? id : null;
}

export function createLayoutActions({ getData, setNodes }: Deps) {
  const applyLayout = async (strategy: LayoutStrategy) => {
    const data = getData();
    if (!data) return;
    const positions = await computeLayoutPositions(strategy, data);
    setNodes((prev) => prev.map((n) => {
      const sid = parseStateId(n.id);
      if (sid == null) return n;
      const pos = positions.get(sid);
      return pos ? { ...n, position: pos } : n;
    }));
  };

  return { applyLayout };
}

