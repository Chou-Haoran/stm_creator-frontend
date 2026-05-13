import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '../../app/auth/api';
import type { ModelSummary } from '../api/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelListModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelSummary[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`${API_BASE}/models/all`, {
          headers: { 'Accept': 'application/json' },
        });
        if (res.status === 401 || res.status === 403) {
          setError('You do not have permission to list models.');
          setModels([]);
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch models (${res.status})`);
        }
        const data = (await res.json()) as unknown;
        const arr = Array.isArray(data)
          ? data.filter((x): x is ModelSummary =>
              typeof x === 'object' &&
              x !== null &&
              typeof (x as ModelSummary).id === 'number' &&
              typeof (x as ModelSummary).stm_name === 'string',
            )
          : [];
        if (!cancelled) setModels(arr);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed to fetch models');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const goToModel = (name: string) => {
    try { localStorage.setItem('stmCreator.lastModelName', name); } catch {}
    window.location.href = `/editor?model=${encodeURIComponent(name)}`;
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff', borderRadius: 8, padding: 20, width: 520, maxWidth: '92%', maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Open Model</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} aria-label="Close">✖</button>
        </div>

        {loading ? (
          <p style={{ marginTop: 16 }}>Loading…</p>
        ) : error ? (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #ef4444', color: '#7f1d1d', borderRadius: 6 }}>
            {error}
          </div>
        ) : models.length === 0 ? (
          <p style={{ marginTop: 16 }}>No models found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 16, display: 'grid', gap: 8 }}>
            {models.map((model) => (
              <li key={model.id}>
                <button
                  onClick={() => goToModel(model.stm_name)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6,
                    border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer'
                  }}
                >
                  {model.stm_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
