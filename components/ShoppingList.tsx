'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Download } from 'lucide-react';
import type { ShoppingListItemDTO } from '@/lib/types';
import { currentWeekStart } from '@/lib/dates';

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/shopping-list')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setError('Could not load your shopping list.'))
      .finally(() => setLoading(false));
  }, []);

  async function addItem() {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity: quantity || null }),
      });
      if (!res.ok) throw new Error();
      const created: ShoppingListItemDTO = await res.json();
      setItems((prev) => [...prev, created]);
      setName('');
      setQuantity('');
    } catch {
      setError('Could not add that item.');
    }
  }

  async function toggleChecked(item: ShoppingListItemDTO) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
    );
    try {
      await fetch(`/api/shopping-list/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !item.checked }),
      });
    } catch {
      setError('Could not save that change.');
    }
  }

  async function removeItem(id: number) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/shopping-list/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      setError('Could not delete that item.');
    }
  }

  async function pullFromWeek() {
    setPulling(true);
    try {
      const res = await fetch('/api/shopping-list/pull-from-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: currentWeekStart() }),
      });
      if (!res.ok) throw new Error();
      const { added }: { added: ShoppingListItemDTO[] } = await res.json();
      if (added.length === 0) {
        setError("No meals planned for this week yet — nothing to pull in.");
      } else {
        setItems((prev) => [...prev, ...added]);
      }
    } catch {
      setError('Could not pull in this week\'s meals.');
    } finally {
      setPulling(false);
    }
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-ink">Shopping list</h2>
        <button
          onClick={pullFromWeek}
          disabled={pulling}
          className="text-xs text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <Download size={12} />
          {pulling ? 'Pulling in…' : "Pull in this week's meals"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add an item…"
          className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Qty"
          className="w-20 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <button
          onClick={addItem}
          aria-label="Add item"
          className="text-accent hover:text-ink transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-warn mb-3" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink/40 italic">Your list is empty.</p>
      ) : (
        <ul className="space-y-1">
          {unchecked.map((item) => (
            <ShoppingRow
              key={item.id}
              item={item}
              onToggle={() => toggleChecked(item)}
              onDelete={() => removeItem(item.id)}
            />
          ))}
          {checked.length > 0 && (
            <>
              <li className="pt-3 pb-1 px-1 text-xs uppercase tracking-wide text-ink/30">
                Checked off
              </li>
              {checked.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleChecked(item)}
                  onDelete={() => removeItem(item.id)}
                />
              ))}
            </>
          )}
        </ul>
      )}
    </section>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItemDTO;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center gap-2.5 px-1 py-1.5 rounded-sm hover:bg-accentSoft/40 transition-colors">
      <button
        onClick={onToggle}
        aria-label={item.checked ? 'Mark as not checked' : 'Mark as checked'}
        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
          item.checked
            ? 'bg-accent border-accent'
            : 'border-ink/30 hover:border-accent'
        }`}
      >
        {item.checked && <Check size={10} className="text-white" />}
      </button>
      <span
        className={`text-sm flex-1 ${
          item.checked ? 'line-through text-ink/35' : 'text-ink/85'
        }`}
      >
        {item.name}
      </span>
      {item.quantity && (
        <span className="text-xs text-ink/40 flex-shrink-0">{item.quantity}</span>
      )}
      <button
        onClick={onDelete}
        aria-label="Delete item"
        className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}
