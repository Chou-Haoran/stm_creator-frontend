import { useEffect, useState } from 'react';

type ItemId = 'edge' | 'edit' | 'filter' | 'save';
type Item = { id: ItemId; label: string; done: boolean };
const KEY = 'onboarding.checklist.v1';

export function Checklist() {
  const [items] = useState<Item[]>(() => {
    const raw = localStorage.getItem(KEY);
    return raw
      ? JSON.parse(raw)
      : [
          { id: 'edge', label: 'Create an edge', done: false },
          { id: 'edit', label: 'Edit a transition', done: false },
          { id: 'filter', label: 'Apply a filter or preset', done: false },
          { id: 'save', label: 'Save the model', done: false },
        ];
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);

  const toggleItem = (id: ItemId) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  return (
    <div className="stm-ext-card" style={{ width: 260 }}>
      <div className="stm-ext-header"><div className="stm-ext-title">Getting started</div></div>
      <ul style={{ margin: 8 }}>
        {items.map(i => (
          <li key={i.id} style={{ opacity: i.done ? 0.6 : 1 }}>
            <input 
              type="checkbox" 
              checked={i.done} 
              onChange={() => toggleItem(i.id)}
            /> {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
