
interface EdgeCreationHintProps {
    isActive: boolean;
    hasStartNode: boolean;
}

export function EdgeCreationHint({ isActive, hasStartNode }: EdgeCreationHintProps) {
    if (!isActive) {
        return null;
    }

    return (
        <div className="edge-creation-help">
            <span className="edge-creation-help-icon">ℹ️</span>
            {hasStartNode
                ? 'Now click on a destination node to create an edge'
                : 'Click on a source node to start creating an edge'}
        </div>
    );
}
