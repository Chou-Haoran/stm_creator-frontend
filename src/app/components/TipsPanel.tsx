
export function TipsPanel() {
    return (
        <div className="tips-panel">
            <h3 className="tips-title">Tips</h3>
            <p className="tips-item">🎯 Click a node to edit it</p>
            <p className="tips-item">🧵 Use Create Edge button to connect nodes</p>
            <p className="tips-item">👆 Click an edge to select it</p>
            <p className="tips-item">📝 Double-click an edge to edit transition</p>
            <p className="tips-item">🔁 Drag edge endpoints to reconnect</p>
            <p className="tips-item">📐 Use Re-layout to optimize layout</p>
            <p className="tips-item">🔄 Toggle self-transitions visibility</p>
            <p className="tips-item">⚖️ Filter transitions by delta value</p>
        </div>
    );
}
