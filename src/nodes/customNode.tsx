
import { useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { CustomNodeData } from './types';
import { getConditionClassColour } from '../utils/conditionColours';
import './customNode.css';

interface CustomNodeProps extends NodeProps {
    data: CustomNodeData;
}

function getConditionBarWidth(condition: string): number {
    const regex = /Condition\s*range:\s*([\d.]+)\s*-\s*([\d.]+)/i;
    const match = regex.exec(condition);
    if (match) {
        const lower = parseFloat(match[1]);
        const upper = parseFloat(match[2]);
        return Math.round(((lower + upper) / 2) * 100);
    }
    return 0;
}

function normaliseImageUrls(data: CustomNodeData): string[] {
    const attributes = data.attributes;
    if (!attributes) return [];
    if (Array.isArray(attributes.imageUrls) && attributes.imageUrls.length > 0) {
        return attributes.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
    }
    return attributes.imageUrl ? [attributes.imageUrl] : [];
}

export function CustomNode({ data, id }: CustomNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [nodeLabel, setNodeLabel] = useState(data.label);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const canEdit = data.canEdit !== false;
    const inlineEditEnabled = data.enableInlineEdit === true;
    const isLockedByOther = Boolean(data.isLocked && !data.isLockedByMe);

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
        if (event.key === 'Enter') saveLabel();
    };

    const onNodeDoubleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!canEdit || !inlineEditEnabled || isLockedByOther) return;
        setIsEditing(true);
    };

    const handleNodeClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (data.onNodeClick) data.onNodeClick(id);
    };

    const handleCommentBubbleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        data.onCommentBubbleClick?.(id);
    };

    const stateNumber = data.attributes?.stateNumber || '';
    const vastClass   = data.attributes?.vastClass   || '';
    const condition   = data.attributes?.condition   || '';
    const isSelected  = data.isSelected || false;
    const isEdgeCreationMode = data.isEdgeCreationMode || false;

    const colours   = getConditionClassColour(vastClass || undefined);
    const barWidth  = getConditionBarWidth(condition);
    const imageUrls = normaliseImageUrls(data);

    // Inject colour tokens as CSS custom properties so the stylesheet
    // can reference them without hardcoding any hex values.
    const colourVars = {
        '--node-bg':     colours.background,
        '--node-border': colours.border,
        '--node-text':   colours.text,
        '--node-accent': colours.accent,
    } as React.CSSProperties;

    const containerStyle: React.CSSProperties = {
        ...colourVars,
        boxShadow: isSelected
            ? `0 0 0 4px ${colours.accent}, 0 2px 5px rgba(0,0,0,0.1)`
            : undefined,
        cursor: canEdit ? (isEdgeCreationMode ? 'crosshair' : 'pointer') : 'default',
    };

    const lockClasses = [
        data.isLocked     ? 'node-locked'       : '',
        data.isLockedByMe ? 'node-locked-me'     : '',
        isLockedByOther   ? 'node-locked-other'  : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            onClick={handleNodeClick}
            onDoubleClick={onNodeDoubleClick}
            className={`node-container${lockClasses ? ` ${lockClasses}` : ''}`}
            style={containerStyle}
        >
            {data.isLocked && (
                <div
                    className="node-lock-indicator"
                    style={{ borderColor: data.lockColor ?? '#f59e0b' }}
                    title={
                        data.isLockedByMe
                            ? 'You are editing this node'
                            : `Locked by ${data.lockOwner ?? 'another user'}`
                    }
                >
                    <span
                        className="node-lock-dot"
                        style={{ backgroundColor: data.lockColor ?? '#f59e0b' }}
                    />
                    {data.isLockedByMe
                        ? 'Editing'
                        : `Locked${data.lockOwner ? `: ${data.lockOwner}` : ''}`}
                </div>
            )}

            {isEditing ? (
                <div className="node-body">
                    <input
                        type="text"
                        value={nodeLabel}
                        onChange={handleInputChange}
                        onBlur={saveLabel}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="label-input"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ) : (
                <>
                    {stateNumber && (
                        <div className="state-number-badge">{stateNumber}</div>
                    )}

                    {(data.commentCount ?? 0) > 0 && (
                        <button
                            type="button"
                            className="node-comment-bubble"
                            onClick={handleCommentBubbleClick}
                            title={`${data.commentCount} comment${data.commentCount === 1 ? '' : 's'}`}
                        >
                            C {data.commentCount}
                        </button>
                    )}

                    <div className="node-header">
                        <span className="node-class">{vastClass || 'State'}</span>
                        <span className="node-id">#{stateNumber || id}</span>
                    </div>

                    <div className="node-body">
                        <div className="state-name">{data.label}</div>

                        {condition && (
                            <div className="condition-info">{condition}</div>
                        )}

                        {barWidth > 0 && (
                            <div className="node-bar">
                                <div className="node-bar-fill" style={{ width: `${barWidth}%` }} />
                            </div>
                        )}

                        {imageUrls.length > 0 && (
                            <div className="node-image-strip">
                                {imageUrls.slice(0, 3).map((url, index) => (
                                    <button
                                        type="button"
                                        key={`${url.slice(0, 24)}-${index}`}
                                        className="node-image-thumb"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setExpandedImage(url);
                                        }}
                                        title="Preview image"
                                    >
                                        <img src={url} alt={`State image ${index + 1}`} />
                                    </button>
                                ))}
                                {imageUrls.length > 3 && (
                                    <button
                                        type="button"
                                        className="node-image-more"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setExpandedImage(imageUrls[3]);
                                        }}
                                        title="Preview more images"
                                    >
                                        +{imageUrls.length - 3}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {expandedImage && (
                <div
                    className="node-image-preview"
                    onClick={(event) => {
                        event.stopPropagation();
                        setExpandedImage(null);
                    }}
                >
                    <div className="node-image-preview-inner">
                        <button
                            type="button"
                            className="node-image-preview-close"
                            onClick={(event) => {
                                event.stopPropagation();
                                setExpandedImage(null);
                            }}
                        >
                            x
                        </button>
                        <img src={expandedImage} alt="State preview" />
                    </div>
                </div>
            )}

            {/* Top handles */}
            <Handle type="source" position={Position.Top} id="top-center-source" style={{ left: '50%' }} className="handle handle-top" />
            <Handle type="target" position={Position.Top} id="top-center-target" style={{ left: '50%' }} className="handle handle-top" />
            <Handle type="source" position={Position.Top} id="top-left-source"   style={{ left: '25%' }} className="handle handle-top" />
            <Handle type="target" position={Position.Top} id="top-left-target"   style={{ left: '25%' }} className="handle handle-top" />
            <Handle type="source" position={Position.Top} id="top-right-source"  style={{ left: '75%' }} className="handle handle-top" />
            <Handle type="target" position={Position.Top} id="top-right-target"  style={{ left: '75%' }} className="handle handle-top" />

            {/* Right handles */}
            <Handle type="source" position={Position.Right} id="right-center-source" style={{ top: '50%' }} className="handle handle-right" />
            <Handle type="target" position={Position.Right} id="right-center-target" style={{ top: '50%' }} className="handle handle-right" />
            <Handle type="target" position={Position.Right} id="right-top-target"    style={{ top: '25%' }} className="handle handle-right" />
            <Handle type="source" position={Position.Right} id="right-bottom-source" style={{ top: '75%' }} className="handle handle-right" />
            <Handle type="target" position={Position.Right} id="right-bottom-target" style={{ top: '75%' }} className="handle handle-right" />

            {/* Bottom handles */}
            <Handle type="source" position={Position.Bottom} id="bottom-center-source" style={{ left: '50%' }} className="handle handle-bottom" />
            <Handle type="target" position={Position.Bottom} id="bottom-center-target" style={{ left: '50%' }} className="handle handle-bottom" />
            <Handle type="source" position={Position.Bottom} id="bottom-left-source"   style={{ left: '25%' }} className="handle handle-bottom" />
            <Handle type="target" position={Position.Bottom} id="bottom-left-target"   style={{ left: '25%' }} className="handle handle-bottom" />
            <Handle type="source" position={Position.Bottom} id="bottom-right-source"  style={{ left: '75%' }} className="handle handle-bottom" />
            <Handle type="target" position={Position.Bottom} id="bottom-right-target"  style={{ left: '75%' }} className="handle handle-bottom" />

            {/* Left handles */}
            <Handle type="source" position={Position.Left} id="left-center-source" style={{ top: '50%' }} className="handle handle-left" />
            <Handle type="target" position={Position.Left} id="left-center-target" style={{ top: '50%' }} className="handle handle-left" />
            <Handle type="source" position={Position.Left} id="left-top-source"    style={{ top: '25%' }} className="handle handle-left" />
            <Handle type="target" position={Position.Left} id="left-top-target"    style={{ top: '25%' }} className="handle handle-left" />
            <Handle type="source" position={Position.Left} id="left-bottom-source" style={{ top: '75%' }} className="handle handle-left" />
            <Handle type="target" position={Position.Left} id="left-bottom-target" style={{ top: '75%' }} className="handle handle-left" />
        </div>
    );
}
