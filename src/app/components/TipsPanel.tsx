import { useState } from 'react';

export function TipsPanel() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="stm-ext-card tips-panel">
      {/* Header with collapse toggle */}
      <div className="stm-ext-header">
        <div className="stm-ext-title">Tips</div>
        <button
          className="stm-ext-btn ghost"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand tips' : 'Collapse tips'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="tips-body">
          <p className="tips-item">🎯 Click a node to edit it</p>
          <p className="tips-item">🧵 Use Create Edge button to connect nodes</p>
          <p className="tips-item">👆 Click an edge to select it</p>
          <p className="tips-item">📝 Double-click an edge to edit transition</p>
          <p className="tips-item">🔁 Drag edge endpoints to reconnect</p>
          <p className="tips-item">📐 Use Re-layout to optimize layout</p>
          <p className="tips-item">🔄 Toggle self-transitions visibility</p>
          <p className="tips-item">⚖️ Filter transitions by delta value</p>
        </div>
      )}
    </div>
  );
}
