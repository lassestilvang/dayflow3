'use client';

import { format, addMinutes, isToday, setHours, setMinutes } from 'date-fns';
import { useState } from 'react';
import { useCalendarStore, useEventStore, useTaskStore } from '@/store';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // pixels per hour

export function DayView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate } = useEventStore();
  const { getTasksForDate } = useTaskStore();
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const events = getEventsForDate(currentDate);
  const tasks = getTasksForDate(currentDate);

  const handleDragStart = (item: any) => {
    setDraggedItem(item);
  };

  const handleDrop = (hour: number) => {
    if (draggedItem) {
      console.log('Dropping', draggedItem, 'at hour', hour);
      setDraggedItem(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTimeSlotClick = (hour: number) => {
    console.log('Create event at', currentDate, hour);
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Current time indicator */}
        {isToday(currentDate) && (
          <div 
            className="absolute left-20 right-0 z-10 pointer-events-none"
            style={{
              top: `${new Date().getHours() * HOUR_HEIGHT + new Date().getMinutes() * (HOUR_HEIGHT / 60)}px`,
            }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
            </div>
          </div>
        )}

        {/* Time slots */}
        {HOURS.map((hour) => {
          const slotEvents = events.filter(event => {
            const eventStart = new Date(event.startTime);
            return eventStart.getHours() === hour;
          });
          
          const slotTasks = tasks.filter(task => {
            if (task.scheduledTime) {
              const [taskHour] = task.scheduledTime.split(':').map(Number);
              return taskHour === hour;
            }
            return false;
          });

          return (
            <div
              key={hour}
              className="flex border-b border-border group"
              onDrop={() => handleDrop(hour)}
              onDragOver={handleDragOver}
            >
              {/* Time label */}
              <div className="w-20 py-4 pr-4 text-right text-sm text-muted-foreground font-medium sticky left-0 bg-background">
                {format(setHours(new Date(), hour), 'ha')}
              </div>

              {/* Content area */}
              <div 
                className="flex-1 min-h-[80px] p-2 relative hover:bg-accent/30 cursor-pointer"
                onClick={() => handleTimeSlotClick(hour)}
              >
                <div className="space-y-2">
                  {/* Events */}
                  {slotEvents.map((event) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={() => handleDragStart(event)}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg border cursor-move text-sm"
                      style={{ 
                        backgroundColor: event.color + '20', 
                        borderColor: event.color,
                        color: event.color 
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="text-xs opacity-75 mt-1">{event.description}</div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                      </div>
                    </div>
                  ))}

                  {/* Tasks */}
                  {slotTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'p-2 rounded-lg border cursor-move text-sm',
                        task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                        task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                        task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                        task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                        task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => {
                            // Toggle task completion
                            console.log('Toggle task', task.id);
                          }}
                        />
                        <span className={cn(task.completed && 'line-through opacity-60')}>
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <div className="text-xs opacity-75 mt-1 ml-6">{task.description}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Empty slot indicator */}
                {slotEvents.length === 0 && slotTasks.length === 0 && (
                  <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to add event or task
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}