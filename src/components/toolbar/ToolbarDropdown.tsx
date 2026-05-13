import { useEffect, useRef } from 'react';
import type React from 'react';

interface ToolbarDropdownProps {
  label: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function ToolbarDropdown({
  label,
  icon,
  isOpen,
  onToggle,
  children,
  disabled = false,
}: ToolbarDropdownProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="tb-dropdown-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`tb-btn tb-dropdown-trigger ${isOpen ? 'active open' : ''}`}
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {icon}
        <span>{label}</span>
        <svg className="tb-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="tb-dropdown-panel" role="menu">
          {children}
        </div>
      )}
    </div>
  );
}
