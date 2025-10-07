// src/extensions/TransitionFilterPanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Panel } from '@xyflow/react';
import type { BMRGData } from '../utils/stateTransition';
import type { DeltaFilterOption } from '../app/types';

type Props = {
  bmrgData: BMRGData | null;

  // Global filters from the toolbar (we respect them and intersect with local filters).
  showSelfTransitions: boolean;
  deltaFilter: DeltaFilterOption;

  // Kept for compatibility with App.tsx, not rendered here.
  onToggleSelfTransitions: () => void;
  onDeltaFilterChange: (opt: DeltaFilterOption) => void;

  // Called when clearing local filters.
  onReset: () => void;
};

// Robust truthy parser for 0/1, boolean, and string variants.
function isTruthy(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
  }
  return false;
}

function inRange(n: number | undefined, lo: number, hi: number): boolean {
  if (typeof n !== 'number' || Number.isNaN(n)) return false;
  return n >= lo && n <= hi;
}

export function TransitionFilterPanel({
  bmrgData,
  showSelfTransitions,
  deltaFilter,
  onToggleSelfTransitions: _onToggleSelfTransitions, // unused UI
  onDeltaFilterChange: _onDeltaFilterChange,          // unused UI
  onReset,
}: Props) {
  // Collapsible
  const [collapsed, setCollapsed] = useState(false);

  // Local filters
  const [requireTime25, setRequireTime25] = useState(false);
  const [requireTime100, setRequireTime100] = useState(false);
  const [probMin, setProbMin] = useState<number>(0);
  const [probMax, setProbMax] = useState<number>(1);
  const [rangeMode, setRangeMode] = useState<'any' | 'both'>('any'); // 'any' => either L25 or L100 in range; 'both' => both in range

  // Compute visible ids after ALL filters (toolbar + local)
  const { visibleIds, matchCount } = useMemo(() => {
    const ids = new Set<number>();
    let count = 0;

    if (!bmrgData) return { visibleIds: ids, matchCount: 0 };

    for (const t of bmrgData.transitions) {
      // 1) Global delta
      if (deltaFilter === 'positive' && !(t.transition_delta > 0)) continue;
      if (deltaFilter === 'neutral'  && !(t.transition_delta === 0)) continue;
      if (deltaFilter === 'negative' && !(t.transition_delta < 0)) continue;

      // 2) Global self-transitions
      if (!showSelfTransitions && t.start_state_id === t.end_state_id) continue;

      // 3) Local time flags
      if (requireTime25  && !isTruthy(t.time_25))  continue;
      if (requireTime100 && !isTruthy(t.time_100)) continue;

      // 4) Local probability range
      const in25  = inRange(t.likelihood_25,  probMin, probMax);
      const in100 = inRange(t.likelihood_100, probMin, probMax);
      const passRange = rangeMode === 'both' ? (in25 && in100) : (in25 || in100);
      if (!passRange) continue;

      ids.add(t.transition_id);
      count++;
    }
    return { visibleIds: ids, matchCount: count };
  }, [
    bmrgData,
    showSelfTransitions,
    deltaFilter,
    requireTime25,
    requireTime100,
    probMin,
    probMax,
    rangeMode,
  ]);

  // Apply DOM show/hide for edges (non-invasive to store)
  useEffect(() => {
    // If no local filters active, restore visibility (toolbar-only state)
    const hasLocal =
      requireTime25 || requireTime100 || probMin !== 0 || probMax !== 1 || rangeMode !== 'any';

    const allEdges = Array.from(
      document.querySelectorAll<HTMLElement>('[data-id*="transition-"]')
    );
    if (!allEdges.length) return;

    if (!hasLocal) {
      allEdges.forEach((el) => (el.style.display = ''));
      return;
    }

    // Allow hide-all when there are zero matches
    const ALLOW_HIDE_ALL = true;

    if (visibleIds.size === 0 && !ALLOW_HIDE_ALL) {
      return; // keep current visibility
    }

    allEdges.forEach((el) => {
      const idAttr = el.getAttribute('data-id') || '';
      const m = idAttr.match(/transition-(\d+)/);
      if (!m) return;
      const id = Number(m[1]);
      el.style.display = visibleIds.has(id) ? '' : 'none';
    });
  }, [visibleIds, requireTime25, requireTime100, probMin, probMax, rangeMode]);

  // Clear local filters and restore
  const clearFilters = () => {
    setRequireTime25(false);
    setRequireTime100(false);
    setProbMin(0);
    setProbMax(1);
    setRangeMode('any');
    Array.from(document.querySelectorAll<HTMLElement>('[data-id*="transition-"]')).forEach((el) => {
      el.style.display = '';
    });
    onReset();
  };

  return (
    <Panel
      position="top-left"
      className="stm-ext-panel"
      style={{ top: 76, left: 8, width: 360 }}
    >
      <div className="stm-ext-card">
        <div className="stm-ext-header">
          <div className="stm-ext-title">
            Transition Filters
            <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 11, color: '#6b7280' }}>
              {`(Matches: ${matchCount})`}
            </span>
          </div>
          <button
            className="stm-ext-btn ghost"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
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
                  checked={requireTime25}
                  onChange={(e) => setRequireTime25(e.target.checked)}
                />
                <span>time_25 = true</span>
              </label>
              <label className="stm-ext-field">
                <input
                  type="checkbox"
                  checked={requireTime100}
                  onChange={(e) => setRequireTime100(e.target.checked)}
                />
                <span>time_100 = true</span>
              </label>
            </div>

            <div className="stm-ext-row">
              <label className="stm-ext-field">
                <span>Probability min</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={probMin}
                  onChange={(e) => setProbMin(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
                />
              </label>
              <label className="stm-ext-field">
                <span>Probability max</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={probMax}
                  onChange={(e) => setProbMax(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
                />
              </label>
            </div>

            <div className="stm-ext-row">
              <label className="stm-ext-field">
                <span>Range mode</span>
                <select value={rangeMode} onChange={(e) => setRangeMode(e.target.value as any)}>
                  <option value="any">Either in range</option>
                  <option value="both">Both in range</option>
                </select>
              </label>
            </div>

            <div className="stm-ext-actions">
              <button className="stm-ext-btn" onClick={clearFilters}>Clear</button>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
