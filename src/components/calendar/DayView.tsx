'use client';

import { isToday, setHours, startOfDay, isSameDay } from 'date-fns';
import { useState, useEffect } from 'react';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore, useSettingsStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { formatTime } from '@/lib/dateUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // pixels per hour
const TIME_BLOCKS = [
  { start: 0, end: 14, label: '00' },
  { start: 15, end: 29, label: '15' },
  { start: 30, end: 44, label: '30' },
  { start: 45, end: 59, label: '45' }
];

// Helper function to create a date with specific hour and minutes set to 0
function createHourDate(hour: number): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Helper functions for duration calculations
function getEventDuration(event: Event): number {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60); // duration in minutes
}

function getTaskDuration(task: Task): number {
  if (task.duration) {
    return task.duration; // duration in minutes
  }
  return 30; // default 30 minutes for tasks without specified duration
}

function getEventTopPosition(event: Event): number {
  const start = new Date(event.startTime);
  return start.getHours() * HOUR_HEIGHT + start.getMinutes() * (HOUR_HEIGHT / 60);
}

function getTaskTopPosition(task: Task): number {
  if (task.scheduledTime) {
    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    return hours * HOUR_HEIGHT + minutes * (HOUR_HEIGHT / 60);
  }
  return 0; // default to top if no time specified
}

function getItemHeight(duration: number): number {
  return Math.max(duration * (HOUR_HEIGHT / 60), 40); // minimum 40px height
}

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
    transition: 'none',
  } : {
    transition: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="h-full"
    >
      <div {...listeners} className="h-full relative z-20">
        {children}
      </div>
    </div>
  );
}

