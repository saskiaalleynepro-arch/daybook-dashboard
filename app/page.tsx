'use client';

import { useState } from 'react';
import Masthead from '@/components/Masthead';
import TasksPanel from '@/components/TasksPanel';
import NotesPanel from '@/components/NotesPanel';
import HabitGrid from '@/components/HabitGrid';
import WeatherWidget from '@/components/WeatherWidget';
import ViewTabs, { ViewTab } from '@/components/ViewTabs';
import WeekView from '@/components/week/WeekView';
import CalendarView from '@/components/CalendarView';
import ShoppingList from '@/components/ShoppingList';
import FoodLog from '@/components/FoodLog';
import DailyTodoList from '@/components/DailyTodoList';

export default function DashboardPage() {
  const [tab, setTab] = useState<ViewTab>('week');

  return (
    <main className="min-h-screen">
      <Masthead />
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <ViewTabs active={tab} onChange={setTab} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'week' ? (
          <WeekView />
        ) : tab === 'today' ? (
          <DailyTodoList />
        ) : tab === 'calendar' ? (
          <CalendarView />
        ) : tab === 'shopping' ? (
          <ShoppingList />
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <WeatherWidget />
              <FoodLog />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:h-[calc(100vh-420px)]">
              <div className="lg:h-full">
                <TasksPanel />
              </div>
              <div className="lg:h-full">
                <HabitGrid />
              </div>
              <div className="lg:h-full">
                <NotesPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

