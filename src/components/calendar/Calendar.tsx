'use client';

import { useCalendarStore } from '@/store';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';

export function Calendar() {
  const { view } = useCalendarStore();

  switch (view) {
    case 'day':
      return <DayView />;
    case 'week':
      return <WeekView />;
    case 'month':
      return <MonthView />;
    default:
      return <WeekView />;
  }
}