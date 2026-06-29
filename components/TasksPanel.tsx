'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, Flag } from 'lucide-react';
import type { TaskDTO, Priority } from '@/lib/types';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'text-ink/40',
  medium: 'text-accent',
  high: 'text-warn',
};

function isOverdue(dueDate: string | null, done: boolean): boolean {
  if (!dueDate || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setError('Could not load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  async function addTask() {
    const title = draft.trim();
    if (!title) return;
    setDraft('');

    const tempId = -Date.now();
    const optimistic: TaskDTO = {
      id: tempId,
      title,
      description: null,
      done: false,
      priority,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority }),
      });
      if (!res.ok) throw new Error();
      const created: TaskDTO = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setError('Could not add that task. Try again.');
    }
  }

  async function toggleDone(task: TaskDTO) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
      setError('Could not update that task.');
    }
  }

  async function removeTask(id: number) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prevTasks);
      setError('Could not delete that task.');
    }
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-xl text-ink">Tasks</h2>
        <span className="text-xs text-ink/40">
          {open.length} open
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          className="flex-1 bg-transparent border-b border-line pb-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="Priority"
          className="text-xs bg-transparent border-b border-line pb-1.5 text-ink/60 focus:border-accent"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={addTask}
          aria-label="Add task"
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
      ) : tasks.length === 0 ? (
        <p className="text-sm text-ink/40 italic">
          Nothing on the list yet. Add the first thing.
        </p>
      ) : (
        <ul className="space-y-1 overflow-y-auto flex-1 -mx-1">
          {open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleDone(task)}
              onDelete={() => removeTask(task.id)}
            />
          ))}
          {done.length > 0 && (
            <>
              <li className="pt-3 pb-1 px-1 text-xs uppercase tracking-wide text-ink/30">
                Done
              </li>
              {done.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleDone(task)}
                  onDelete={() => removeTask(task.id)}
                />
              ))}
            </>
          )}
        </ul>
      )}
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskDTO;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task.dueDate, task.done);
  return (
    <li className="group flex items-center gap-2.5 px-1 py-1.5 rounded-sm hover:bg-accentSoft/40 transition-colors">
      <button
        onClick={onToggle}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
          task.done
            ? 'bg-accent border-accent'
            : 'border-ink/30 hover:border-accent'
        }`}
      >
        {task.done && <Check size={10} className="text-white" />}
      </button>
      <Flag
        size={12}
        className={`flex-shrink-0 ${PRIORITY_STYLES[task.priority]} ${task.done ? 'opacity-30' : ''}`}
        fill="currentColor"
      />
      <span
        className={`text-sm flex-1 truncate ${
          task.done ? 'line-through text-ink/35' : 'text-ink/85'
        }`}
      >
        {task.title}
      </span>
      {overdue && (
        <span className="text-[10px] text-warn uppercase tracking-wide flex-shrink-0">
          overdue
        </span>
      )}
      <button
        onClick={onDelete}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}
