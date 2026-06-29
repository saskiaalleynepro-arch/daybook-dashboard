'use client';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Masthead() {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];

  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-ink/50 mb-1">
            {weekday}, {month} {now.getDate()}
          </p>
          <h1 className="font-serif italic text-4xl sm:text-5xl text-ink leading-none">
            Daybook
          </h1>
        </div>
        <p className="font-serif text-sm text-ink/40 italic mb-1">
          tasks · notes · habits
        </p>
      </div>
    </header>
  );
}
