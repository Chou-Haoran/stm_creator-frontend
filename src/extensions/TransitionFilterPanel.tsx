// src/extensions/TransitionFilterPanel.tsx
import { useMemo, useState } from 'react';
import type { ModelData } from '../utils/stateTransition';
import type { DeltaFilterOption } from '../app/types';

type Props = {
  modelData: ModelData | null;
  showSelfTransitions: boolean;
  deltaFilter: DeltaFilterOption;
  onDeltaFilterChange: (opt: DeltaFilterOption) => void;
  onToggleSelfTransitions: () => void;
  onReset: () => void;
  /** When true, renders inline for sidebar (no Panel wrapper) */
  inSidebar?: boolean;
};

export function TransitionFilterPanel({
  modelData,
  showSelfTransitions,
  deltaFilter,
  onDeltaFilterChange,
  onToggleSelfTransitions: _onToggleSelfTransitions,
  onReset,
  inSidebar = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(!inSidebar);

  // Visibility is governed ONLY by the condition (Δ) filter — and, separately,
  // the self-transitions toggle in the toolbar. time_25 / time_100 are domain
  // attributes (years to completion) and the probability range is not yet used,
  // so neither filters the canvas. The count below mirrors exactly what is drawn.
  const matchCount = useMemo(() => {
    if (!modelData) return 0;
    let count = 0;
    for (const t of modelData.transitions) {
      if (deltaFilter === 'positive' && !(t.transition_delta > 0)) continue;
      if (deltaFilter === 'neutral'  && !(t.transition_delta === 0)) continue;
      if (deltaFilter === 'negative' && !(t.transition_delta < 0)) continue;
      if (!showSelfTransitions && t.start_state_id === t.end_state_id) continue;
      count++;
    }
    return count;
  }, [modelData, deltaFilter, showSelfTransitions]);

  const clearFilters = () => {
    // Reset the condition filter back to "All". onReset reloads edges; the
    // explicit 'all' change is applied last so the final state shows everything.
    onReset();
    onDeltaFilterChange('all');
  };

  const content = (
      <div className="stm-ext-card">
        <div className="stm-ext-header">
          <div className="stm-ext-title">
            Transition Filters
            <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 10, color: 'var(--text-dim)', fontFamily: "'DM Mono', monospace" }}>
            ({matchCount})
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
              <div className="stm-ext-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label className="stm-ext-field">
                  <span>Condition (Δ) filter</span>
                  <select
                      value={deltaFilter}
                      onChange={(e) => onDeltaFilterChange(e.target.value as DeltaFilterOption)}
                  >
                    <option value="all">All</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </label>
              </div>

              <div className="stm-ext-actions">
                <button className="stm-ext-btn" onClick={clearFilters}>Clear</button>
              </div>
            </>
        )}
      </div>
  );

  // When in sidebar, render inline without Panel wrapper
  if (inSidebar) {
    return content;
  }

  // Fallback: render as floating panel (not used in new layout but kept for compat)
  return content;
}
