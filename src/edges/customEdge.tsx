import { BaseEdge, EdgeProps, getBezierPath, getSmoothStepPath, Position } from '@xyflow/react';
import './customEdge.css';

// Function to create a loop/self-transition path
const getLoopPath = (
    x: number,
    y: number,
    size: number = 50
): [string, number, number] => {
    // Create a circular loop path extending to the right
    const path = `M ${x} ${y} C ${x + size} ${y - size}, ${x + size * 1.5} ${y}, ${x + size} ${y + size} S ${x} ${y + size * 0.5}, ${x} ${y}`;

    // Position for the label
    const labelX = x + size;
    const labelY = y - size * 0.5;

    return [path, labelX, labelY];
};

// Custom edge component with support for dynamic handle positions
export default function CustomEdge({
                                       id,
                                       source,
                                       target,
                                       sourceX,
                                       sourceY,
                                       targetX,
                                       targetY,
                                       sourcePosition,
                                       targetPosition,
                                       sourceHandleId,
                                       targetHandleId,
                                       style = {},
                                       data,
                                       selected,
                                   }: EdgeProps) {

    // Get curvature from data or use default
    const curvature = data?.curvature || 0.3;

    // Check if this is a self-transition (loop)
    const isSelfTransition = source === target;

    // Calculate the distance between nodes
    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Analyze the handle IDs to understand connection positioning
    // Example handle IDs: "top-center-source", "right-bottom-target", etc.
    const adjustPathBasedOnHandles = (sourcePos: Position, targetPos: Position, sourceHandleId?: string, targetHandleId?: string) => {
        // If we have more specific handle IDs, we can use them to adjust the path

        if (sourceHandleId && targetHandleId) {
            // Extract position info from handle IDs (if available)
            const sourceParts = sourceHandleId.split('-');
            const targetParts = targetHandleId.split('-');

            // Using the handle info to potentially adjust curvature or other properties
            // This is where you could add more sophisticated path customization

            // For demonstration, let's adjust curvature based on handle location
            // If connecting from left to right or vice versa, slightly increase curve
            if ((sourceParts[0] === 'left' && targetParts[0] === 'right') ||
                (sourceParts[0] === 'right' && targetParts[0] === 'left')) {
                return {
                    curvature: curvature as number * 1.2,
                    sourcePos: sourceParts[0] as string,
                    targetPos: targetParts[0] as string,
                };
            }

            // If connecting top-to-bottom, slightly reduce curvature
            if ((sourceParts[0] === 'top' && targetParts[0] === 'bottom') ||
                (sourceParts[0] === 'bottom' && targetParts[0] === 'top')) {
                return {
                    curvature: curvature as number * 0.8,
                    sourcePos: sourceParts[0] as string,
                    targetPos: targetParts[0] as string
                };
            }

            // If connections are on the same sides, increase curvature
            if (sourceParts[0] === targetParts[0]) {
                return {
                    curvature: curvature as number * 1.5,
                    sourcePos: sourceParts[0] as string,
                    targetPos: targetParts[0] as string
                };
            }

            // Return position info from handles if available
            return {
                curvature,
                sourcePos: sourceParts[0] as string,
                targetPos: targetParts[0] as string
            };
        }

        // Fall back to the passed positions
        return { curvature, sourcePos, targetPos };
    };

    // Determine the positions to use for the path calculation
    const { curvature: adjustedCurvature, sourcePos, targetPos } =
        adjustPathBasedOnHandles(sourcePosition, targetPosition, sourceHandleId as string, targetHandleId as string);

    // Determine the path to use
    let edgePath: string;
    let labelX: number;
    let labelY: number;

    if (isSelfTransition) {
        // Create a self-loop path
        [edgePath, labelX, labelY] = getLoopPath(sourceX, sourceY, 60);
    } else if (data?.isBidirectional) {
        // For bidirectional connections, use bezier curves with curvature
        [edgePath, labelX, labelY] = getBezierPath({
            sourceX,
            sourceY,
            sourcePosition: sourcePos as Position,
            targetX,
            targetY,
            targetPosition: targetPos as Position,
            curvature: adjustedCurvature as number,
        });
    } else {
        // For standard connections, use smooth step path for better routing around nodes
        [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition: sourcePos as Position,
            targetX,
            targetY,
            targetPosition: targetPos as Position,
            borderRadius: 8,
        });
    }

    // Get transition delta value for styling
    const transitionDelta = (data?.transitionDelta as number) ?? 0;
    const transitionId = data?.transitionId as number | undefined;
    const commentCount = (data?.commentCount as number) ?? 0;
    const onCommentBubbleClick = data?.onCommentBubbleClick as ((edgeId: string) => void) | undefined;
    const isNegativeDelta = transitionDelta < 0;
    const isZeroDelta = transitionDelta === 0;

    // Determine edge color based on transition delta:
    //   positive -> green, negative -> red, zero -> gray
    let edgeColor: string;
    if (isZeroDelta) {
        edgeColor = '#9ca3af';
    } else if (isNegativeDelta) {
        edgeColor = '#ff5555';
    } else {
        edgeColor = '#55aa55';
    }
    const edgeWidth = Math.max(1, Math.abs(transitionDelta) * 5 + 1);

    // Adjust label positioning for better visibility
    const labelOffset = distance < 150 ? 15 : 0;

    // Add selected styling
    const selectedStyle = selected ? {
        strokeWidth: edgeWidth + 2,
        stroke: '#3b82f6',
        filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))'
    } : {};

    // Create a unique marker ID for this edge to avoid conflicts
    const markerId = `arrow-${id}`;

    return (
        <>
            {/* Define the arrow marker in defs */}
            <defs>
                <marker
                    id={markerId}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={selected ? '#3b82f6' : edgeColor} />
                </marker>
            </defs>

            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    ...selectedStyle,
                    stroke: selected ? '#3b82f6' : edgeColor,
                    strokeWidth: 2,//edgeWidth,
                    cursor: 'pointer',
                }}
                markerEnd={`url(#arrow-${id})`} // This is the key change - explicitly set markerEnd
            />

            {data && transitionId != null && (
                <foreignObject
                    width={104}
                    height={30}
                    x={labelX - 52}
                    y={labelY - 15 + labelOffset}
                    className="edgebutton-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <div
                        style={{
                            background: isZeroDelta ? '#f3f4f6' : isNegativeDelta ? '#ffebee' : '#e8f5e9',
                            color: isZeroDelta ? '#4b5563' : isNegativeDelta ? '#c62828' : '#2e7d32',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            border: `1px solid ${isZeroDelta ? '#e5e7eb' : isNegativeDelta ? '#ffcdd2' : '#c8e6c9'}`,
                            textAlign: 'center',
                            width: 'fit-content',
                            cursor: 'pointer',
                            boxShadow: selected ? '0 0 4px #3b82f6' : 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {transitionId} · Δ {transitionDelta.toFixed(2)}
                    </div>
                </foreignObject>
            )}

            {commentCount > 0 && (
                <foreignObject
                    width={70}
                    height={28}
                    x={labelX - 35}
                    y={labelY + 18 + labelOffset}
                    className="edge-comment-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <button
                        type="button"
                        className="edge-comment-bubble"
                        onClick={(event) => {
                            event.stopPropagation();
                            onCommentBubbleClick?.(id);
                        }}
                        title={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}
                    >
                        C {commentCount}
                    </button>
                </foreignObject>
            )}
        </>
    );
}
