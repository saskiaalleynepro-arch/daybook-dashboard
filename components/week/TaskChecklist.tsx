'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { WeekTaskDTO } from '@/lib/types';
import { useCelebration } from '@/lib/useCelebration';

export default function TaskChecklist({ weekStart }: { weekStart: string }) {
  const [tasks, setTasks] = useState<WeekTaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const celebrate = useCelebration();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/week-tasks?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setError('Could not load tasks.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function addTask() {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    try {
      const res = await fetch('/api/week-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, weekStart }),
      });
      if (!res.ok) throw new Error();
      const created: WeekTaskDTO = await res.json();
      setTasks((prev) => [...prev, created]);
    } catch {
      setError('Could not add that task.');
    }
  }

  async function toggle(task: WeekTaskDTO, e: React.MouseEvent) {
    const next = !task.done;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: next } : t))
    );
    if (next) celebrate(e);

    try {
      const res = await fetch(`/api/week-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
      setError('Could not save that change.');
    }
  }

  async function remove(id: number) {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/week-tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
      setError('Could not delete that task.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3">This week's tasks</h3>

      <div className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task for this week…"
          className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <button
          onClick={addTask}
          aria-label="Add task"
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
      ) : tasks.length === 0 ? (
        <p className="text-sm text-ink/40 italic">Nothing planned yet.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-2.5 px-1 py-1.5 rounded-sm hover:bg-accentSoft/40 transition-colors"
            >
              <button
                onClick={(e) => toggle(task, e)}
                aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
                className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  task.done
                    ? 'bg-accent border-accent'
                    : 'border-ink/30 hover:border-accent'
                }`}
              >
                {task.done && <Check size={10} className="text-white" />}
              </button>
              <span
                className={`text-sm flex-1 ${
                  task.done ? 'line-through text-ink/35' : 'text-ink/85'
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => remove(task.id)}
                aria-label="Delete task"
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
