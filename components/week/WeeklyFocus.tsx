'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, Target } from 'lucide-react';
import type { FocusAreaDTO } from '@/lib/types';
import { useCelebration } from '@/lib/useCelebration';

export default function WeeklyFocus({ weekStart }: { weekStart: string }) {
  const [areas, setAreas] = useState<FocusAreaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAreaTitle, setNewAreaTitle] = useState('');
  const [goalDrafts, setGoalDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const celebrate = useCelebration();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/focus-areas?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then(setAreas)
      .catch(() => setError('Could not load focus areas.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function addArea() {
    const title = newAreaTitle.trim();
    if (!title) return;
    setNewAreaTitle('');
    try {
      const res = await fetch('/api/focus-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, weekStart }),
      });
      if (!res.ok) throw new Error();
      const created: FocusAreaDTO = await res.json();
      setAreas((prev) => [...prev, created]);
    } catch {
      setError('Could not add that focus area.');
    }
  }

  async function removeArea(id: number) {
    const prev = areas;
    setAreas((p) => p.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/focus-areas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setAreas(prev);
      setError('Could not delete that focus area.');
    }
  }

  async function addGoal(areaId: number) {
    const title = (goalDrafts[areaId] ?? '').trim();
    if (!title) return;
    setGoalDrafts((prev) => ({ ...prev, [areaId]: '' }));
    try {
      const res = await fetch(`/api/focus-areas/${areaId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setAreas((prev) =>
        prev.map((a) =>
          a.id === areaId ? { ...a, goals: [...a.goals, created] } : a
        )
      );
    } catch {
      setError('Could not add that goal.');
    }
  }

  async function toggleGoal(
    areaId: number,
    goalId: number,
    done: boolean,
    e: React.MouseEvent
  ) {
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? {
              ...a,
              goals: a.goals.map((g) =>
                g.id === goalId ? { ...g, done } : g
              ),
            }
          : a
      )
    );
    if (done) celebrate(e);
    try {
      const res = await fetch(`/api/focus-goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not save that change.');
    }
  }

  async function removeGoal(areaId: number, goalId: number) {
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, goals: a.goals.filter((g) => g.id !== goalId) }
          : a
      )
    );
    try {
      await fetch(`/api/focus-goals/${goalId}`, { method: 'DELETE' });
    } catch {
      setError('Could not delete that goal.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
        <Target size={16} className="text-accent" />
        Weekly focus
      </h3>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : (
        <div className="space-y-4">
          {areas.map((area) => (
            <div key={area.id} className="border border-line rounded-sm p-3">
              <div className="flex items-center justify-between mb-2 group">
                <span className="text-sm font-medium text-ink">
                  {area.title}
                </span>
                <button
                  onClick={() => removeArea(area.id)}
                  aria-label="Delete focus area"
                  className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <ul className="space-y-1 mb-2">
                {area.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="group flex items-center gap-2 px-1 py-1 rounded-sm hover:bg-accentSoft/40 transition-colors"
                  >
                    <button
                      onClick={(e) => toggleGoal(area.id, goal.id, !goal.done, e)}
                      aria-label={goal.done ? 'Mark as not done' : 'Mark as done'}
                      className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                        goal.done
                          ? 'bg-accent border-accent'
                          : 'border-ink/30 hover:border-accent'
                      }`}
                    >
                      {goal.done && <Check size={8} className="text-white" />}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        goal.done ? 'line-through text-ink/35' : 'text-ink/80'
                      }`}
                    >
                      {goal.title}
                    </span>
                    <button
                      onClick={() => removeGoal(area.id, goal.id)}
                      aria-label="Delete goal"
                      className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex gap-1.5">
                <input
                  value={goalDrafts[area.id] ?? ''}
                  onChange={(e) =>
                    setGoalDrafts((prev) => ({
                      ...prev,
                      [area.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && addGoal(area.id)}
                  placeholder="Add a goal…"
                  className="flex-1 bg-transparent border-b border-line pb-1 text-xs placeholder:text-ink/35 focus:border-accent transition-colors"
                />
                <button
                  onClick={() => addGoal(area.id)}
                  aria-label="Add goal"
                  className="text-accent hover:text-ink transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={newAreaTitle}
              onChange={(e) => setNewAreaTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addArea()}
              placeholder="New focus area (e.g. Health, Work)…"
              className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
            />
            <button
              onClick={addArea}
              aria-label="Add focus area"
              className="text-accent hover:text-ink transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
