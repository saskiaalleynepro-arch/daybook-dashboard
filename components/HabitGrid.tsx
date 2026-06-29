'use client';

import { useEffect, useState } from 'react';
import { Check, Settings, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { HabitDTO, HabitsResponse } from '@/lib/types';
import { currentWeekStart, weekLabel, shiftWeek } from '@/lib/dates';
import { readableTextColor, lightenHex } from '@/lib/colors';
import { useCelebration } from '@/lib/useCelebration';
import { useReorderable } from '@/lib/useReorderable';
import ManageHabitsModal from './HabitsManageModal';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HabitGrid() {
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const celebrate = useCelebration();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/habits?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((data: HabitsResponse) => {
        setHabits(data.habits);
        setOverallScore(data.overallScore);
      })
      .catch(() => setError('Could not load habits.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function toggleCell(habit: HabitDTO, date: string, e: React.MouseEvent) {
    const wasDone = habit.days.find((d) => d.date === date)?.done ?? false;
    const next = !wasDone;

    setHabits((prev) =>
      prev.map((h) =>
        h.id !== habit.id
          ? h
          : {
              ...h,
              days: h.days.map((d) =>
                d.date === date ? { ...d, done: next } : d
              ),
              completedThisWeek: h.completedThisWeek + (next ? 1 : -1),
            }
      )
    );
    if (next) celebrate(e);

    try {
      const res = await fetch(`/api/habits/${habit.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setHabits((prev) =>
        prev.map((h) =>
          h.id !== habit.id
            ? h
            : {
                ...h,
                days: h.days.map((d) =>
                  d.date === date ? { ...d, done: wasDone } : d
                ),
                completedThisWeek: h.completedThisWeek + (wasDone ? 1 : -1),
              }
        )
      );
      setError('Could not save that change.');
    }
  }

  async function refetch() {
    const res = await fetch(`/api/habits?weekStart=${weekStart}`);
    const data: HabitsResponse = await res.json();
    setHabits(data.habits);
    setOverallScore(data.overallScore);
  }

  async function createHabit(draft: {
    name: string;
    emoji: string;
    color: string;
    section: 'daily' | 'devotional';
    targetPerWeek: number;
  }) {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error();
    await refetch();
  }

  async function updateHabit(
    id: number,
    fields: Partial<
      Pick<HabitDTO, 'name' | 'emoji' | 'color' | 'section' | 'targetPerWeek'>
    >
  ) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...fields } : h))
    );
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error();
  }

  async function deleteHabit(id: number) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
  }

  /** Reorders one section (daily or devotional) using the new order of ids
   *  within that section only, then writes new global `position` values
   *  for the full habit list — the other section's relative order among
   *  itself is preserved, only this section's slice changes. */
  async function reorderSection(
    sectionHabits: HabitDTO[],
    newSectionOrderIds: number[]
  ) {
    const sectionIdSet = new Set(sectionHabits.map((h) => h.id));
    const reorderedSection = newSectionOrderIds
      .map((id) => sectionHabits.find((h) => h.id === id)!)
      .filter(Boolean);

    // Rebuild the full list: walk the existing global order, and every
    // time we hit a habit from this section, pull the next one from the
    // newly-ordered section list instead — keeps the other section's
    // habits exactly where they were, interleaved or not.
    let sectionCursor = 0;
    const newFullOrder = habits.map((h) =>
      sectionIdSet.has(h.id) ? reorderedSection[sectionCursor++] : h
    );

    setHabits(newFullOrder);
    const res = await fetch('/api/habits/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: newFullOrder.map((h) => h.id) }),
    });
    if (!res.ok) throw new Error();
  }

  const dailyHabits = habits.filter((h) => h.section === 'daily');
  const devotionalHabits = habits.filter((h) => h.section === 'devotional');

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-serif text-xl text-ink">Habits</h2>
        <button
          onClick={() => setManageOpen(true)}
          aria-label="Manage habits"
          className="text-ink/40 hover:text-ink transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
            aria-label="Previous week"
            className="text-ink/40 hover:text-ink"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-ink/50">{weekLabel(weekStart)}</span>
          <button
            onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
            aria-label="Next week"
            className="text-ink/40 hover:text-ink"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl text-accent leading-none">
            {overallScore}%
          </span>
          <p className="text-[10px] text-ink/40 -mt-0.5">this week</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-warn mb-3" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="text-sm text-ink/40 italic">
          No habits yet.{' '}
          <button
            onClick={() => setManageOpen(true)}
            className="text-accent hover:underline"
          >
            Add your first one.
          </button>
        </p>
      ) : (
        <div className="space-y-5">
          {dailyHabits.length > 0 && (
            <HabitSection
              title="Daily"
              habits={dailyHabits}
              onToggle={toggleCell}
              onReorder={(ids) => reorderSection(dailyHabits, ids)}
            />
          )}
          {devotionalHabits.length > 0 && (
            <HabitSection
              title="Devotional"
              habits={devotionalHabits}
              onToggle={toggleCell}
              onReorder={(ids) => reorderSection(devotionalHabits, ids)}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-line">
            {habits.map((h) => {
              const pct = Math.round(
                (h.completedThisWeek / h.targetPerWeek) * 100
              );
              return (
                <div
                  key={h.id}
                  className="rounded-sm p-2 text-xs"
                  style={{ backgroundColor: lightenHex(h.color, 0.85) }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate">
                      {h.emoji} {h.name}
                    </span>
                    <span
                      className="font-medium flex-shrink-0 ml-1"
                      style={{ color: h.color }}
                    >
                      {Math.min(pct, 100)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/70 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: h.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {manageOpen && (
        <ManageHabitsModal
          habits={habits}
          onClose={() => setManageOpen(false)}
          onCreate={createHabit}
          onUpdate={updateHabit}
          onDelete={deleteHabit}
        />
      )}
    </section>
  );
}

function HabitSection({
  title,
  habits,
  onToggle,
  onReorder,
}: {
  title: string;
  habits: HabitDTO[];
  onToggle: (habit: HabitDTO, date: string, e: React.MouseEvent) => void;
  onReorder: (orderedIds: number[]) => void;
}) {
  const { order, getHandleProps, getRowProps } = useReorderable(habits, onReorder);

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
        {title}
      </p>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-[1.1rem_minmax(5rem,1fr)_repeat(7,1.6rem)] gap-x-1 gap-y-1.5 items-center min-w-[19rem]">
          <span />
          <span />
          {DAY_LETTERS.map((d, i) => (
            <span
              key={i}
              className="text-[10px] text-center text-ink/35 font-medium"
            >
              {d}
            </span>
          ))}

          {order.map((habit) => (
            <FragmentRow
              key={habit.id}
              habit={habit}
              onToggle={onToggle}
              handleProps={getHandleProps(habit.id)}
              rowProps={getRowProps(habit.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  habit,
  onToggle,
  handleProps,
  rowProps,
}: {
  habit: HabitDTO;
  onToggle: (habit: HabitDTO, date: string, e: React.MouseEvent) => void;
  handleProps: ReturnType<ReturnType<typeof useReorderable>['getHandleProps']>;
  rowProps: ReturnType<ReturnType<typeof useReorderable>['getRowProps']>;
}) {
  const textColor = readableTextColor(habit.color);
  const offColor = lightenHex(habit.color, 0.85);

  return (
    <div {...rowProps} className="contents">
      <span
        {...handleProps}
        className="text-ink/25 hover:text-ink/50 flex items-center justify-center"
        aria-label={`Drag to reorder ${habit.name}`}
      >
        <GripVertical size={13} />
      </span>
      <span className="text-xs text-ink/75 truncate flex items-center gap-1">
        <span>{habit.emoji}</span>
        <span className="truncate">{habit.name}</span>
      </span>
      {habit.days.map((day) => (
        <button
          key={day.date}
          onClick={(e) => onToggle(habit, day.date, e)}
          aria-label={`${habit.name} on ${day.date}`}
          className="w-6 h-6 rounded-sm flex items-center justify-center transition-transform hover:scale-105"
          style={{
            backgroundColor: day.done ? habit.color : offColor,
          }}
        >
          {day.done && <Check size={12} style={{ color: textColor }} />}
        </button>
      ))}
    </div>
  );
}
