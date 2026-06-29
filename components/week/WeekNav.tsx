'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { weekLabel, currentWeekStart, shiftWeek } from '@/lib/dates';

export default function WeekNav({
  weekStart,
  onChange,
}: {
  weekStart: string;
  onChange: (next: string) => void;
}) {
  const isCurrentWeek = weekStart === currentWeekStart();

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => onChange(shiftWeek(weekStart, -1))}
        aria-label="Previous week"
        className="p-1.5 rounded-full hover:bg-accentSoft text-ink/60 hover:text-ink transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="text-center">
        <h2 className="font-serif text-lg text-ink">{weekLabel(weekStart)}</h2>
        {!isCurrentWeek && (
          <button
            onClick={() => onChange(currentWeekStart())}
            className="text-xs text-accent hover:underline"
          >
            Back to this week
          </button>
        )}
      </div>

      <button
        onClick={() => onChange(shiftWeek(weekStart, 1))}
        aria-label="Next week"
        className="p-1.5 rounded-full hover:bg-accentSoft text-ink/60 hover:text-ink transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
