'use client';

import { useEffect, useState } from 'react';
import { Plus, Pin, Trash2 } from 'lucide-react';
import type { NoteDTO } from '@/lib/types';

export default function NotesPanel() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data: NoteDTO[]) => {
        setNotes(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(() => setError('Could not load notes.'))
      .finally(() => setLoading(false));
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  async function addNote() {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled note', content: '' }),
      });
      if (!res.ok) throw new Error();
      const created: NoteDTO = await res.json();
      setNotes((prev) => [created, ...prev]);
      setActiveId(created.id);
    } catch {
      setError('Could not create a note.');
    }
  }

  // Debounced-ish save: update local state immediately, push to API,
  // but only after the user pauses (handled via onBlur rather than every keystroke
  // to avoid a request per character).
  function updateLocal(id: number, fields: Partial<NoteDTO>) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...fields } : n))
    );
  }

  async function persist(id: number, fields: Partial<NoteDTO>) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not save that change.');
    }
  }

  async function togglePin(note: NoteDTO) {
    updateLocal(note.id, { pinned: !note.pinned });
    await persist(note.id, { pinned: !note.pinned });
    setNotes((prev) =>
      [...prev].sort((a, b) => Number(b.pinned) - Number(a.pinned))
    );
  }

  async function removeNote(id: number) {
    const prev = notes;
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setNotes(prev);
      setError('Could not delete that note.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-xl text-ink">Notes</h2>
        <button
          onClick={addNote}
          aria-label="Add note"
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
      ) : notes.length === 0 ? (
        <p className="text-sm text-ink/40 italic">
          No notes yet. Jot something down.
        </p>
      ) : (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <ul className="flex gap-1.5 overflow-x-auto pb-1 flex-shrink-0">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  onClick={() => setActiveId(note.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 ${
                    note.id === activeId
                      ? 'bg-accent text-white border-accent'
                      : 'border-line text-ink/60 hover:border-accent/50'
                  }`}
                >
                  {note.pinned && <Pin size={9} />}
                  {note.title || 'Untitled note'}
                </button>
              </li>
            ))}
          </ul>

          {active && (
            <div className="flex flex-col flex-1 min-h-0 border-t border-line pt-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={active.title}
                  onChange={(e) =>
                    updateLocal(active.id, { title: e.target.value })
                  }
                  onBlur={(e) =>
                    persist(active.id, { title: e.target.value })
                  }
                  placeholder="Note title"
                  className="flex-1 bg-transparent font-medium text-sm focus:outline-none placeholder:text-ink/35"
                />
                <button
                  onClick={() => togglePin(active)}
                  aria-label={active.pinned ? 'Unpin note' : 'Pin note'}
                  className={active.pinned ? 'text-accent' : 'text-ink/30 hover:text-accent'}
                >
                  <Pin size={14} fill={active.pinned ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => removeNote(active.id)}
                  aria-label="Delete note"
                  className="text-ink/30 hover:text-warn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={active.content}
                onChange={(e) =>
                  updateLocal(active.id, { content: e.target.value })
                }
                onBlur={(e) =>
                  persist(active.id, { content: e.target.value })
                }
                placeholder="Write something…"
                className="flex-1 w-full resize-none bg-transparent text-sm text-ink/80 leading-relaxed focus:outline-none placeholder:text-ink/35"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
