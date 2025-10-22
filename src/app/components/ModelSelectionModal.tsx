import { useState, useEffect } from 'react';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreateNew: (modelName: string) => void;
  readonly onLoadExisting: (modelName: string) => void;
}

export function ModelSelectionModal({ isOpen, onClose, onCreateNew, onLoadExisting }: Props) {
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Add ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCreateNew = () => {
    if (!modelName.trim()) {
      setError('Please enter model name');
      return;
    }
    onCreateNew(modelName.trim());
    setModelName('');
    setError(null);
  };

  const handleLoadExisting = () => {
    if (!modelName.trim()) {
      setError('Please enter model name');
      return;
    }
    onLoadExisting(modelName.trim());
    setModelName('');
    setError(null);
  };

  const handleClose = () => {
    setModelName('');
    setError(null);
    onClose();
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1200,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxWidth: '90%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          border: 'none',
          margin: 0,
        }}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="model-selection-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 id="model-selection-title" style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#064e3b' }}>Select Model</h2>
          <button 
            onClick={handleClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 18, 
              cursor: 'pointer',
              color: '#065f46',
              padding: 4
            }} 
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <p style={{ margin: '0 0 20px 0', color: '#065f46', fontSize: 14 }}>
          Please choose whether to create a new model or load an existing model
        </p>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="model-name-input" style={{ 
            display: 'block', 
            color: '#065f46', 
            marginBottom: 8, 
            fontSize: 14, 
            fontWeight: 500 
          }}>
            Model Name
          </label>
          <input
            id="model-name-input"
            type="text"
            value={modelName}
            onChange={(e) => {
              setModelName(e.target.value);
              setError(null);
            }}
            placeholder="Enter model name..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #F0D9A6',
              background: '#ffffff',
              color: '#065f46',
              outline: 'none',
              fontSize: 14,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNew();
              }
            }}
          />
          {error && (
            <div style={{ 
              marginTop: 8, 
              padding: 8, 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#dc2626', 
              borderRadius: 6, 
              fontSize: 12 
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              color: '#065f46',
              border: '1px solid #F0D9A6',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLoadExisting}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #CDAE6B, #A6812D)',
              color: '#2f2819',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Load Existing Model
          </button>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Create New Model
          </button>
        </div>
      </div>
    </div>
  );
}
