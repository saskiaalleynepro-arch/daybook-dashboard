'use client';

export type ViewTab = 'dashboard' | 'today' | 'week' | 'calendar' | 'shopping';

export default function ViewTabs({
  active,
  onChange,
}: {
  active: ViewTab;
  onChange: (tab: ViewTab) => void;
}) {
  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'shopping', label: 'Shopping' },
  ];

  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === tab.id
              ? 'border-accent text-ink'
              : 'border-transparent text-ink/40 hover:text-ink/70'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
