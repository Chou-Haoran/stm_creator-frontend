import { useEffect } from 'react';

export type CanvasContextTarget = 'state' | 'transition';

export interface CanvasContextMenuState {
    readonly x: number;
    readonly y: number;
    readonly target: CanvasContextTarget;
}

interface Props {
    readonly menu: CanvasContextMenuState | null;
    readonly onClose: () => void;
    readonly onEdit: () => void;
    readonly onDelete: () => void;
    /** Optional: start creating a transition from this state node. */
    readonly onAddTransition?: () => void;
}

// Floating right-click context menu shown on top of the canvas.
// Renders with two actions ("Edit" / "Delete") for either a state node or a
// transition edge. Dismisses on click-away or Escape.
export function CanvasContextMenu({ menu, onClose, onEdit, onDelete, onAddTransition }: Props) {
    useEffect(() => {
        if (!menu) {
            return;
        }
        const handleMouseDown = () => onClose();
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        // Use a microtask delay so the same click that opened the menu
        // doesn't immediately close it.
        const timer = window.setTimeout(() => {
            window.addEventListener('mousedown', handleMouseDown);
        }, 0);
        window.addEventListener('keydown', handleKey);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKey);
        };
    }, [menu, onClose]);

    if (!menu) {
        return null;
    }

    const label = menu.target === 'state' ? 'state' : 'transition';

    return (
        <div
            role="menu"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: 'fixed',
                top: menu.y,
                left: menu.x,
                zIndex: 2000,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                padding: 4,
                minWidth: 160,
                fontSize: 13,
            }}
        >
            {menu.target === 'state' && onAddTransition && (
                <button
                    type="button"
                    onClick={() => {
                        onAddTransition();
                        onClose();
                    }}
                    style={menuButtonStyle}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                >
                    Add transition
                </button>
            )}
            <button
                type="button"
                onClick={() => {
                    onEdit();
                    onClose();
                }}
                style={menuButtonStyle}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
            >
                Edit {label}
            </button>
            <button
                type="button"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                style={{ ...menuButtonStyle, color: '#b91c1c' }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
            >
                Delete {label}
            </button>
            <div style={menuDividerStyle} />
            <button
                type="button"
                onClick={onClose}
                style={menuButtonStyle}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
            >
                Close
            </button>
        </div>
    );
}

const menuButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '6px 10px',
    border: 'none',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
};

const menuDividerStyle: React.CSSProperties = {
    height: 1,
    background: '#e5e7eb',
    margin: '4px 0',
};
