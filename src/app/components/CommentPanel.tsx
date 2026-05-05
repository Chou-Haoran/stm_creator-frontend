import { useMemo, useRef, useState } from 'react';
import {
    createComment as createBackendComment,
    deleteComment as deleteBackendComment,
    resolveComment as resolveBackendComment,
    type BackendComment,
} from '../api/comments';

export type CommentEntry = BackendComment;

/** An @-mentionable item (node or edge) */
interface MentionItem {
    type: 'node' | 'edge';
    id: string;
    label: string;
}

interface CommentPanelProps {
    onClose: () => void;
    comments: CommentEntry[];
    onCommentsChange: (comments: CommentEntry[]) => void;
    onReload?: () => Promise<void> | void;
    isLoading?: boolean;
    error?: string | null;
    canComment?: boolean;
    /** Available nodes: { id, label } */
    nodes: { id: string; label: string }[];
    /** Available edges: { id, sourceLabel, targetLabel } */
    edges: { id: string; sourceLabel: string; targetLabel: string }[];
    modelName: string;
}

export function CommentPanel({
    onClose,
    comments,
    onCommentsChange,
    onReload,
    isLoading = false,
    error = null,
    canComment = true,
    nodes,
    edges,
    modelName,
}: CommentPanelProps) {
    const [text, setText] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [showResolved, setShowResolved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Build the mention list from nodes and edges
    const mentionItems = useMemo<MentionItem[]>(() => [
        ...nodes.map(n => ({ type: 'node' as const, id: n.id, label: n.label })),
        ...edges.map(e => ({ type: 'edge' as const, id: e.id, label: `${e.sourceLabel} -> ${e.targetLabel}` })),
    ], [nodes, edges]);

    const filteredMentions = mentionItems.filter(m =>
        m.label.toLowerCase().includes(mentionFilter.toLowerCase())
    );

    const handleTextChange = (value: string) => {
        setText(value);
        // Detect @ trigger: find the last @ that isn't part of a completed @[...] mention
        const lastAt = value.lastIndexOf('@');
        if (lastAt >= 0) {
            const afterAt = value.slice(lastAt + 1);
            // If it starts with '[' and has a closing ']', the mention is complete
            if (afterAt.startsWith('[') && afterAt.includes(']')) {
                setShowMentions(false);
                setMentionFilter('');
                return;
            }
            // Show dropdown; strip leading '[' if user hasn't closed bracket yet
            const filter = afterAt.startsWith('[') ? afterAt.slice(1) : afterAt;
            // Hide if there's a newline in the filter
            if (!filter.includes('\n')) {
                setShowMentions(true);
                setMentionFilter(filter);
                return;
            }
        }
        setShowMentions(false);
        setMentionFilter('');
    };

    const insertMention = (item: MentionItem) => {
        const lastAt = text.lastIndexOf('@');
        const before = text.slice(0, lastAt);
        const newText = `${before}@[${item.label}] `;
        setText(newText);
        setShowMentions(false);
        setMentionFilter('');
        textareaRef.current?.focus();
    };

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsSubmitting(true);
        setActionError(null);
        try {
            const created = await createBackendComment(modelName, text.trim());
            onCommentsChange([created, ...comments.filter((comment) => comment.id !== created.id)]);
            setText('');
            await onReload?.();
        } catch (submitError) {
            setActionError(submitError instanceof Error ? submitError.message : 'Failed to create comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolveComment = async (commentId: number) => {
        setActionError(null);
        try {
            await resolveBackendComment(modelName, commentId);
            const updatedAt = new Date().toISOString();
            onCommentsChange(comments.map((comment) =>
                comment.id === commentId
                    ? { ...comment, resolved: true, updatedAt }
                    : comment,
            ));
            await onReload?.();
        } catch (resolveError) {
            setActionError(resolveError instanceof Error ? resolveError.message : 'Failed to resolve comment.');
        }
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        setActionError(null);
        try {
            await deleteBackendComment(modelName, pendingDeleteId);
            onCommentsChange(comments.filter(c => c.id !== pendingDeleteId));
            setPendingDeleteId(null);
            await onReload?.();
        } catch (deleteError) {
            setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete comment.');
        }
    };

    const sortedComments = useMemo(
        () => [...comments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        [comments],
    );
    const unresolvedComments = sortedComments.filter(c => !c.resolved);
    const resolvedComments = sortedComments.filter(c => c.resolved);

    /** Render comment text with @[...] mentions highlighted */
    const renderText = (raw: string) => {
        // Match @[mention name] format
        const parts = raw.split(/(@\[[^\]]+\])/g);
        return parts.map((part, i) =>
            part.startsWith('@[')
                ? <span key={i} style={mentionHighlight}>{part}</span>
                : <span key={i}>{part}</span>
        );
    };

    return (
        <>
            <div className="rp-header">
                <span className="rp-title">Comments</span>
                <button className="rp-close" onClick={onClose}>×</button>
            </div>

            {/* New comment input */}
            <div style={inputSection}>
                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                                e.preventDefault();
                                void handleSubmit();
                            }
                        }}
                        placeholder="Write a comment. Use @ to mention nodes/edges"
                        style={textareaStyle}
                        rows={3}
                        disabled={!canComment || isSubmitting}
                    />
                    {/* @mention dropdown — positioned below textarea using its bounding rect */}
                    {showMentions && filteredMentions.length > 0 && textareaRef.current && (() => {
                        const rect = textareaRef.current!.getBoundingClientRect();
                        return (
                            <div style={{ ...mentionDropdown, top: rect.bottom + 4, left: rect.left }}>
                                {filteredMentions.slice(0, 8).map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => insertMention(item)}
                                        style={mentionItem}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2, #f0fdf4)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                    >
                                        <span style={mentionBadge(item.type)}>
                                            {item.type === 'node' ? 'N' : 'E'}
                                        </span>
                                        <span style={{ fontSize: 12 }}>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                <button onClick={() => void handleSubmit()} style={submitBtn} disabled={!text.trim() || !canComment || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                {(error || actionError) && (
                    <div style={errorText}>{actionError ?? error}</div>
                )}
            </div>

            <div style={dividerStyle} />

            {/* Comment history */}
            <div style={historySection}>
                {isLoading ? (
                    <p style={emptyText}>Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p style={emptyText}>No comments yet.</p>
                ) : (
                    <>
                        {unresolvedComments.length === 0 ? (
                            <p style={emptyText}>No open comments.</p>
                        ) : (
                            unresolvedComments.map(c => (
                                <div key={c.id} style={commentCard}>
                                    <div style={commentHeader}>
                                        <span style={authorStyle}>{c.author.email}</span>
                                        <span style={dateStyle}>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={commentText}>{renderText(c.body)}</div>
                                    <div style={commentActions}>
                                        <button
                                            onClick={() => void resolveComment(c.id)}
                                            style={resolveBtnStyle}
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => setPendingDeleteId(c.id)}
                                            style={deleteBtnStyle}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {resolvedComments.length > 0 && (
                            <div style={resolvedSection}>
                                <button
                                    onClick={() => setShowResolved(prev => !prev)}
                                    style={resolvedToggleStyle}
                                >
                                    {showResolved ? 'Hide' : 'Show'} resolved comments ({resolvedComments.length})
                                </button>

                                {showResolved && resolvedComments.map(c => (
                                    <div key={c.id} style={resolvedCommentCard}>
                                        <div style={commentHeader}>
                                            <span style={authorStyle}>{c.author.email}</span>
                                            <span style={dateStyle}>{new Date(c.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div style={resolvedMetaText}>
                                            Resolved{c.updatedAt ? ` at ${new Date(c.updatedAt).toLocaleString()}` : ''}
                                        </div>
                                        <div style={commentText}>{renderText(c.body)}</div>
                                        <div style={commentActions}>
                                            <button
                                                onClick={() => setPendingDeleteId(c.id)}
                                                style={deleteBtnStyle}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete confirmation overlay */}
            {pendingDeleteId && (
                <div style={confirmOverlay}>
                    <div style={confirmBox}>
                        <p style={confirmText}>Delete this comment?</p>
                        <div style={confirmActions}>
                            <button onClick={() => setPendingDeleteId(null)} style={confirmCancelBtn}>Cancel</button>
                            <button onClick={confirmDelete} style={confirmDeleteBtn}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ── Styles ── */

const inputSection: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
};

const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--border, #e5e7eb)',
    background: 'var(--surface2, #fff)',
    color: 'var(--text, #064e3b)',
    fontSize: 12,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
};

const mentionDropdown: React.CSSProperties = {
    position: 'fixed',
    width: 228,
    maxHeight: 220,
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 6,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    zIndex: 1300,
};

const mentionItem: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 12,
};

const mentionBadge = (type: 'node' | 'edge'): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: type === 'node' ? '#10b981' : '#6366f1',
    flexShrink: 0,
});

const submitBtn: React.CSSProperties = {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    alignSelf: 'flex-end',
};

const errorText: React.CSSProperties = {
    color: '#dc2626',
    fontSize: 11,
    lineHeight: 1.4,
};

const dividerStyle: React.CSSProperties = {
    height: 1,
    background: 'var(--border, #e5e7eb)',
    marginBottom: 12,
};

const historySection: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
};

const emptyText: React.CSSProperties = {
    color: 'var(--text-muted, #6b7280)',
    fontSize: 12,
    margin: '8px 0',
};

const commentCard: React.CSSProperties = {
    background: 'var(--surface2, #f9fafb)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
};

const commentHeader: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
};

const authorStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text, #064e3b)',
};

const dateStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--text-muted, #6b7280)',
};

const commentText: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text, #064e3b)',
    lineHeight: 1.5,
    wordBreak: 'break-word',
    marginBottom: 6,
};

const mentionHighlight: React.CSSProperties = {
    color: '#059669',
    fontWeight: 600,
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 3,
    padding: '0 2px',
};

const commentActions: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
};

const resolveBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#059669',
    fontSize: 11,
    cursor: 'pointer',
    padding: 0,
    fontWeight: 600,
};

const resolvedSection: React.CSSProperties = {
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px solid var(--border, #e5e7eb)',
};

const resolvedToggleStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface2, #f9fafb)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    color: 'var(--text, #064e3b)',
    cursor: 'pointer',
    marginBottom: 8,
    textAlign: 'left',
};

const resolvedCommentCard: React.CSSProperties = {
    ...commentCard,
    opacity: 0.72,
    background: '#f3f4f6',
};

const resolvedMetaText: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--text-muted, #6b7280)',
    marginBottom: 6,
};

const deleteBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: 11,
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
};

const confirmOverlay: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1200,
};

const confirmBox: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: 300,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    textAlign: 'center',
};

const confirmText: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#064e3b',
    fontWeight: 500,
};

const confirmActions: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
};

const confirmCancelBtn: React.CSSProperties = {
    padding: '8px 20px',
    background: '#fff',
    color: '#065f46',
    border: '1px solid #F0D9A6',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
};

const confirmDeleteBtn: React.CSSProperties = {
    padding: '8px 20px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
};
