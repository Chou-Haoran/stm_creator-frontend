// src/extensions/TransitionAttributePanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Panel } from '@xyflow/react';
import type { TransitionData, BMRGData } from '../utils/stateTransition';

type Props = {
  currentTransition: TransitionData | null;
  bmrgData: BMRGData | null; // ← new: read latest transition values from store by id
  stateNameMap: Record<number, string>;
  onSaveTransition: (updated: TransitionData) => void;
};

export function TransitionAttributePanel({
  currentTransition,
  bmrgData,
  stateNameMap,
  onSaveTransition,
}: Props) {
  // Collapsible panel
  const [collapsed, setCollapsed] = useState(false);

  // Resolve the freshest transition by id from bmrgData
  const selected = useMemo<TransitionData | null>(() => {
    if (!currentTransition) return null;
    const id = currentTransition.transition_id;
    const fresh = bmrgData?.transitions?.find((t) => t.transition_id === id);
    return fresh ?? currentTransition;
  }, [currentTransition?.transition_id, bmrgData]);

  // Local form state
  const [time25, setTime25] = useState<boolean>(false);
  const [time100, setTime100] = useState<boolean>(false);
  const [lik25, setLik25] = useState<number>(0);
  const [lik100, setLik100] = useState<number>(0);
  const [delta, setDelta] = useState<number>(0);

  // Sync form when selection or store data changes
  useEffect(() => {
    if (!selected) return;
    setTime25(Boolean(selected.time_25));
    setTime100(Boolean(selected.time_100));
    setLik25(selected.likelihood_25 ?? 0);
    setLik100(selected.likelihood_100 ?? 0);
    setDelta(selected.transition_delta ?? 0);
  }, [selected]);

  const disabled = !selected;

  // Title shows "start → end"
  const title = useMemo(() => {
    if (!selected) return 'No transition selected';
    const s = stateNameMap[selected.start_state_id] ?? selected.start_state;
    const t = stateNameMap[selected.end_state_id] ?? selected.end_state;
    return `Transition: ${s} → ${t}`;
  }, [selected, stateNameMap]);

  // Save handler: clamp numeric values and convert booleans to 0/1
  const handleSave = () => {
    if (!selected) return;
    const updated: TransitionData = {
      ...selected,
      time_25: time25 ? 1 : 0,
      time_100: time100 ? 1 : 0,
      likelihood_25: clamp01(lik25),
      likelihood_100: clamp01(lik100),
      transition_delta: Number.isFinite(delta) ? delta : 0,
    };
    onSaveTransition(updated);

    // Optimistic update to keep form in sync even if store reuses references
    setTime25(Boolean(updated.time_25));
    setTime100(Boolean(updated.time_100));
    setLik25(updated.likelihood_25 ?? 0);
    setLik100(updated.likelihood_100 ?? 0);
    setDelta(updated.transition_delta ?? 0);
  };

  return (
    <Panel
      position="top-left"
      className="stm-ext-panel"
      // Keep aligned with filter panel at the same top, to the right
      style={{ top: 76, left: 380, width: 340 }}
    >
      <div className={`stm-ext-card ${disabled ? 'is-disabled' : ''}`}>
        <div className="stm-ext-header">
          <div className="stm-ext-title">{title}</div>
          <button
            className="stm-ext-btn ghost"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand attributes' : 'Collapse attributes'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="stm-ext-row">
              <label className="stm-ext-field">
                <input
                  type="checkbox"
                  checked={time25}
                  disabled={disabled}
                  onChange={(e) => setTime25(e.target.checked)}
                />
                <span>time_25</span>
              </label>

              <label className="stm-ext-field">
                <input
                  type="checkbox"
                  checked={time100}
                  disabled={disabled}
                  onChange={(e) => setTime100(e.target.checked)}
                />
                <span>time_100</span>
              </label>
            </div>

            <div className="stm-ext-row">
              <label className="stm-ext-field">
                <span>likelihood_25</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={lik25}
                  disabled={disabled}
                  onChange={(e) => setLik25(toNumberOrZero(e.target.value))}
                />
              </label>

              <label className="stm-ext-field">
                <span>likelihood_100</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={lik100}
                  disabled={disabled}
                  onChange={(e) => setLik100(toNumberOrZero(e.target.value))}
                />
              </label>
            </div>

            <div className="stm-ext-row">
              <label className="stm-ext-field">
                <span>transition_delta</span>
                <input
                  type="number"
                  step={0.01}
                  value={delta}
                  disabled={disabled}
                  onChange={(e) => setDelta(toNumberOrZero(e.target.value))}
                />
              </label>
            </div>

            <div className="stm-ext-actions">
              <button
                className="stm-ext-btn primary"
                disabled={disabled}
                onClick={handleSave}
                aria-disabled={disabled}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

function toNumberOrZero(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
