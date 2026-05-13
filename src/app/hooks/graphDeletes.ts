import { Dispatch, SetStateAction } from 'react';
import { BMRGData, TransitionData, statesToNodes } from '../../utils/stateTransition';
import { deleteModel as apiDeleteModel, deleteState as apiDeleteState, deleteTransition as apiDeleteTransition } from '../api/models';

type Deps = {
  getData: () => BMRGData | null;
  setData: Dispatch<SetStateAction<BMRGData | null>>;
  setNodes: Dispatch<SetStateAction<any[]>>; // AppNode[] but avoid import cycle
  rebuildEdges: (options?: { transitions?: TransitionData[]; dataOverride?: BMRGData | null }) => void;
  handleNodeLabelChange: (id: string, label: string) => void;
  handleNodeClick: (id: string) => void;
};

export function createDeleteActions({ getData, setData, setNodes, rebuildEdges, handleNodeLabelChange, handleNodeClick }: Deps) {
  const removeTransitionLocal = (tId: number) => {
    setData(prev => {
      if (!prev) return prev;
      const next: BMRGData = { ...prev, transitions: prev.transitions.filter(t => t.transition_id !== tId) };
      rebuildEdges({ transitions: next.transitions, dataOverride: next });
      return next;
    });
  };

  const handleDeleteTransition = async (transition: TransitionData) => {
    const data = getData();
    if (!data) return;
    const tId = transition.transition_id;
    if (typeof tId !== 'number') {
      // not persisted yet; local-only removal
      removeTransitionLocal(tId as any);
      return;
    }
    if (!confirm(`Delete transition ${tId}? This cannot be undone.`)) return;

    // Optimistically remove from local state first so the canvas updates
    // immediately, even when the transition was never saved to the backend
    // (in which case the API DELETE would 404). The next Save Model will
    // reconcile any out-of-band differences.
    removeTransitionLocal(tId);

    try {
      await apiDeleteTransition(data.stm_name, tId);
    } catch (e) {
      // Don't roll back — the local removal is the user's intent. Surface
      // non-trivial errors to the console for debugging.
      console.warn('Backend delete for transition failed (kept local removal):', tId, e);
    }
  };

  const handleDeleteState = async (graphStateId: number) => {
    const data = getData();
    if (!data) return;
    // find state by either state_id or frontend_state_id
    const st = data.states.find(s => (s.state_id ?? s.frontend_state_id) === graphStateId);
    if (!st) return;
    const dbId = st.state_id;
    if (!confirm(`Delete state "${st.state_name}" and its related transitions?`)) return;

    // Optimistically remove locally first (state + connected transitions +
    // recompute nodes/edges). The next Save Model will reconcile any
    // out-of-band differences if the backend call fails.
    setData(prev => {
      if (!prev) return prev;
      const remainingStates = prev.states.filter(s => (s.state_id ?? s.frontend_state_id) !== graphStateId);
      const remainingTransitions = prev.transitions.filter(t => t.start_state_id !== graphStateId && t.end_state_id !== graphStateId);
      const next: BMRGData = { ...prev, states: remainingStates, transitions: remainingTransitions };
      const nodes = statesToNodes(next.states, handleNodeLabelChange, handleNodeClick, next.transitions);
      setNodes(nodes);
      rebuildEdges({ transitions: remainingTransitions, dataOverride: next });
      return next;
    });

    if (typeof dbId === 'number') {
      try {
        await apiDeleteState(data.stm_name, dbId);
      } catch (e) {
        console.warn('Backend delete for state failed (kept local removal):', dbId, e);
      }
    }
  };

  const handleDeleteModel = async () => {
    const data = getData();
    if (!data) return;
    try {
      if (!confirm(`Delete model "${data.stm_name}" and ALL its data?`)) return;
      await apiDeleteModel(data.stm_name);
      try { localStorage.removeItem('stmCreator.lastModelName'); } catch {}
      alert('Model deleted');
      // Reload to reset app state cleanly
      window.location.href = '/editor';
    } catch (e) {
      console.error((e as Error).message || 'Failed to delete model');
    }
  };

  return { handleDeleteTransition, handleDeleteState, handleDeleteModel };
}
