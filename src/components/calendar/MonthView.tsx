'use client';

import { format, isSameMonth, isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { useCalendarStore, useEventStore, useTaskStore } from '@/store';
import { cn } from '@/lib/utils';

export function MonthView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate } = useEventStore();
  const { getTasksForDate } = useTaskStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust for Monday start

  // Add empty cells for days before month starts
  const calendarDays = Array(adjustedStartDay).fill(null).concat(monthDays);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex-1 overflow-auto bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-border mb-px">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="bg-muted/50 min-h-[100px]" />;
            }

            const events = getEventsForDate(date);
            const tasks = getTasksForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'bg-background min-h-[100px] p-2 border border-border hover:bg-accent/50 cursor-pointer',
                  !isCurrentMonth && 'bg-muted/30',
                  isCurrentDay && 'bg-blue-50/50'
                )}
                onClick={() => {
                  console.log('Navigate to day', date);
                }}
              >
                {/* Date number */}
                <div className={cn(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-muted-foreground',
                  isCurrentDay && 'text-blue-600'
                )}>
                  {format(date, 'd')}
                </div>

                {/* Events and tasks preview */}
                <div className="space-y-1">
                  {/* Show first few events */}
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ 
                        backgroundColor: event.color + '20', 
                        color: event.color 
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.title}
                    </div>
                  ))}

                  {/* Show first few tasks */}
                  {tasks.slice(0, 2 - events.length).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-xs p-1 rounded truncate',
                        task.category === 'work' && 'bg-blue-100 text-blue-800',
                        task.category === 'family' && 'bg-green-100 text-green-800',
                        task.category === 'personal' && 'bg-orange-100 text-orange-800',
                        task.category === 'travel' && 'bg-purple-100 text-purple-800',
                        task.category === 'inbox' && 'bg-gray-100 text-gray-800'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.title}
                    </div>
                  ))}

                  {/* Show "more" indicator if there are more items */}
                  {events.length + tasks.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{events.length + tasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}