'use client';

import { format, isSameMonth, isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { useState } from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

interface DraggableItemProps {
  item: Task | Event;
  children: React.ReactNode;
}

function DraggableItem({ item, children }: DraggableItemProps) {
  const isTask = 'category' in item;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: {
      type: isTask ? 'task' : 'event',
      data: item,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

function DroppableDay({ date, children, isCurrentMonth, isCurrentDay }: { 
  date: Date; 
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `date-${format(date, 'yyyy-MM-dd')}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-background min-h-[100px] p-2 border border-border hover:bg-accent/50 cursor-pointer',
        !isCurrentMonth && 'bg-muted/30',
        isCurrentDay && 'bg-blue-50/50',
        isOver && 'bg-accent/30 ring-2 ring-primary'
      )}
    >
      {children}
    </div>
  );
}

export function MonthView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const { setEditingTask, setEditingEvent } = useUIStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust for Monday start

  // Add empty cells for days before month starts
  const calendarDays = Array(adjustedStartDay).fill(null).concat(monthDays);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useDndMonitor({
    onDragStart: (event) => {
      const { active } = event;
      const item = active.data.current as { type: 'task' | 'event'; data: Task | Event } | undefined;
      if (item) {
        setDraggedItem(item.data);
      }
    },
    onDragEnd: async (event) => {
      const { active, over } = event;
      
      if (!over) {
        setDraggedItem(null);
        return;
      }

      const draggedData = active.data.current as { type: 'task' | 'event'; data: Task | Event; source?: string } | undefined;
      const dropZoneId = over.id as string;
      
      if (draggedData && dropZoneId.startsWith('date-')) {
        const dateStr = dropZoneId.replace('date-', '');
        const newDate = new Date(dateStr);
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        if ('category' in item) {
          // It's a task - move to new date, keep existing time or set to 9:00 AM
          const newScheduledTime = item.scheduledTime || '09:00';
          
await updateTask(item.id, {
          scheduledDate: newDate,
          scheduledTime: newScheduledTime,
          updatedAt: new Date()
        });
        } else {
          // It's an event - move to new date, keep existing time or set default
          let newStartTime: Date;
          let newEndTime: Date;
          
          if (fromSidebar) {
            // Event from sidebar (unlikely but handle it)
            newStartTime = new Date(newDate);
            newStartTime.setHours(9, 0, 0, 0); // Default 9 AM
            newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
          } else {
            // Existing event being rescheduled
            const originalStart = new Date(item.startTime);
            const originalEnd = new Date(item.endTime);
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            // Preserve the original time of day
            newStartTime = new Date(newDate);
            newStartTime.setHours(
              originalStart.getHours(), 
              originalStart.getMinutes(), 
              originalStart.getSeconds(), 
              originalStart.getMilliseconds()
            );
            
            newEndTime = new Date(newStartTime.getTime() + duration);
          }
          
          await updateEvent(item.id, {
            startTime: newStartTime,
            endTime: newEndTime,
            updatedAt: new Date()
          });
        }
      }
      
      setDraggedItem(null);
    },
  });

  const handleDayClick = (date: Date) => {
    console.log('Navigate to day', date);
  };

  return (
    <>
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
                <DroppableDay 
                  key={date.toISOString()} 
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isCurrentDay={isCurrentDay}
                >
                  {/* Date number */}
                  <div 
                    className={cn(
                      'text-sm font-medium mb-1',
                      !isCurrentMonth && 'text-muted-foreground',
                      isCurrentDay && 'text-blue-600'
                    )}
                    onClick={() => handleDayClick(date)}
                  >
                    {format(date, 'd')}
                  </div>

                  {/* Events and tasks preview */}
                  <div className="space-y-1">
                    {/* Show first few events */}
                    {events.slice(0, 2).map((event) => (
                      <DraggableItem key={event.id} item={event}>
                        <div
                          className="text-xs p-1 rounded truncate cursor-move hover:opacity-80"
                          style={{ 
                            backgroundColor: event.color + '20', 
                            color: event.color 
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                        >
                          {event.title}
                        </div>
                      </DraggableItem>
                    ))}

                    {/* Show first few tasks */}
                    {tasks.slice(0, 2 - events.length).map((task) => (
                      <DraggableItem key={task.id} item={task}>
                        <div
                          className={cn(
                            'text-xs p-1 rounded truncate cursor-move hover:opacity-80',
                            task.category === 'work' && 'bg-blue-100 text-blue-800',
                            task.category === 'family' && 'bg-green-100 text-green-800',
                            task.category === 'personal' && 'bg-orange-100 text-orange-800',
                            task.category === 'travel' && 'bg-purple-100 text-purple-800',
                            task.category === 'inbox' && 'bg-gray-100 text-gray-800'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                        >
                          {task.title}
                        </div>
                      </DraggableItem>
                    ))}

                    {/* Show "more" indicator if there are more items */}
                    {events.length + tasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{events.length + tasks.length - 2} more
                      </div>
                    )}
                  </div>
                </DroppableDay>
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedItem && (
          <div className="p-2 rounded-lg border shadow-lg bg-background max-w-[150px]">
            <div className="font-medium text-sm truncate">{draggedItem.title}</div>
            {'category' in draggedItem && (
              <div className="text-xs text-muted-foreground capitalize">
                {draggedItem.category}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </>
  );
}