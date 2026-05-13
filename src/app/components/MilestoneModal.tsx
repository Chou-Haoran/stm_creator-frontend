import { useEffect, useState } from 'react';
import { GraphModelVersion } from '../types';
import type { GlobalRole, ModelRole } from '../../constants/roles';
import { canEditModel, isAdmin } from '../../utils/permissions';
import {
    createMilestone,
    deleteMilestone,
    getMilestones,
    restoreMilestone,
} from '../api/models';

interface MilestoneModalProps {
    isOpen: boolean;
    versions: GraphModelVersion[];
    onClose: () => void;
    /** Save with an optional custom name; if empty, an auto-generated name is used */
    onSave: (customName?: string) => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    modelName?: string | null;
    currentModelRole?: ModelRole | null;
    userRole?: GlobalRole | null;
}

/**
 * MilestoneModal — unified modal that combines "Save Version" and "Versions"
 * into a single panel. The top section has an optional name input and a button
 * to save the current model state as a new milestone; the bottom section lists
 * all saved milestones with Restore and Delete actions.
 */
export function MilestoneModal({
    isOpen,
    versions,
    onClose,
    onSave,
    onRestore,
    onDelete,
    canEdit,
    modelName,
    currentModelRole,
    userRole,
}: MilestoneModalProps) {
    // User-entered name for the milestone (optional)
    const [milestoneName, setMilestoneName] = useState('');
    const [backendVersions, setBackendVersions] = useState<GraphModelVersion[] | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    // ID of the milestone pending delete confirmation; null when no confirm dialog is shown
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const canCreateOrRestore = Boolean(canEdit && canEditModel(currentModelRole ?? undefined));
    const canDeleteMilestones = isAdmin(userRole ?? undefined);
    const displayedVersions = backendVersions ?? versions;

    useEffect(() => {
        if (!isOpen || !modelName) return;
        let cancelled = false;
        const run = async () => {
            setActionError(null);
            try {
                const data = await getMilestones(modelName);
                const milestones = Array.isArray(data?.milestones) ? data.milestones : Array.isArray(data) ? data : [];
                const mapped = milestones.map((milestone: any): GraphModelVersion => ({
                    id: String(milestone.id ?? milestone.milestone_id),
                    name: String(milestone.label ?? milestone.name ?? 'Milestone'),
                    savedAt: String(milestone.created_at ?? milestone.savedAt ?? new Date().toISOString()),
                    data: milestone.data ?? versions[0]?.data,
                })).filter((milestone: GraphModelVersion) => Boolean(milestone.id && milestone.data));
                if (!cancelled) setBackendVersions(mapped);
            } catch {
                if (!cancelled) setBackendVersions(null);
            }
        };
        void run();
        return () => { cancelled = true; };
    }, [isOpen, modelName, versions]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!canCreateOrRestore) return;
        const label = milestoneName.trim() || `Milestone ${new Date().toLocaleString()}`;
        try {
            if (!modelName) throw new Error('No model selected');
            await createMilestone(modelName, { label });
            const data = await getMilestones(modelName);
            const milestones = Array.isArray(data?.milestones) ? data.milestones : Array.isArray(data) ? data : [];
            setBackendVersions(milestones.map((milestone: any): GraphModelVersion => ({
                id: String(milestone.id ?? milestone.milestone_id),
                name: String(milestone.label ?? milestone.name ?? 'Milestone'),
                savedAt: String(milestone.created_at ?? milestone.savedAt ?? new Date().toISOString()),
                data: milestone.data ?? versions[0]?.data,
            })).filter((milestone: GraphModelVersion) => Boolean(milestone.id && milestone.data)));
        } catch (error) {
            setActionError((error as Error).message || 'Backend milestone save failed. Saved locally instead.');
            onSave(label);
        } finally {
            setMilestoneName('');
        }
    };

    const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.stopPropagation();
        setPendingDeleteId(id);
    };

    const confirmDelete = () => {
        if (pendingDeleteId) {
            if (canDeleteMilestones && modelName) {
                void deleteMilestone(modelName, Number(pendingDeleteId))
                    .then(() => setBackendVersions((items) => items?.filter((item) => item.id !== pendingDeleteId) ?? null))
                    .catch(() => onDelete(pendingDeleteId));
            } else {
                onDelete(pendingDeleteId);
            }
            setPendingDeleteId(null);
        }
    };

    const handleRestore = async (id: string) => {
        if (!canCreateOrRestore) return;
        try {
            if (!modelName) throw new Error('No model selected');
            await restoreMilestone(modelName, Number(id));
            globalThis.location.reload();
        } catch (error) {
            setActionError((error as Error).message || 'Backend restore failed. Restoring local milestone instead.');
            onRestore(id);
        }
    };

    const cancelDelete = () => {
        setPendingDeleteId(null);
    };

    return (
        <div style={overlay} onClick={onClose}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={header}>
                    <h2 style={titleStyle}>Milestones</h2>
                    <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>
                </div>

                {/* Save current state as milestone — optional name input + save button */}
                <div style={saveSection}>
                    <input
                        type="text"
                        value={milestoneName}
                        onChange={(e) => setMilestoneName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && canCreateOrRestore) void handleSave(); }}
                        placeholder="Milestone name (optional)…"
                        style={nameInput}
                    />
                    <button
                        onClick={() => void handleSave()}
                        disabled={!canCreateOrRestore}
                        style={{
                            ...saveBtnStyle,
                            opacity: canCreateOrRestore ? 1 : 0.5,
                            cursor: canCreateOrRestore ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/>
                        </svg>
                        Save Current State as Milestone
                    </button>
                </div>

                <div style={divider} />

                {/* Milestone history list */}
                <div style={listSection}>
                    <h3 style={sectionTitle}>History</h3>
                    {actionError && <p style={errorText}>{actionError}</p>}
                    {displayedVersions.length === 0 ? (
                        <p style={emptyText}>No milestones saved yet.</p>
                    ) : (
                        <ul style={listContainer}>
                            {displayedVersions.map((version) => {
                                const savedAt = new Date(version.savedAt);
                                return (
                                    <li key={version.id} style={listItem}>
                                        <div>
                                            <div style={versionName}>{version.name}</div>
                                            <div style={versionDate}>
                                                {savedAt.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={actionRow}>
                                            <button
                                                onClick={() => void handleRestore(version.id)}
                                                disabled={!canCreateOrRestore}
                                                style={restoreBtn}
                                            >
                                                Restore
                                            </button>
                                            {canDeleteMilestones && (
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, version.id)}
                                                    style={deleteBtn}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Delete confirmation dialog */}
                {pendingDeleteId && (
                    <div style={confirmOverlay}>
                        <div style={confirmBox}>
                            <p style={confirmText}>Are you sure you want to delete this milestone?</p>
                            <div style={confirmActions}>
                                <button onClick={cancelDelete} style={confirmCancelBtn}>Cancel</button>
                                <button onClick={confirmDelete} style={confirmDeleteBtn}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Styles ── */

const overlay: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
};

const modal: React.CSSProperties = {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 520,
    maxWidth: '92%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const header: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#064e3b',
};

const closeBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#065f46',
    padding: 4,
};

const saveSection: React.CSSProperties = {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const nameInput: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #F0D9A6',
    fontSize: 14,
    color: '#065f46',
    outline: 'none',
};

const saveBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
};

const divider: React.CSSProperties = {
    height: 1,
    background: '#e5e7eb',
    marginBottom: 16,
};

const listSection: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
};

const sectionTitle: React.CSSProperties = {
    margin: '0 0 12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: '#065f46',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const emptyText: React.CSSProperties = {
    color: '#6b7280',
    fontSize: 14,
    margin: '8px 0',
};

const errorText: React.CSSProperties = {
    color: '#dc2626',
    fontSize: 12,
    margin: '0 0 8px',
};

const listContainer: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: 8,
};

const listItem: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
};

const versionName: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 14,
    color: '#064e3b',
};

const versionDate: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
};

const actionRow: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
};

const restoreBtn: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #10b981',
    backgroundColor: '#10b981',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
};

const deleteBtn: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #ef4444',
    backgroundColor: '#fff',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
};

/* Delete confirmation dialog styles */
const confirmOverlay: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
};

const confirmBox: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: 320,
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
