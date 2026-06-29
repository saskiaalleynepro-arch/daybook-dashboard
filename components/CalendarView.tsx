'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Dumbbell } from 'lucide-react';
import type { EventDTO, WeekTaskDTO } from '@/lib/types';
import { monthGrid, monthLabel, todayKey, weekStartFor } from '@/lib/dates';
import { lightenHex } from '@/lib/colors';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type GymDaySummary = { date: string; workoutType: string | null; went: boolean };

export default function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [gymDays, setGymDays] = useState<GymDaySummary[]>([]);
  const [gymPillColor, setGymPillColor] = useState('#8a7a6b');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekTasks, setWeekTasks] = useState<WeekTaskDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  const days = monthGrid(year, month);
  const rangeFrom = days[0];
  const rangeTo = days[days.length - 1];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/events?from=${rangeFrom}&to=${rangeTo}`).then((r) => r.json()),
      fetch(`/api/gym/calendar-summary?from=${rangeFrom}&to=${rangeTo}`).then((r) =>
        r.json()
      ),
    ])
      .then(([eventData, gymData]) => {
        setEvents(eventData);
        setGymDays(gymData);
      })
      .catch(() => setError('Could not load the calendar.'))
      .finally(() => setLoading(false));
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    fetch('/api/gym/pill-color')
      .then((r) => r.json())
      .then((d: { color: string }) => setGymPillColor(d.color))
      .catch(() => {});
  }, []);

  async function updateGymPillColor(color: string) {
    setGymPillColor(color);
    try {
      await fetch('/api/gym/pill-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      });
    } catch {
      setError('Could not save the gym pill color.');
    }
  }

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  }

  async function selectDay(date: string) {
    setSelectedDate(date);
    try {
      const res = await fetch(
        `/api/week-tasks?weekStart=${weekStartFor(new Date(date))}`
      );
      if (!res.ok) throw new Error();
      setWeekTasks(await res.json());
    } catch {
      setWeekTasks([]);
    }
  }

  async function addEvent(
    title: string,
    time: string,
    color: string | null,
    endDate: string | null
  ) {
    if (!selectedDate || !title.trim()) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: selectedDate,
          time: time || null,
          color,
          endDate,
        }),
      });
      if (!res.ok) throw new Error();
      const created: EventDTO = await res.json();
      setEvents((prev) => [...prev, created]);
    } catch {
      setError('Could not add that event.');
    }
  }

  async function updateEvent(id: number, fields: Partial<EventDTO>) {
    const prev = events;
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, ...fields } : e)));
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEvents(prev);
      setError('Could not save that change.');
    }
  }

  async function deleteEvent(id: number) {
    const prev = events;
    setEvents((p) => p.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setEvents(prev);
      setError('Could not delete that event.');
    }
  }

  const eventsByDate = new Map<string, EventDTO[]>();
  for (const ev of events) {
    const list = eventsByDate.get(ev.date) ?? [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  const gymByDate = new Map<string, GymDaySummary>();
  for (const g of gymDays) {
    gymByDate.set(g.date, g);
  }

  /** Returns every block (multi-day event) that covers the given date,
   *  whether or not that date is the block's own start date — used to
   *  shade every day in a block's range, not just the day it was created on. */
  function blocksCoveringDate(date: string): EventDTO[] {
    return events.filter(
      (ev) => ev.endDate && ev.date <= date && date <= ev.endDate
    );
  }

  const selectedEvents = selectedDate
    ? [
        ...(eventsByDate.get(selectedDate) ?? []),
        ...blocksCoveringDate(selectedDate).filter(
          (b) => b.date !== selectedDate
        ),
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <section className="bg-white/60 border border-line rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="p-1.5 rounded-full hover:bg-accentSoft text-ink/60 hover:text-ink transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-serif text-lg text-ink">
            {monthLabel(year, month)}
          </h2>
          <div className="flex items-center gap-2">
            <label
              className="flex items-center gap-1 cursor-pointer"
              title="Gym pill color"
            >
              <Dumbbell size={12} className="text-ink/40" />
              <input
                type="color"
                value={gymPillColor}
                onChange={(e) => updateGymPillColor(e.target.value)}
                aria-label="Gym pill color"
                className="w-5 h-5 rounded-sm border border-line cursor-pointer bg-transparent"
              />
            </label>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="p-1.5 rounded-full hover:bg-accentSoft text-ink/60 hover:text-ink transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-warn mb-2" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((d) => (
            <span
              key={d}
              className="text-[10px] uppercase tracking-wide text-ink/35 text-center py-1"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const inMonth = new Date(date).getMonth() === month;
            const isToday = date === todayKey();
            const isSelected = date === selectedDate;
            const dayEvents = eventsByDate.get(date) ?? [];
            const coveringBlocks = blocksCoveringDate(date);
            const blockColor = coveringBlocks[0]?.color;
            const singleDayEvents = dayEvents.filter((ev) => !ev.endDate);
            const gymDay = gymByDate.get(date);

            // Unified pill list: gym (if present) first, then regular
            // events — so the 2-pill cap and "+N more" count both kinds
            // consistently rather than tracking them separately.
            type PillItem = { key: string; title: string; color: string; isGym?: boolean };
            const pillItems: PillItem[] = [];
            if (gymDay) {
              pillItems.push({
                key: `gym-${date}`,
                title: gymDay.workoutType!,
                color: gymPillColor,
                isGym: true,
              });
            }
            for (const ev of singleDayEvents) {
              pillItems.push({
                key: `ev-${ev.id}`,
                title: ev.title,
                color: ev.color ?? '#8a7a6b',
              });
            }
            const visiblePills = pillItems.slice(0, 2);
            const hiddenCount = pillItems.length - visiblePills.length;

            return (
              <button
                key={date}
                onClick={() => selectDay(date)}
                className={`min-h-[2.75rem] sm:min-h-[4.5rem] rounded-sm flex flex-col items-center sm:items-stretch justify-center sm:justify-start gap-0.5 sm:gap-1 p-0.5 sm:p-1 text-xs transition-colors relative text-left ${
                  isSelected
                    ? 'bg-accent text-white'
                    : blockColor
                    ? ''
                    : isToday
                    ? 'bg-accentSoft text-ink'
                    : inMonth
                    ? 'hover:bg-accentSoft/50 text-ink/80'
                    : 'text-ink/25 hover:bg-accentSoft/30'
                }`}
                style={
                  !isSelected && blockColor
                    ? { backgroundColor: lightenHex(blockColor, 0.75) }
                    : undefined
                }
              >
                <span className="text-center sm:text-left sm:px-0.5">
                  {Number(date.split('-')[2])}
                </span>

                {/* Mobile: small color bars, no title text (not enough width to stay legible) */}
                {pillItems.length > 0 && (
                  <span className="flex gap-0.5 sm:hidden">
                    {pillItems.slice(0, 3).map((item) => (
                      <span
                        key={item.key}
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : item.color,
                        }}
                      />
                    ))}
                  </span>
                )}

                {/* Desktop: title pills, capped at 2 then "+N more" */}
                {visiblePills.length > 0 && (
                  <span className="hidden sm:flex sm:flex-col sm:gap-0.5">
                    {visiblePills.map((item) => (
                      <span
                        key={item.key}
                        className="text-[10px] px-1 py-0.5 rounded truncate leading-tight flex items-center gap-0.5"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.25)'
                            : lightenHex(item.color, 0.75),
                          color: isSelected ? '#ffffff' : item.color,
                        }}
                      >
                        {item.isGym && <Dumbbell size={9} className="flex-shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span
                        className={`text-[10px] px-1 leading-tight ${
                          isSelected ? 'text-white/80' : 'text-ink/40'
                        }`}
                      >
                        +{hiddenCount} more
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white/60 border border-line rounded-sm p-5">
        {!selectedDate ? (
          <p className="text-sm text-ink/40 italic">
            Select a day to see events and tasks.
          </p>
        ) : (
          <DaySidebar
            date={selectedDate}
            events={selectedEvents}
            weekTasks={weekTasks}
            gymDay={gymByDate.get(selectedDate) ?? null}
            gymPillColor={gymPillColor}
            onClose={() => setSelectedDate(null)}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
            onUpdateEvent={updateEvent}
          />
        )}
      </section>
    </div>
  );
}

function DaySidebar({
  date,
  events,
  weekTasks,
  gymDay,
  gymPillColor,
  onClose,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: {
  date: string;
  events: EventDTO[];
  weekTasks: WeekTaskDTO[];
  gymDay: GymDaySummary | null;
  gymPillColor: string;
  onClose: () => void;
  onAddEvent: (
    title: string,
    time: string,
    color: string | null,
    endDate: string | null
  ) => void;
  onUpdateEvent: (id: number, fields: Partial<EventDTO>) => void;
  onDeleteEvent: (id: number) => void;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState('#8a7a6b');
  const [isBlock, setIsBlock] = useState(false);
  const [endDate, setEndDate] = useState(date);
  const label = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function submit() {
    if (!title.trim()) return;
    onAddEvent(title, isBlock ? '' : time, color, isBlock ? endDate : null);
    setTitle('');
    setTime('');
    setIsBlock(false);
    setEndDate(date);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-base text-ink">{label}</h3>
        <button
          onClick={onClose}
          aria-label="Close day detail"
          className="text-ink/30 hover:text-ink lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {gymDay && (
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-sm mb-3"
          style={{ backgroundColor: lightenHex(gymPillColor, 0.85) }}
        >
          <Dumbbell size={14} style={{ color: gymPillColor }} className="flex-shrink-0" />
          <span className="text-sm" style={{ color: gymPillColor }}>
            {gymDay.workoutType}
          </span>
          {gymDay.went && (
            <span className="text-[10px] text-ink/40 ml-auto">Done</span>
          )}
        </div>
      )}

      {events.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {events.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              onUpdate={(fields) => onUpdateEvent(ev.id, fields)}
              onDelete={() => onDeleteEvent(ev.id)}
            />
          ))}
        </ul>
      )}

      <div className="border border-line rounded-sm p-2.5 mb-4">
        <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
          Add an event
        </p>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => !isBlock && e.key === 'Enter' && submit()}
            placeholder={isBlock ? 'e.g. Vacation' : 'Event title…'}
            className="flex-1 bg-transparent border-b border-line pb-1 text-sm placeholder:text-ink/35 focus:border-accent focus:outline-none"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Event color"
            className="w-7 h-7 rounded-sm border border-line cursor-pointer bg-transparent flex-shrink-0"
          />
        </div>

        <label className="flex items-center gap-1.5 mb-2 text-xs text-ink/60 cursor-pointer">
          <input
            type="checkbox"
            checked={isBlock}
            onChange={(e) => setIsBlock(e.target.checked)}
          />
          Block multiple days (e.g. a holiday)
        </label>

        {isBlock ? (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-ink/40">Through</span>
            <input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border border-line rounded-sm px-2 py-1"
            />
          </div>
        ) : (
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="text-xs bg-transparent border border-line rounded-sm px-2 py-1 mb-2"
          />
        )}

        <button
          onClick={submit}
          className="w-full bg-accent text-white rounded-sm py-1.5 text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
        >
          <Plus size={13} /> {isBlock ? 'Add block' : 'Add event'}
        </button>
      </div>

      {weekTasks.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
            This week's tasks
          </p>
          <ul className="space-y-1">
            {weekTasks.map((t) => (
              <li
                key={t.id}
                className={`text-xs px-2 py-1 rounded-sm ${
                  t.done ? 'text-ink/35 line-through' : 'text-ink/75'
                }`}
              >
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EventRow({
  event: ev,
  onUpdate,
  onDelete,
}: {
  event: EventDTO;
  onUpdate: (fields: Partial<EventDTO>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(ev.title);
  const [time, setTime] = useState(ev.time ?? '');
  const [color, setColor] = useState(ev.color ?? '#8a7a6b');
  const [endDate, setEndDate] = useState(ev.endDate ?? ev.date);
  const isBlock = !!ev.endDate;

  function save() {
    if (!title.trim()) return;
    onUpdate({
      title: title.trim(),
      time: isBlock ? null : time || null,
      color,
      endDate: isBlock ? endDate : null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="border border-accent rounded-sm p-2.5 bg-white/70">
        <div className="flex items-center gap-2 mb-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="flex-1 bg-transparent border-b border-line pb-1 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Event color"
            className="w-7 h-7 rounded-sm border border-line cursor-pointer bg-transparent flex-shrink-0"
          />
        </div>
        {isBlock ? (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-ink/40">Through</span>
            <input
              type="date"
              value={endDate}
              min={ev.date}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border border-line rounded-sm px-2 py-1"
            />
          </div>
        ) : (
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="text-xs bg-transparent border border-line rounded-sm px-2 py-1 mb-2"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex-1 bg-accent text-white rounded-sm py-1 text-xs hover:opacity-90 transition-opacity"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-ink/40 hover:text-ink px-2"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 px-2 py-1.5 rounded-sm border border-line bg-white/50 hover:border-accent/50 transition-colors">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: ev.color ?? '#8a7a6b' }}
      />
      <button
        onClick={() => setEditing(true)}
        className="flex-1 text-left text-sm text-ink/85"
      >
        {ev.time && (
          <span className="text-ink/40 text-xs mr-1.5">{ev.time}</span>
        )}
        {ev.title}
        {ev.endDate && (
          <span className="text-ink/40 text-xs ml-1.5">
            (through {ev.endDate})
          </span>
        )}
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete event"
        className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity flex-shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </li>
  );
}
