'use client';

import { format, isToday, setHours } from 'date-fns';
import { useState } from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

function DroppableSlot({ date, hour, children }: { 
  date: Date; 
  hour: number; 
  children: React.ReactNode;
}) {
  const slotId = `${format(date, 'yyyy-MM-dd')}-hour-${hour}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-[60px] border-b border-border relative group hover:bg-accent/50 cursor-pointer',
        isOver && 'bg-accent/20'
      )}
    >
      {children}
    </div>
  );
}

export function WeekView() {
  const { getWeekDates } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
  
  const weekDates = getWeekDates();

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
      
      if (draggedData && dropZoneId.includes('-hour-')) {
        const [dateStr, , hourStr] = dropZoneId.split('-');
        const hour = parseInt(hourStr);
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        const newDate = new Date(dateStr);
        
        if ('category' in item) {
          // It's a task
          const newScheduledTime = `${hour.toString().padStart(2, '0')}:00`;
          
          await updateTask(item.id, {
            scheduledDate: newDate,
            scheduledTime: newScheduledTime,
            updatedAt: new Date()
          });
        } else {
          // It's an event
          let newStartTime: Date;
          let newEndTime: Date;
          
          if (fromSidebar) {
            // Event from sidebar (unlikely but handle it)
            newStartTime = new Date(newDate);
            newStartTime.setHours(hour, 0, 0, 0);
            newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
          } else {
            // Existing event being rescheduled
            const originalStart = new Date(item.startTime);
            const originalEnd = new Date(item.endTime);
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            newStartTime = new Date(newDate);
            newStartTime.setHours(hour, 0, 0, 0);
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

  return (
    <>
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
                        <DroppableSlot key={hour} date={date} hour={hour}>
                          {/* Events and Tasks */}
                          <div className="absolute inset-0 p-1 space-y-1">
                            {events.map((event) => (
                              <DraggableItem key={event.id} item={event}>
                                <div
                                  className="text-xs p-1 rounded bg-blue-100 text-blue-800 border border-blue-200 cursor-move truncate"
                                  style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                                >
                                  {event.title}
                                </div>
                              </DraggableItem>
                            ))}
                            {tasks.map((task) => (
                              <DraggableItem key={task.id} item={task}>
                                <div
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
                              </DraggableItem>
                            ))}
                          </div>
                        </DroppableSlot>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedItem && (
          <div className="p-2 rounded-lg border shadow-lg bg-background">
            <div className="font-medium">{draggedItem.title}</div>
          </div>
        )}
      </DragOverlay>
    </>
  );
}