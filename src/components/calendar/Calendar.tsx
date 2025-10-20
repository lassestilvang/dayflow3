'use client';

import { useCalendarStore } from '@/store';
import { FullCalendarComponent } from './FullCalendar';

interface CalendarProps {
  sidebarRef?: React.RefObject<HTMLDivElement>;
}

export function Calendar({ sidebarRef }: CalendarProps) {
  const { view } = useCalendarStore();

  return <FullCalendarComponent sidebarRef={sidebarRef} />;
}