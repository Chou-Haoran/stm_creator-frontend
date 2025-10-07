import { GraphModelVersion } from '../types';

interface VersionManagerModalProps {
    isOpen: boolean;
    versions: GraphModelVersion[];
    onClose: () => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}

export function VersionManagerModal({
    isOpen,
    versions,
    onClose,
    onRestore,
    onDelete,
}: VersionManagerModalProps) {
    if (!isOpen) {
        return null;
    }

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.stopPropagation();
        onDelete(id);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1100,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '500px',
                    maxWidth: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Model Versions</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                        }}
                        aria-label="Close version manager"
                    >
                        ✕
                    </button>
                </div>

                {versions.length === 0 ? (
                    <p style={{ marginTop: '20px' }}>
                        No saved versions yet. Use &ldquo;Save Version&rdquo; after editing to keep a snapshot.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'grid', gap: '12px' }}>
                        {versions.map((version) => {
                            const savedAt = new Date(version.savedAt);
                            return (
                                <li
                                    key={version.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '16px',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{version.name}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Saved at {savedAt.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => onRestore(version.id)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid #10b981',
                                                backgroundColor: '#10b981',
                                                color: '#fff',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={(event) => handleDelete(event, version.id)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid #ef4444',
                                                backgroundColor: '#fff',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
