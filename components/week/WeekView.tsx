'use client';

import { useState } from 'react';
import { currentWeekStart } from '@/lib/dates';
import WeekNav from './WeekNav';
import TaskChecklist from './TaskChecklist';
import GymTracker from './GymTracker';
import WeeklyFocus from './WeeklyFocus';
import Reflections from './Reflections';
import CurrentlyReadingWidget from './CurrentlyReadingWidget';
import MealPlan from './MealPlan';

export default function WeekView() {
  const [weekStart, setWeekStart] = useState(currentWeekStart());

  return (
    <div>
      <WeekNav weekStart={weekStart} onChange={setWeekStart} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <TaskChecklist weekStart={weekStart} />
          <WeeklyFocus weekStart={weekStart} />
          <MealPlan weekStart={weekStart} />
        </div>
        <div className="space-y-5">
          <GymTracker weekStart={weekStart} />
          <CurrentlyReadingWidget />
          <Reflections weekStart={weekStart} />
        </div>
      </div>
    </div>
  );
}
