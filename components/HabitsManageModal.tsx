'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { HabitDTO, HabitSection } from '@/lib/types';

type DraftHabit = {
  name: string;
  emoji: string;
  color: string;
  section: HabitSection;
  targetPerWeek: number;
};

const EMPTY_DRAFT: DraftHabit = {
  name: '',
  emoji: '✅',
  color: '#8a7a6b',
  section: 'daily',
  targetPerWeek: 7,
};

export default function ManageHabitsModal({
  habits,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  habits: HabitDTO[];
  onClose: () => void;
  onCreate: (draft: DraftHabit) => Promise<void>;
  onUpdate: (id: number, fields: Partial<DraftHabit>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DraftHabit>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!draft.name.trim()) return;
    try {
      await onCreate(draft);
      setDraft(EMPTY_DRAFT);
    } catch {
      setError('Could not add that habit.');
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-line rounded-sm max-w-lg w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-ink">Manage habits</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink/40 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-warn mb-3" role="alert">
            {error}
          </p>
        )}

        <p className="text-xs text-ink/40 mb-3">
          Drag a habit's name on the main grid to reorder it within its section.
        </p>

        <ul className="space-y-2 mb-5">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center gap-2 border border-line rounded-sm p-2 bg-white/50"
            >
              <input
                value={habit.emoji}
                onChange={(e) => onUpdate(habit.id, { emoji: e.target.value })}
                className="w-8 text-center bg-transparent text-base flex-shrink-0"
                aria-label="Emoji"
              />

              <input
                value={habit.name}
                onChange={(e) => onUpdate(habit.id, { name: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                aria-label="Habit name"
              />

              <input
                type="color"
                value={habit.color}
                onChange={(e) => onUpdate(habit.id, { color: e.target.value })}
                className="w-7 h-7 rounded-sm border border-line flex-shrink-0 cursor-pointer bg-transparent"
                aria-label="Color"
              />

              <select
                value={habit.section}
                onChange={(e) =>
                  onUpdate(habit.id, {
                    section: e.target.value as HabitSection,
                  })
                }
                className="text-xs bg-transparent border border-line rounded-sm px-1 py-1 flex-shrink-0"
                aria-label="Section"
              >
                <option value="daily">Daily</option>
                <option value="devotional">Devotional</option>
              </select>

              <select
                value={habit.targetPerWeek}
                onChange={(e) =>
                  onUpdate(habit.id, {
                    targetPerWeek: Number(e.target.value),
                  })
                }
                className="text-xs bg-transparent border border-line rounded-sm px-1 py-1 flex-shrink-0"
                aria-label="Weekly goal"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}/7
                  </option>
                ))}
              </select>

              <button
                onClick={() => onDelete(habit.id)}
                aria-label="Delete habit"
                className="text-ink/30 hover:text-warn flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-4">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
            Add a habit
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={draft.emoji}
              onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
              placeholder="✅"
              className="w-10 text-center border border-line rounded-sm py-1.5 bg-transparent text-base"
              aria-label="Emoji"
            />
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Habit name"
              className="flex-1 min-w-[120px] border border-line rounded-sm px-2 py-1.5 bg-transparent text-sm placeholder:text-ink/35"
            />
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="w-9 h-9 rounded-sm border border-line cursor-pointer bg-transparent"
              aria-label="Color"
            />
            <select
              value={draft.section}
              onChange={(e) =>
                setDraft({ ...draft, section: e.target.value as HabitSection })
              }
              className="text-xs border border-line rounded-sm px-2 py-1.5 bg-transparent"
            >
              <option value="daily">Daily</option>
              <option value="devotional">Devotional</option>
            </select>
            <select
              value={draft.targetPerWeek}
              onChange={(e) =>
                setDraft({ ...draft, targetPerWeek: Number(e.target.value) })
              }
              className="text-xs border border-line rounded-sm px-2 py-1.5 bg-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}/7
                </option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              aria-label="Add habit"
              className="bg-accent text-white rounded-sm p-2 hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
