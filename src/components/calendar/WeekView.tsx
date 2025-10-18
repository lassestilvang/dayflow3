'use client';

import { format, isToday, setHours } from 'date-fns';
import { useState, useEffect } from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

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

function DroppableAllDaySlot({ date, children }: { 
  date: Date; 
  children: React.ReactNode;
}) {
  const slotId = `${format(date, 'yyyy-MM-dd')}-all-day`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[120px] border-r border-border last:border-r-0 p-1 min-h-[60px] relative',
        isToday(date) && 'bg-blue-50/50 border-l-2 border-l-blue-200',
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
  const { setEditingTask, setEditingEvent } = useUIStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const weekDates = getWeekDates();

  const handleTaskCompleteToggle = async (taskId: string, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(taskId, { 
      completed, 
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date() 
    });
  };

// Update current time every minute
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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
      
      if (draggedData) {
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        if (dropZoneId.includes('-all-day')) {
          // Handle dropping in all-day section
          const datePart = dropZoneId.replace('-all-day', '');
          const newDate = new Date(datePart);
          
          if ('category' in item) {
            // It's a task - make it all-day
            await updateTask(item.id, {
              scheduledDate: newDate,
              scheduledTime: undefined,
              allDay: true,
              updatedAt: new Date()
            });
          } else {
            // It's an event - make it all-day
            const newStartTime = new Date(newDate);
            newStartTime.setHours(0, 0, 0, 0);
            const newEndTime = new Date(newDate);
            newEndTime.setHours(23, 59, 59, 999);
            
            await updateEvent(item.id, {
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: true,
              updatedAt: new Date()
            });
          }
        } else if (dropZoneId.includes('-hour-')) {
          // Handle dropping in specific hour
          const [datePart, hourPart] = dropZoneId.split('-hour-');
          const hour = parseInt(hourPart);
          const newDate = new Date(datePart);
          
          if ('category' in item) {
            // It's a task
            const newScheduledTime = `${hour.toString().padStart(2, '0')}:00`;
            
            await updateTask(item.id, {
              scheduledDate: newDate,
              scheduledTime: newScheduledTime,
              allDay: false,
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
              allDay: false,
              updatedAt: new Date()
            });
          }
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
                  isToday(date) && 'bg-blue-50/50 border-l-2 border-l-blue-500'
                )}
              >
                <div className="sticky top-0 z-10 bg-background p-2 text-center">
                  <div className="text-xs text-muted-foreground">
                    {format(date, 'EEE')}
                  </div>
                  <div className={cn(
                    'text-sm font-semibold',
                    isToday(date) && 'text-blue-600 bg-blue-100 rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                  )}>
                    {format(date, 'd')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          

          {/* All-day section */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="sticky left-0 z-20 w-20 bg-background border-r border-border flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">All day</span>
            </div>
            <div className="flex flex-1">
              {weekDates.map((date, dateIndex) => {
                const allDayEvents = getEventsForDate(date).filter(event => event.allDay);
                const allDayTasks = getTasksForDate(date).filter(task => task.allDay);
                
                return (
                  <DroppableAllDaySlot key={dateIndex} date={date}>
                    <div className="space-y-1">
                      {allDayEvents.map((event) => (
                        <DraggableItem key={event.id} item={event}>
                          <div
                            className="text-xs p-1 rounded cursor-move truncate hover:opacity-80"
                            style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                            }}
                          >
                            {event.title}
                          </div>
                        </DraggableItem>
                      ))}
{allDayTasks.map((task) => (
                         <DraggableItem key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} item={task}>
                           <div
                             className={cn(
                               'text-xs p-1 rounded border cursor-move truncate hover:opacity-80 flex items-center gap-1',
                               task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                               task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                               task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                               task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                               task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200',
                               task.completed && 'opacity-60 line-through'
                             )}
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingTask(task);
                             }}
                           >
                             <Checkbox
                               checked={task.completed}
                               onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                               onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                               className="size-3"
                             />
                             {task.title}
                           </div>
                         </DraggableItem>
                       ))}
                      {allDayEvents.length === 0 && allDayTasks.length === 0 && (
                        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          Drop here
                        </div>
                      )}
                    </div>
                  </DroppableAllDaySlot>
                );
              })}
            </div>
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
                    'flex-1 min-w-[120px] border-r border-border last:border-r-0 relative',
                    isToday(date) && 'bg-blue-50/50 border-l-2 border-l-blue-200'
                  )}
                >
                  {/* Current time indicator for today */}
                  {isToday(date) && (
                    <div 
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{
                        top: `${currentTime.getHours() * HOUR_HEIGHT + currentTime.getMinutes() * (HOUR_HEIGHT / 60)}px`,
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                        <div className="flex-1 h-0.5 bg-red-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Time slots */}
                  <div className="relative">
                    {HOURS.map((hour) => {
                      const events = getEventsForDate(date).filter(event => {
                        if (event.allDay) return false;
                        const eventStart = new Date(event.startTime);
                        return eventStart.getHours() === hour;
                      });
                      const tasks = getTasksForDate(date).filter(task => {
                        if (task.allDay) return false;
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
                                  className="text-xs p-1 rounded bg-blue-100 text-blue-800 border border-blue-200 cursor-move truncate hover:opacity-80"
                                  style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(event);
                                  }}
                                >
                                  {event.title}
                                </div>
                              </DraggableItem>
                            ))}
{tasks.map((task) => (
                                <DraggableItem key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} item={task}>
                                 <div
                                   className={cn(
                                     'text-xs p-1 rounded border cursor-move truncate hover:opacity-80 flex items-center gap-1',
                                     task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                                     task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                                     task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                                     task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                                     task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200',
                                     task.completed && 'opacity-60 line-through'
                                   )}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setEditingTask(task);
                                   }}
                                 >
                                   <Checkbox
                                     checked={task.completed}
                                     onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                                     onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                                     className="size-3"
                                   />
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