function DroppableHour({ hour, children }: { hour: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `hour-${hour}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex border-b border-border group',
        isOver && 'bg-accent/20'
      )}
      style={{ height: `${HOUR_HEIGHT}px` }}
    >
      {children}
    </div>
  );
}

function DroppableTimeBlock({ hour, block, children, onClick }: { 
  hour: number; 
  block: { start: number; end: number; label: string }; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const blockId = `hour-${hour}-block-${block.label}`;
  const { isOver, setNodeRef } = useDroppable({
    id: blockId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 hover:bg-accent/30 cursor-pointer transition-colors',
        isOver && 'bg-accent/20'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DroppableAllDay({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'all-day',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-b border-border bg-muted/30',
        isOver && 'bg-accent/20'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function DayView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const { setEditingTask, setEditingEvent, setCreateDialogData } = useUIStore();
  const { settings } = useSettingsStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [optimisticItems, setOptimisticItems] = useState<Map<string, Task | Event>>(new Map());

  const events = getEventsForDate(currentDate);
  const tasks = getTasksForDate(currentDate);

  // Helper function to get optimistic item if available
  const getOptimisticItem = (item: Task | Event): Task | Event => {
    return optimisticItems.get(item.id) || item;
  };

  // Apply optimistic updates to items
  const eventsWithOptimistic = events.map(event => getOptimisticItem(event) as Event);
  const tasksWithOptimistic = tasks.map(task => getOptimisticItem(task) as Task);

  // Filter all-day items with optimistic updates
  const allDayEvents = eventsWithOptimistic.filter(event => event.allDay);
  const allDayTasks = tasksWithOptimistic.filter(task => task.allDay);
  const timedEvents = eventsWithOptimistic.filter(event => !event.allDay);
  const timedTasks = tasksWithOptimistic.filter(task => !task.allDay);

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
        // Disable transitions globally during drag
        document.body.classList.add('dragging');
      }
    },
    onDragEnd: async (event) => {
      const { active, over } = event;
      
      // Re-enable transitions
      document.body.classList.remove('dragging');
      
      if (!over) {
        setDraggedItem(null);
        return;
      }

      const draggedData = active.data.current as { type: 'task' | 'event'; data: Task | Event; source?: string } | undefined;
      const dropZoneId = over.id as string;
      
      if (draggedData) {
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        if (dropZoneId === 'all-day') {
          // Handle dropping in all-day section
          if ('category' in item) {
            // It's a task - make it all-day
            const newScheduledDate = new Date(currentDate);
            newScheduledDate.setHours(0, 0, 0, 0);
            
            const optimisticTask = {
              ...item,
              scheduledDate: newScheduledDate,
              scheduledTime: undefined,
              allDay: true,
              updatedAt: new Date()
            } as Task;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticTask));
            
            // Update in background
            try {
              await updateTask(item.id, {
                scheduledDate: newScheduledDate,
                scheduledTime: undefined,
                allDay: true,
                updatedAt: new Date()
              });
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            } catch (error) {
              console.error('Error updating task:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }
          } else {
            // It's an event - make it all-day
            const newStartTime = new Date(currentDate);
            newStartTime.setHours(0, 0, 0, 0);
            const newEndTime = new Date(currentDate);
            newEndTime.setHours(23, 59, 59, 999);
            
            const optimisticEvent = {
              ...item,
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: true,
              updatedAt: new Date()
            } as Event;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticEvent));
            
            // Update in background
            await updateEvent(item.id, {
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: true,
              updatedAt: new Date()
            }).then(() => {
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }).catch(error => {
              console.error('Error updating event:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            });
          }
        } else if (dropZoneId.startsWith('hour-')) {
          // Handle dropping in specific hour or time block
          let hour: number;
          let minute: number = 0;
          
          if (dropZoneId.includes('-block-')) {
            // Handle dropping in specific time block
            const parts = dropZoneId.split('-');
            hour = parseInt(parts[1]);
            const blockLabel = parts[3];
            minute = parseInt(blockLabel);
          } else {
            // Handle dropping in hour (default to 0 minutes)
            hour = parseInt(dropZoneId.replace('hour-', ''));
            minute = 0;
          }
          
          if ('category' in item) {
            // It's a task
            const newScheduledDate = new Date(currentDate);
            newScheduledDate.setHours(0, 0, 0, 0); // Reset time to midnight
            
            const newScheduledTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            const optimisticTask = {
              ...item,
              scheduledDate: newScheduledDate,
              scheduledTime: newScheduledTime,
              allDay: false,
              updatedAt: new Date()
            } as Task;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticTask));
            
            // Update in background
            try {
              await updateTask(item.id, {
                scheduledDate: newScheduledDate,
                scheduledTime: newScheduledTime,
                allDay: false,
                updatedAt: new Date()
              });
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            } catch (error) {
              console.error('Error updating task:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }
          } else {
            // It's an event
            let newStartTime: Date;
            let newEndTime: Date;
            
            if (fromSidebar) {
              // Event from sidebar (unlikely but handle it)
              newStartTime = new Date(currentDate);
              newStartTime.setHours(hour, minute, 0, 0);
              newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
            } else {
              // Existing event being rescheduled
              const originalStart = new Date(item.startTime);
              const originalEnd = new Date(item.endTime);
              const duration = originalEnd.getTime() - originalStart.getTime();
              
              newStartTime = new Date(currentDate);
              newStartTime.setHours(hour, minute, 0, 0);
              newEndTime = new Date(newStartTime.getTime() + duration);
            }
            
            const optimisticEvent = {
              ...item,
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: false,
              updatedAt: new Date()
            } as Event;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticEvent));
            
            // Update in background
            await updateEvent(item.id, {
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: false,
              updatedAt: new Date()
            }).then(() => {
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }).catch(error => {
              console.error('Error updating event:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            });
          }
        }
      }
      
      setDraggedItem(null);
    },
  });

  const handleTimeSlotClick = (hour: number, minute: number) => {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setCreateDialogData({
      date: currentDate,
      time,
      allDay: false,
    });
  };

  const handleTaskCompleteToggle = async (taskId: string, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(taskId, { 
      completed, 
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date() 
    });
  };

return (
    <>
      <div className="h-full overflow-auto bg-background relative">
        <div className="max-w-4xl mx-auto relative">
          <div className="sticky top-0 z-30 bg-background">
            <DroppableAllDay onClick={() => {
              setCreateDialogData({
                date: currentDate,
                allDay: true,
              });
            }}>
              <div className="flex">
                <div className="w-20 py-2 pr-4 text-right text-sm font-medium text-muted-foreground sticky left-0 bg-background">
                  All day
                </div>
                <div className="flex-1 p-2">
                  <div className="space-y-2">
                    {/* All-day events */}
                    {allDayEvents.map((event) => (
                      <DraggableItem key={event.id} item={event}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                          className="p-2 rounded-lg border cursor-move text-sm hover:opacity-80 inline-block mr-2 mb-2"
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
                        </div>
                      </DraggableItem>
                    ))}
                    
                    {/* All-day tasks */}
                    {allDayTasks.map((task) => (
                      <DraggableItem key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} item={task}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className={cn(
                            'p-2 rounded-lg border cursor-move text-sm hover:opacity-80 inline-block mr-2 mb-2',
                            task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                            task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                            task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                            task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                            task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                              onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                              className="size-4"
                            />
                            <span className={cn(task.completed && 'line-through opacity-60')}>
                              {task.title}
                            </span>
                          </div>
                          {task.description && (
                            <div className="text-xs opacity-75 mt-1 ml-6">{task.description}</div>
                          )}
                        </div>
                      </DraggableItem>
                    ))}
                    
                    {/* Empty all-day slot indicator */}
                    {allDayEvents.length === 0 && allDayTasks.length === 0 && (
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        Drag items here to make them all-day
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DroppableAllDay>
          </div>

          {/* Time slots with positioned events and tasks */}
          <div className="relative" style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}>
            {/* Current time indicator */}
            {isToday(currentDate) && (
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
            {/* Time labels and drop zones */}
            {HOURS.map((hour) => (
              <DroppableHour key={hour} hour={hour}>
                {/* Time label */}
<div className="w-20 py-4 pr-4 text-right text-sm text-muted-foreground font-medium sticky left-0 z-20">
                  {formatTime(createHourDate(hour), settings)}
                </div>

                {/* Content area with 4 time blocks */}
                <div className="flex-1 flex" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {TIME_BLOCKS.map((block) => (
                    <DroppableTimeBlock
                      key={`${hour}-${block.label}`}
                      hour={hour}
                      block={block}
                      onClick={() => handleTimeSlotClick(hour, block.start)}
                    >
                      {/* Empty slot indicator */}
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        {block.label}
                      </div>
                    </DroppableTimeBlock>
                  ))}
                </div>
               </DroppableHour>
             ))}

            {/* Positioned events - rendered outside the hour slots */}
            <div className="absolute left-20 right-4 top-0 pointer-events-none" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {timedEvents.map((event) => {
                const top = getEventTopPosition(event);
                const height = getItemHeight(getEventDuration(event));
                
return (
                   <div
                     key={event.id}
                     className="absolute z-10 pointer-events-auto"
                     style={{
                       top: `${top}px`,
                       height: `${height}px`,
                       width: '100%',
                     }}
                  >
                    <DraggableItem item={event}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                        }}
                        className="h-full p-2 rounded-lg border cursor-move text-sm hover:opacity-80 overflow-hidden"
                        style={{ 
                          backgroundColor: event.color + '20', 
                          borderColor: event.color,
                          color: event.color 
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.description && (
                          <div className="text-xs opacity-75 mt-1 truncate">{event.description}</div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {formatTime(new Date(event.startTime), settings)} - {formatTime(new Date(event.endTime), settings)}
                        </div>
                      </div>
                    </DraggableItem>
                  </div>
                );
              })}

              {/* Positioned tasks - rendered outside the hour slots */}
              {timedTasks.map((task) => {
                const top = getTaskTopPosition(task);
                const height = getItemHeight(getTaskDuration(task));
                
return (
                   <div
                     key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`}
                     className="absolute z-10 pointer-events-auto"
                     style={{
                       top: `${top}px`,
                       height: `${height}px`,
                       width: '100%',
                     }}
                  >
                    <DraggableItem item={task}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                        className={cn(
                          'h-full p-2 rounded-lg border cursor-move text-sm hover:opacity-80 overflow-hidden',
                          task.category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                          task.category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                          task.category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                          task.category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                          task.category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                            onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                            className="size-4 flex-shrink-0"
                          />
                          <span className={cn('truncate', task.completed && 'line-through opacity-60')}>
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <div className="text-xs opacity-75 mt-1 ml-6 truncate">{task.description}</div>
                        )}
                      </div>
                    </DraggableItem>
                  </div>
                );
              })}
            </div>
          </div>
         </div>
       </div>

       
     </>
   );
}