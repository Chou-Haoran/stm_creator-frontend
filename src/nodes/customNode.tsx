
import { useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { CustomNodeData } from './types';
import './customNode.css';

interface CustomNodeProps extends NodeProps {
    data: CustomNodeData;
}

// Helper function to get class number
function getVastClassNumber(vastClass: string): number {
    if (vastClass === 'Class I') return 1;
    if (vastClass === 'Class II') return 2;
    if (vastClass === 'Class III') return 3;
    if (vastClass === 'Class IV') return 4;
    if (vastClass === 'Class V') return 5;
    if (vastClass === 'Class VI') return 6;
    return 0;
}

export function CustomNode({ data, id }: CustomNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [nodeLabel, setNodeLabel] = useState(data.label);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNodeLabel(event.target.value);
    };

    const saveLabel = () => {
        if (data.onLabelChange) {
            data.onLabelChange(id, nodeLabel);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            saveLabel();
        }
    };

    const onNodeDoubleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsEditing(true);
    };

    const handleNodeClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (data.onNodeClick) {
            data.onNodeClick(id);
        }
    };

    // Get the state attributes if available
    const stateNumber = data.attributes?.stateNumber || '';
    const vastClass = data.attributes?.vastClass || '';
    const condition = data.attributes?.condition || '';

    // Check if this node is currently selected during edge creation
    const isSelected = data.isSelected || false;
    const isEdgeCreationMode = data.isEdgeCreationMode || false;

    // Add special styling for selected nodes during edge creation
    const containerStyle = {
        boxShadow: isSelected ? '0 0 0 4px #007bff, 0 2px 5px rgba(0, 0, 0, 0.1)' : '0 2px 5px rgba(0, 0, 0, 0.1)',
        cursor: isEdgeCreationMode ? 'crosshair' : 'pointer'
    };

    return (
        <div
            onClick={handleNodeClick}
            onDoubleClick={onNodeDoubleClick}
            className={`node-container class-color-${getVastClassNumber(vastClass) || 'default'}`}
            style={containerStyle}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={nodeLabel}
                    onChange={handleInputChange}
                    onBlur={saveLabel}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="label-input"
                    onClick={e => e.stopPropagation()}
                />
            ) : (
                <>
                    {/* State number badge */}
                    {stateNumber && (
                        <div className={`state-number-badge class-color-${getVastClassNumber(vastClass) || 'default'}-bg`}>
                            {stateNumber}
                        </div>
                    )}

                    {/* Top bar with VAST class */}
                    {vastClass && (
                        <div className={`class-label class-color-${getVastClassNumber(vastClass) || 'default'}-bg`}>
                            {vastClass}
                        </div>
                    )}

                    {/* State name with text wrapping */}
                    <div className="state-name" style={{ marginTop: vastClass ? '15px' : '0' }}>
                        {data.label}
                    </div>

                    {/* Condition info */}
                    {condition && (
                        <div className="condition-info">
                            {condition}
                        </div>
                    )}
                </>
            )}

            {/*
                Multiple connection handles around the node
                This gives users more options for connecting edges
                Each handle has a unique ID and position
            */}

            {/* Top edge handles */}
            <Handle
                type="source"
                position={Position.Top}
                id="top-center-source"
                style={{ left: '50%' }}
                className="handle handle-top"
            />
            <Handle
                type="target"
                position={Position.Top}
                id="top-center-target"
                style={{ left: '50%' }}
                className="handle handle-top"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-left-source"
                style={{ left: '25%' }}
                className="handle handle-top"
            />
            <Handle
                type="target"
                position={Position.Top}
                id="top-left-target"
                style={{ left: '25%' }}
                className="handle handle-top"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-right-source"
                style={{ left: '75%' }}
                className="handle handle-top"
            />
            <Handle
                type="target"
                position={Position.Top}
                id="top-right-target"
                style={{ left: '75%' }}
                className="handle handle-top"
            />

            {/* Right edge handles */}
            <Handle
                type="source"
                position={Position.Right}
                id="right-center-source"
                style={{ top: '50%' }}
                className="handle handle-right"
            />
            <Handle
                type="target"
                position={Position.Right}
                id="right-center-target"
                style={{ top: '50%' }}
                className="handle handle-right"
            />
            <Handle
                type="target"
                position={Position.Right}
                id="right-top-target"
                style={{ top: '25%' }}
                className="handle handle-right"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-bottom-source"
                style={{ top: '75%' }}
                className="handle handle-right"
            />
            <Handle
                type="target"
                position={Position.Right}
                id="right-bottom-target"
                style={{ top: '75%' }}
                className="handle handle-right"
            />

            {/* Bottom edge handles */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-center-source"
                style={{ left: '50%' }}
                className="handle handle-bottom"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-center-target"
                style={{ left: '50%' }}
                className="handle handle-bottom"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-left-source"
                style={{ left: '25%' }}
                className="handle handle-bottom"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-left-target"
                style={{ left: '25%' }}
                className="handle handle-bottom"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-right-source"
                style={{ left: '75%' }}
                className="handle handle-bottom"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-right-target"
                style={{ left: '75%' }}
                className="handle handle-bottom"
            />

            {/* Left edge handles */}
            <Handle
                type="source"
                position={Position.Left}
                id="left-center-source"
                style={{ top: '50%' }}
                className="handle handle-left"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left-center-target"
                style={{ top: '50%' }}
                className="handle handle-left"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-top-source"
                style={{ top: '25%' }}
                className="handle handle-left"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left-top-target"
                style={{ top: '25%' }}
                className="handle handle-left"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-bottom-source"
                style={{ top: '75%' }}
                className="handle handle-left"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left-bottom-target"
                style={{ top: '75%' }}
                className="handle handle-left"
            />
        </div>
    );
}