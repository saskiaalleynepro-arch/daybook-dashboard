'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Dumbbell, ChevronDown, Star, GripVertical, Timer, Check } from 'lucide-react';
import type { GymSessionDTO, GymExerciseDTO } from '@/lib/types';
import { daysInWeek, weekLabel } from '@/lib/dates';
import { useCelebration } from '@/lib/useCelebration';
import { useReorderable } from '@/lib/useReorderable';
import { useCountdown } from '@/lib/useCountdown';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function GymTracker({ weekStart }: { weekStart: string }) {
  const [sessions, setSessions] = useState<Record<string, GymSessionDTO>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const celebrate = useCelebration();
  const days = daysInWeek(weekStart);

  const [copiedNotice, setCopiedNotice] = useState(false);
  const [templateWeek, setTemplateWeek] = useState<string | null>(null);
  const isTemplateWeek = templateWeek === weekStart;

  useEffect(() => {
    fetch('/api/gym/template')
      .then((r) => r.json())
      .then((d: { templateWeek: string | null }) => setTemplateWeek(d.templateWeek))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCopiedNotice(false);

    async function load() {
      const res = await fetch(`/api/gym?weekStart=${weekStart}`);
      const data: GymSessionDTO[] = await res.json();

      if (data.length === 0) {
        // Empty week — try applying the standing template (if one is set)
        // as a starting point before showing the (now possibly populated)
        // week. No-ops cleanly if there's no template or it's empty.
        try {
          const applyRes = await fetch('/api/gym/apply-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weekStart }),
          });
          const applyData = await applyRes.json();
          if (applyRes.ok && applyData.copied > 0) {
            const refetched = await fetch(`/api/gym?weekStart=${weekStart}`);
            const refetchedData: GymSessionDTO[] = await refetched.json();
            if (!cancelled) {
              const byDate: Record<string, GymSessionDTO> = {};
              for (const s of refetchedData) byDate[s.date] = s;
              setSessions(byDate);
              setCopiedNotice(true);
            }
            return;
          }
        } catch {
          // If applying the template fails, just fall through to showing
          // the empty week — not worth blocking the view over.
        }
      }

      if (!cancelled) {
        const byDate: Record<string, GymSessionDTO> = {};
        for (const s of data) byDate[s.date] = s;
        setSessions(byDate);
      }
    }

    load()
      .catch(() => !cancelled && setError('Could not load gym sessions.'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  async function setAsTemplate() {
    try {
      const res = await fetch('/api/gym/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart }),
      });
      if (!res.ok) throw new Error();
      setTemplateWeek(weekStart);
    } catch {
      setError('Could not set this week as the template.');
    }
  }

  async function forceApplyTemplate() {
    const confirmed = window.confirm(
      'This will replace everything currently in this week\'s gym tracker with your template. This cannot be undone. Continue?'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/gym/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, force: true }),
      });
      if (!res.ok) throw new Error();
      const refetched = await fetch(`/api/gym?weekStart=${weekStart}`);
      const data: GymSessionDTO[] = await refetched.json();
      const byDate: Record<string, GymSessionDTO> = {};
      for (const s of data) byDate[s.date] = s;
      setSessions(byDate);
      setCopiedNotice(true);
    } catch {
      setError('Could not re-apply the template to this week.');
    }
  }

  async function ensureSession(date: string): Promise<GymSessionDTO> {
    if (sessions[date]) return sessions[date];
    const res = await fetch('/api/gym', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, date, went: false }),
    });
    const created: GymSessionDTO = await res.json();
    setSessions((prev) => ({ ...prev, [date]: created }));
    return created;
  }

  async function toggleWent(date: string, e: React.MouseEvent) {
    try {
      const session = await ensureSession(date);
      const next = !session.went;
      setSessions((prev) => ({
        ...prev,
        [date]: { ...prev[date], went: next },
      }));
      if (next) {
        celebrate(e);
        setExpanded(date);
      }
      const res = await fetch(`/api/gym/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ went: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not update that session.');
    }
  }

  async function setWorkoutType(date: string, workoutType: string) {
    setSessions((prev) => ({
      ...prev,
      [date]: { ...prev[date], workoutType },
    }));
    try {
      const session = await ensureSession(date);
      await fetch(`/api/gym/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutType }),
      });
    } catch {
      setError('Could not save workout type.');
    }
  }

  async function addExercise(date: string) {
    try {
      const session = await ensureSession(date);
      const res = await fetch(`/api/gym/${session.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New exercise' }),
      });
      if (!res.ok) throw new Error();
      const created: GymExerciseDTO = await res.json();
      setSessions((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          exercises: [...(prev[date]?.exercises ?? []), created],
        },
      }));
    } catch {
      setError('Could not add exercise.');
    }
  }

  async function updateExercise(
    date: string,
    exerciseId: number,
    fields: Partial<GymExerciseDTO>
  ) {
    setSessions((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        exercises: prev[date].exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, ...fields } : ex
        ),
      },
    }));
    try {
      await fetch(`/api/gym-exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
    } catch {
      setError('Could not save that exercise.');
    }
  }

  async function removeExercise(date: string, exerciseId: number) {
    setSessions((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        exercises: prev[date].exercises.filter((ex) => ex.id !== exerciseId),
      },
    }));
    try {
      await fetch(`/api/gym-exercises/${exerciseId}`, { method: 'DELETE' });
    } catch {
      setError('Could not delete exercise.');
    }
  }

  async function reorderExercises(
    date: string,
    sessionId: number,
    orderedIds: number[]
  ) {
    setSessions((prev) => {
      const byId = new Map(prev[date].exercises.map((ex) => [ex.id, ex]));
      return {
        ...prev,
        [date]: {
          ...prev[date],
          exercises: orderedIds.map((id) => byId.get(id)!).filter(Boolean),
        },
      };
    });
    try {
      const res = await fetch(`/api/gym/${sessionId}/exercises/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not save the new exercise order.');
    }
  }

  const wentCount = days.filter((d) => sessions[d]?.went).length;

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-serif text-lg text-ink flex items-center gap-1.5">
          Gym
          {isTemplateWeek && (
            <span
              title="This week is your standing routine template"
              className="text-accent"
            >
              <Star size={12} fill="currentColor" />
            </span>
          )}
        </h3>
        <span className="text-xs text-ink/40">{wentCount}/7 days</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        {isTemplateWeek ? (
          <p className="text-xs text-accent">
            This is your template — every empty future week starts from here.
          </p>
        ) : (
          <button
            onClick={setAsTemplate}
            className="text-xs text-ink/40 hover:text-accent transition-colors flex items-center gap-1"
          >
            <Star size={11} /> Set as routine template
          </button>
        )}
        {templateWeek && !isTemplateWeek && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink/30">
              Template: {weekLabel(templateWeek)}
            </span>
            <button
              onClick={forceApplyTemplate}
              className="text-[10px] text-ink/40 hover:text-warn underline"
            >
              Replace this week with template
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {copiedNotice && (
        <p className="text-xs text-accent mb-2">
          Copied your routine template in as a starting point — edit freely.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : (
        <ul className="space-y-1.5">
          {days.map((date, i) => {
            const session = sessions[date];
            const went = session?.went ?? false;
            const isExpanded = expanded === date;

            return (
              <li key={date} className="border border-line rounded-sm">
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <button
                    onClick={(e) => toggleWent(date, e)}
                    aria-label={went ? 'Mark as rest day' : 'Mark as went'}
                    className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                      went
                        ? 'bg-accent border-accent text-white'
                        : 'border-ink/25 text-ink/30 hover:border-accent'
                    }`}
                  >
                    <Dumbbell size={13} />
                  </button>
                  <span className="text-xs text-ink/50 w-9 flex-shrink-0">
                    {DAY_LABELS[i]}
                  </span>
                  <input
                    value={session?.workoutType ?? ''}
                    onChange={(e) => setWorkoutType(date, e.target.value)}
                    placeholder={went ? 'Workout type…' : 'Rest day'}
                    disabled={!went}
                    className="flex-1 bg-transparent text-sm placeholder:text-ink/35 disabled:placeholder:text-ink/20 focus:outline-none"
                  />
                  {went && (
                    <button
                      onClick={() =>
                        setExpanded(isExpanded ? null : date)
                      }
                      aria-label="Toggle exercise details"
                      className={`text-ink/40 hover:text-ink transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <ChevronDown size={15} />
                    </button>
                  )}
                </div>

                {went && isExpanded && (
                  <div className="border-t border-line px-2.5 py-2.5 bg-accentSoft/20">
                    <ExerciseList
                      sessionId={session!.id}
                      exercises={session?.exercises ?? []}
                      onUpdate={(exerciseId, fields) =>
                        updateExercise(date, exerciseId, fields)
                      }
                      onRemove={(exerciseId) => removeExercise(date, exerciseId)}
                      onReorder={(orderedIds) =>
                        reorderExercises(date, session!.id, orderedIds)
                      }
                    />
                    <button
                      onClick={() => addExercise(date)}
                      className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
                    >
                      <Plus size={12} /> Add exercise
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ExerciseList({
  sessionId,
  exercises,
  onUpdate,
  onRemove,
  onReorder,
}: {
  sessionId: number;
  exercises: GymExerciseDTO[];
  onUpdate: (exerciseId: number, fields: Partial<GymExerciseDTO>) => void;
  onRemove: (exerciseId: number) => void;
  onReorder: (orderedIds: number[]) => void;
}) {
  const { order, getHandleProps, getRowProps } = useReorderable(
    exercises,
    onReorder
  );

  return (
    <>
      {order.map((ex) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          rowProps={getRowProps(ex.id)}
          handleProps={getHandleProps(ex.id)}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
    </>
  );
}

function ExerciseRow({
  exercise: ex,
  rowProps,
  handleProps,
  onUpdate,
  onRemove,
}: {
  exercise: GymExerciseDTO;
  rowProps: ReturnType<ReturnType<typeof useReorderable>['getRowProps']>;
  handleProps: ReturnType<ReturnType<typeof useReorderable>['getHandleProps']>;
  onUpdate: (exerciseId: number, fields: Partial<GymExerciseDTO>) => void;
  onRemove: (exerciseId: number) => void;
}) {
  const { secondsLeft, isRunning, start } = useCountdown();
  const setCount = ex.sets ?? 0;
  const completedCount = Math.min(ex.setsCompleted, setCount);

  function completeSet(setIndex: number) {
    // Tapping a set marks it (and every set before it) done — sets finish
    // in order, so there's no concept of completing set 3 without 1 and 2.
    const newCompleted = setIndex + 1;
    onUpdate(ex.id, { setsCompleted: newCompleted });
    if (newCompleted < setCount && ex.restSeconds) {
      start(ex.restSeconds);
    }
  }

  function uncompleteSet(setIndex: number) {
    onUpdate(ex.id, { setsCompleted: setIndex });
  }

  return (
    <div {...rowProps} className="border-b border-line/60 pb-2 mb-2 last:border-b-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          {...handleProps}
          className="text-ink/25 hover:text-ink/50 flex-shrink-0"
          aria-label={`Drag to reorder ${ex.name}`}
        >
          <GripVertical size={13} />
        </span>
        <input
          value={ex.name}
          onChange={(e) => onUpdate(ex.id, { name: e.target.value })}
          placeholder="Exercise"
          className="flex-1 min-w-0 bg-transparent text-sm border-b border-line/70 pb-0.5 focus:outline-none focus:border-accent"
        />
        <button
          onClick={() => onRemove(ex.id)}
          aria-label="Remove exercise"
          className="text-ink/30 hover:text-warn flex-shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap pl-5">
        <NumberField
          value={ex.sets}
          onChange={(v) => onUpdate(ex.id, { sets: v })}
          placeholder="sets"
        />
        <span className="text-ink/30 text-xs">×</span>
        <NumberField
          value={ex.reps}
          onChange={(v) => onUpdate(ex.id, { reps: v })}
          placeholder="reps"
        />
        <NumberField
          value={ex.weight}
          onChange={(v) => onUpdate(ex.id, { weight: v })}
          placeholder="kg"
        />
        <RestPresets
          value={ex.restSeconds}
          onChange={(v) => onUpdate(ex.id, { restSeconds: v })}
        />
      </div>

      {setCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pl-5 mt-1.5">
          {Array.from({ length: setCount }).map((_, i) => {
            const done = i < completedCount;
            return (
              <button
                key={i}
                onClick={() => (done ? uncompleteSet(i) : completeSet(i))}
                aria-label={`Set ${i + 1} ${done ? 'done' : 'not done'}`}
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-medium transition-colors flex-shrink-0 ${
                  done
                    ? 'bg-accent border-accent text-white'
                    : 'border-ink/25 text-ink/40 hover:border-accent'
                }`}
              >
                {done ? <Check size={11} /> : i + 1}
              </button>
            );
          })}

          {isRunning && (
            <span className="text-xs text-warn font-medium tabular-nums">
              Rest: {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RestPresets({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const presets = [30, 60, 90, 120];
  return (
    <div className="flex items-center gap-1">
      <Timer size={11} className="text-ink/30 flex-shrink-0" />
      {presets.map((seconds) => {
        const active = value === seconds;
        const label = seconds < 60 ? `${seconds}s` : `${seconds / 60}min`;
        return (
          <button
            key={seconds}
            onClick={() => onChange(seconds)}
            className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
              active
                ? 'bg-accent border-accent text-white'
                : 'border-line text-ink/40 hover:border-accent/50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) =>
        onChange(e.target.value === '' ? null : Number(e.target.value))
      }
      placeholder={placeholder}
      className="w-12 bg-transparent text-sm text-center border-b border-line/70 pb-0.5 focus:outline-none focus:border-accent placeholder:text-ink/30"
    />
  );
}
