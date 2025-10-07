import { useEffect, useMemo, useState } from 'react';

interface HelpModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly developerEmail?: string;
}

export function HelpModal({ isOpen, onClose, developerEmail = 'dev@yourcompany.com' }: HelpModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setBody('');
            setFiles([]);
        }
    }, [isOpen]);

    const mailtoHref = useMemo(() => {
        const subject = encodeURIComponent(title || 'Help Request');
        const attachmentList = files.length
            ? `\n\nAttachments (please attach manually):\n` + files.map(f => `- ${f.name} (${Math.round(f.size / 1024)} KB)`).join('\n')
            : '';
        const bodyText = encodeURIComponent(`${body || ''}${attachmentList}`);
        return `mailto:${developerEmail}?subject=${subject}&body=${bodyText}`;
    }, [title, body, files, developerEmail]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files || []);
        setFiles(selected);
    };

    if (!isOpen) return null;

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
                    width: '560px',
                    maxWidth: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 id="help-modal-title" style={{ margin: 0 }}>Help</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                        aria-label="Close help"
                    >
                        ✕
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>Title</span>
                        <input
                            type="text"
                            placeholder="Brief summary of your issue"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d0d7de' }}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>Description</span>
                        <textarea
                            placeholder="What happened? What did you expect? Steps to reproduce?"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={8}
                            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d0d7de', resize: 'vertical' }}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>Attachments</span>
                        <input type="file" multiple onChange={handleFileChange} />
                        {!!files.length && (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {files.map((f) => (
                                    <li key={f.name} style={{ fontSize: 13 }}>
                                        {f.name} ({Math.round(f.size / 1024)} KB)
                                    </li>
                                ))}
                            </ul>
                        )}
                        <span style={{ fontSize: 12, color: '#6a737d' }}>
                            Note: Email clients do not support auto-attaching files via links. Please attach the files manually after the email opens.
                        </span>
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button
                            onClick={onClose}
                            className="button button-secondary"
                        >
                            Cancel
                        </button>
                        <a
                            href={mailtoHref}
                            className="button button-primary"
                            onClick={onClose}
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                        >
                            Send Help Request
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}


