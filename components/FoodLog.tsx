'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Utensils } from 'lucide-react';
import type { FoodLogEntryDTO } from '@/lib/types';
import { todayKey } from '@/lib/dates';

export default function FoodLog() {
  const [entries, setEntries] = useState<FoodLogEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = todayKey();

  useEffect(() => {
    fetch(`/api/food-log?date=${today}`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setError('Could not load your food log.'))
      .finally(() => setLoading(false));
  }, [today]);

  async function addEntry() {
    if (!description.trim()) return;
    try {
      const res = await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          description,
          calories: calories ? Number(calories) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created: FoodLogEntryDTO = await res.json();
      setEntries((prev) => [...prev, created]);
      setDescription('');
      setCalories('');
    } catch {
      setError('Could not add that entry.');
    }
  }

  async function removeEntry(id: number) {
    const prev = entries;
    setEntries((p) => p.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/food-log/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setEntries(prev);
      setError('Could not delete that entry.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
        <Utensils size={16} className="text-accent" />
        Today's food log
      </h3>

      <div className="flex gap-2 mb-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          placeholder="What did you eat?"
          className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          placeholder="Cal"
          className="w-16 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <button
          onClick={addEntry}
          aria-label="Add entry"
          className="text-accent hover:text-ink transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink/40 italic">Nothing logged yet today.</p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center gap-2.5 px-1 py-1.5 rounded-sm hover:bg-accentSoft/40 transition-colors"
            >
              <span className="text-sm text-ink/85 flex-1">
                {entry.description}
              </span>
              {entry.calories != null && (
                <span className="text-xs text-ink/40 flex-shrink-0">
                  {entry.calories} cal
                </span>
              )}
              <button
                onClick={() => removeEntry(entry.id)}
                aria-label="Delete entry"
                className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
