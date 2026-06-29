'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { DailyTodoDTO } from '@/lib/types';
import { useCelebration } from '@/lib/useCelebration';

export default function DailyTodoList() {
  const [todos, setTodos] = useState<DailyTodoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const celebrate = useCelebration();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetch('/api/daily-todos')
      .then((r) => r.json())
      .then(setTodos)
      .catch(() => setError('Could not load today\u2019s to-dos.'))
      .finally(() => setLoading(false));
  }, []);

  async function addTodo() {
    const title = draft.trim();
    if (!title) return;
    setDraft('');

    const tempId = -Date.now();
    const optimistic: DailyTodoDTO = {
      id: tempId,
      date: '',
      title,
      done: false,
      position: 0,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, optimistic]);

    try {
      const res = await fetch('/api/daily-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created: DailyTodoDTO = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      setError('Could not add that to-do.');
    }
  }

  async function toggle(todo: DailyTodoDTO, e: React.MouseEvent) {
    const next = !todo.done;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: next } : t))
    );
    if (next) celebrate(e);

    try {
      const res = await fetch(`/api/daily-todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t))
      );
      setError('Could not save that change.');
    }
  }

  async function remove(id: number) {
    const prev = todos;
    setTodos((p) => p.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/daily-todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setTodos(prev);
      setError('Could not delete that to-do.');
    }
  }

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5 max-w-xl mx-auto">
      <div className="mb-4">
        <h2 className="font-serif text-xl text-ink">Today</h2>
        <p className="text-xs text-ink/40 mt-0.5">{today} — clears out tomorrow</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs doing today?"
          className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <button
          onClick={addTodo}
          aria-label="Add to-do"
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
      ) : todos.length === 0 ? (
        <p className="text-sm text-ink/40 italic">
          Nothing on today's list yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {open.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={(e) => toggle(todo, e)}
              onDelete={() => remove(todo.id)}
            />
          ))}
          {done.length > 0 && (
            <>
              <li className="pt-3 pb-1 px-1 text-xs uppercase tracking-wide text-ink/30">
                Done
              </li>
              {done.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={(e) => toggle(todo, e)}
                  onDelete={() => remove(todo.id)}
                />
              ))}
            </>
          )}
        </ul>
      )}
    </section>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: DailyTodoDTO;
  onToggle: (e: React.MouseEvent) => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center gap-2.5 px-1 py-1.5 rounded-sm hover:bg-accentSoft/40 transition-colors">
      <button
        onClick={onToggle}
        aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
          todo.done
            ? 'bg-accent border-accent'
            : 'border-ink/30 hover:border-accent'
        }`}
      >
        {todo.done && <Check size={10} className="text-white" />}
      </button>
      <span
        className={`text-sm flex-1 ${
          todo.done ? 'line-through text-ink/35' : 'text-ink/85'
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={onDelete}
        aria-label="Delete to-do"
        className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}
