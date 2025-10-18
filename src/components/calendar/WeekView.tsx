'use client';

import { format, isToday, setHours } from 'date-fns';
import { useState } from 'react';
import { useCalendarStore, useEventStore, useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView() {
  const { getWeekDates } = useCalendarStore();
  const { getEventsForDate } = useEventStore();
  const { getTasksForDate } = useTaskStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
  
  const weekDates = getWeekDates();

  const handleDragStart = (item: Task | Event) => {
    setDraggedItem(item);
  };

  const handleDrop = (date: Date, hour: number) => {
    if (draggedItem) {
      // Handle dropping task/event at specific time
      console.log('Dropping', draggedItem, 'at', date, hour);
      setDraggedItem(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="relative min-w-[800px]">
        {/* Header row */}
        <div className="flex">
          {/* Empty corner cell for time column header */}
          <div className="sticky left-0 z-20 w-20 bg-background border-r border-border border-b border-border" />
          
          {/* Date headers */}
          {weekDates.map((date, dateIndex) => (
            <div
              key={dateIndex}
              className={cn(
                'flex-1 min-w-[120px] border-r border-border last:border-r-0 border-b border-border',
                isToday(date) && 'bg-blue-50/50'
              )}
            >
              <div className="sticky top-0 z-10 bg-background p-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {format(date, 'EEE')}
                </div>
                <div className={cn(
                  'text-sm font-semibold',
                  isToday(date) && 'text-blue-600'
                )}>
                  {format(date, 'd')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className="flex">
          {/* Time column */}
          <div className="sticky left-0 z-20 w-20 bg-background border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-border flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {format(setHours(new Date(), hour), 'ha')}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex flex-1">
            {weekDates.map((date, dateIndex) => (
              <div
                key={dateIndex}
                className={cn(
                  'flex-1 min-w-[120px] border-r border-border last:border-r-0',
                  isToday(date) && 'bg-blue-50/50'
                )}
              >
                {/* Time slots */}
                <div className="relative">
                  {HOURS.map((hour) => {
                    const events = getEventsForDate(date).filter(event => {
                      const eventStart = new Date(event.startTime);
                      return eventStart.getHours() === hour;
                    });
                    const tasks = getTasksForDate(date).filter(task => {
                      if (task.scheduledTime) {
                        const [taskHour] = task.scheduledTime.split(':').map(Number);
                        return taskHour === hour;
                      }
                      return false;
                    });

                    return (
                      <div
                        key={hour}
                        className="h-[60px] border-b border-border relative group hover:bg-accent/50 cursor-pointer"
                        onDrop={() => handleDrop(date, hour)}
                        onDragOver={handleDragOver}
                        onClick={() => {
                          // Handle click to create new event/task
                          console.log('Create at', date, hour);
                        }}
                      >
                        {/* Events and Tasks */}
                        <div className="absolute inset-0 p-1 space-y-1">
                          {events.map((event) => (
                            <div
                              key={event.id}
                              draggable
                              onDragStart={() => handleDragStart(event)}
                              className="text-xs p-1 rounded bg-blue-100 text-blue-800 border border-blue-200 cursor-move truncate"
                              style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              className={cn(
                                'text-xs p-1 rounded border cursor-move truncate',
                                task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                                task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                                task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                                task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                                task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200'
                              )}
                            >
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}