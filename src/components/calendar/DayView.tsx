'use client';

import { isToday } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore, useSettingsStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { formatTime } from '@/lib/dateUtils';
import { useResize } from '@/hooks/useResize';
import { calculateOverlapLayout, PositionedLayoutItem } from '@/lib/overlapUtils';

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
  isResizing?: boolean;
}

function DraggableItem({ item, children, isResizing }: DraggableItemProps & { isResizing?: boolean }) {
  const isTask = 'category' in item;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: {
      type: isTask ? 'task' : 'event',
      data: item,
    },
    disabled: isResizing, // Disable dragging when resizing
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
      {children}
    </div>
  );
}

function DroppableHour({ hour, children, isResizing }: { hour: number; children: React.ReactNode; isResizing?: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `hour-${hour}`,
    disabled: isResizing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex border-b border-border',
        !isResizing && 'group',
        isOver && !isResizing && 'bg-accent/20'
      )}
      style={{ height: `${HOUR_HEIGHT}px` }}
    >
      {children}
    </div>
  );
}

function DroppableTimeBlock({ hour, block, children, onClick, isResizing }: { 
  hour: number; 
  block: { start: number; end: number; label: string }; 
  children: React.ReactNode;
  onClick?: () => void;
  isResizing?: boolean;
}) {
  const blockId = `hour-${hour}-block-${block.label}`;
  const { isOver, setNodeRef } = useDroppable({
    id: blockId,
    disabled: isResizing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 transition-colors',
        !isResizing && 'hover:bg-accent/60 cursor-pointer',
        isOver && !isResizing && 'bg-accent/40'
      )}
      onClick={!isResizing ? onClick : undefined}
    >
      {children}
    </div>
  );
}

function DroppableAllDay({ children, onClick, isResizing }: { children: React.ReactNode; onClick?: () => void; isResizing?: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'all-day',
    disabled: isResizing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-b border-border bg-muted/30',
        isOver && !isResizing && 'bg-accent/20'
      )}
      onClick={!isResizing ? onClick : undefined}
    >
      {children}
    </div>
  );
}

interface ResizableItemProps {
  item: Task | Event;
  children: React.ReactNode;
  top: number;
  height: number;
  onResizeStart: (e: React.MouseEvent, handle: 'top' | 'bottom') => void;
  isResizing: boolean;
  resizeHandle?: { type: 'top' | 'bottom'; itemId: string } | null;
}

function ResizableItem({ item, children, top, height, onResizeStart, isResizing, resizeHandle }: ResizableItemProps) {
  const isTask = 'category' in item;
  const isBeingResized = isResizing && resizeHandle?.itemId === item.id;
  const isAnyResizing = isResizing; // Global resize state
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: {
      type: isTask ? 'task' : 'event',
      data: item,
    },
    disabled: isResizing, // Disable dragging when resizing
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
      className={cn(
        "relative h-full",
        !isAnyResizing && "group"
      )}
    >
      {/* Top resize handle */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-2 z-30 cursor-ns-resize opacity-0 transition-opacity',
          !isAnyResizing && 'group-hover:opacity-100',
          isBeingResized && resizeHandle?.type === 'top' && 'opacity-100 bg-primary/20'
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          onResizeStart(e, 'top');
        }}
      />
      
      {/* Main content with drag listeners */}
      <div {...listeners} className="h-full relative z-20">
        {children}
      </div>
      
      {/* Bottom resize handle */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-2 z-30 cursor-ns-resize opacity-0 transition-opacity',
          !isAnyResizing && 'group-hover:opacity-100',
          isBeingResized && resizeHandle?.type === 'bottom' && 'opacity-100 bg-primary/20'
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          onResizeStart(e, 'bottom');
        }}
      />
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
  const { isResizing, resizeHandle, startY, finalDelta, startResize, handleMouseMove, stopResize, calculateResizeResult } = useResize();
  const calendarContainerRef = useRef<HTMLDivElement>(null);

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

  // Calculate overlap layout for positioned items
  const positionedItems = calculateOverlapLayout(timedEvents, timedTasks);

  // Update current time every minute
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time on initial load and date change
  useEffect(() => {
    if (calendarContainerRef.current && isToday(currentDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calculate the scroll position to center current time
      const currentTimePosition = currentHour * HOUR_HEIGHT + currentMinute * (HOUR_HEIGHT / 60);
      const containerHeight = calendarContainerRef.current.clientHeight;
      const scrollPosition = currentTimePosition - (containerHeight / 2);
      
      // Scroll to center the current time
      calendarContainerRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentDate]);

  // Handle mouse move for resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaMinutes = handleMouseMove(e);
      if (deltaMinutes !== undefined && resizeHandle) {
        const result = calculateResizeResult(deltaMinutes);
        
        // Apply optimistic update
        if (resizeHandle.itemType === 'event') {
          const event = resizeHandle.originalItem as Event;
          if (result.newStartTime && result.newEndTime) {
            const optimisticEvent = {
              ...event,
              startTime: result.newStartTime,
              endTime: result.newEndTime,
              updatedAt: new Date()
            } as Event;
            setOptimisticItems(prev => new Map(prev).set(event.id, optimisticEvent));
          }
        } else {
          const task = resizeHandle.originalItem as Task;
          const optimisticTask = {
            ...task,
            ...(result.newScheduledTime && { scheduledTime: result.newScheduledTime }),
            ...(result.newDuration && { duration: result.newDuration }),
            updatedAt: new Date()
          } as Task;
          setOptimisticItems(prev => new Map(prev).set(task.id, optimisticTask));
        }
      }
    };

    const handleGlobalMouseUp = async () => {
      // Immediately stop resizing to prevent any further mouse movement handling
      stopResize();
      
      if (resizeHandle) {
        if (finalDelta !== undefined) {
          const result = calculateResizeResult(finalDelta);
          
          // Apply the actual update
          if (resizeHandle.itemType === 'event') {
            const event = resizeHandle.originalItem as Event;
            if (result.newStartTime && result.newEndTime) {
              try {
                await updateEvent(event.id, {
                  startTime: result.newStartTime,
                  endTime: result.newEndTime,
                  updatedAt: new Date()
                });
                // Remove optimistic update after successful sync
                setOptimisticItems(prev => {
                  const next = new Map(prev);
                  next.delete(event.id);
                  return next;
                });
              } catch (error) {
                console.error('Error updating event:', error);
                // Remove optimistic update on error
                setOptimisticItems(prev => {
                  const next = new Map(prev);
                  next.delete(event.id);
                  return next;
                });
              }
            }
          } else {
            const task = resizeHandle.originalItem as Task;
            try {
              await updateTask(task.id, {
                ...(result.newScheduledTime && { scheduledTime: result.newScheduledTime }),
                ...(result.newDuration && { duration: result.newDuration }),
                updatedAt: new Date()
              });
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(task.id);
                return next;
              });
            } catch (error) {
              console.error('Error updating task:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(task.id);
                return next;
              });
            }
          }
        }
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing, resizeHandle, handleMouseMove, calculateResizeResult, stopResize, updateEvent, updateTask, finalDelta]);

  

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
      <div ref={calendarContainerRef} className="h-full overflow-auto bg-background relative">
        <div className="max-w-4xl mx-auto relative">
          <div className="sticky top-0 z-30 bg-background">
            <DroppableAllDay 
              isResizing={isResizing}
              onClick={() => {
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
                      <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                          className={cn(
                            "text-xs p-1 rounded cursor-move truncate",
                            !isResizing && "hover:opacity-80"
                          )}
                          style={{
                            backgroundColor: event.color + "20",
                            borderColor: event.color,
                          }}
                        >
                          {event.title}
                        </div>
                    ))}
                    
                    {/* All-day tasks */}
                    {allDayTasks.map((task) => (
                      <DraggableItem key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} item={task} isResizing={isResizing && resizeHandle?.itemId === task.id}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className={cn(
                            'p-2 rounded-lg border cursor-move text-sm inline-block mr-2 mb-2',
                            !isResizing && 'hover:opacity-80',
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
              <DroppableHour key={hour} hour={hour} isResizing={isResizing}>
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
                      isResizing={isResizing}
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

            {/* Positioned items with overlap layout - rendered outside the hour slots */}
            <div className="absolute left-20 right-4 top-0 pointer-events-none" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {positionedItems.map((positionedItem) => {
                const isTask = 'category' in positionedItem.data;
                const item = positionedItem.data;
                const top = positionedItem.startMinutes * (HOUR_HEIGHT / 60); // Convert minutes to pixels
                const height = getItemHeight(isTask ? getTaskDuration(item as Task) : getEventDuration(item as Event));
                
                return (
                   <div
                     key={positionedItem.id}
                     className="absolute z-10 pointer-events-auto"
                     style={{
                       top: `${top}px`,
                       height: `${height}px`,
                       left: `${positionedItem.left}%`,
                       width: `${positionedItem.width}%`,
                     }}
                  >
                    <ResizableItem
                        item={item}
                        top={top}
                        height={height}
                        onResizeStart={(e, handle) => {
                          startResize(e, {
                            type: handle,
                            itemId: item.id,
                            itemType: isTask ? 'task' : 'event',
                            originalItem: item
                          }, calendarContainerRef.current!, top, height);
                        }}
                        isResizing={isResizing}
                        resizeHandle={resizeHandle}
                      >
                        {isTask ? (
                          // Task content
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(item as Task);
                            }}
                            className={cn(
                              'h-full p-2 rounded-lg border cursor-move text-sm overflow-hidden',
                              !isResizing && 'hover:opacity-80',
                              (item as Task).category === 'work' && 'bg-blue-100 text-blue-800 border-blue-200',
                              (item as Task).category === 'family' && 'bg-green-100 text-green-800 border-green-200',
                              (item as Task).category === 'personal' && 'bg-orange-100 text-orange-800 border-orange-200',
                              (item as Task).category === 'travel' && 'bg-purple-100 text-purple-800 border-purple-200',
                              (item as Task).category === 'inbox' && 'bg-gray-100 text-gray-800 border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={(item as Task).completed}
                                onCheckedChange={(checked) => handleTaskCompleteToggle(item.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                                onClick={(e) => handleTaskCompleteToggle(item.id, !(item as Task).completed, e)}
                                className="size-4 flex-shrink-0"
                              />
                              <span className={cn('truncate', (item as Task).completed && 'line-through opacity-60')}>
                                {(item as Task).title}
                              </span>
                            </div>
                            {(item as Task).description && (
                              <div className="text-xs opacity-75 mt-1 ml-6 truncate">{(item as Task).description}</div>
                            )}
                          </div>
                        ) : (
                          // Event content
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(item as Event);
                            }}
                            className={cn(
                              "h-full p-2 rounded-lg border cursor-move text-sm overflow-hidden",
                              !isResizing && "hover:opacity-80"
                            )}
                            style={{ 
                              backgroundColor: (item as Event).color + '20', 
                              borderColor: (item as Event).color,
                              color: (item as Event).color 
                            }}
                          >
                            <div className="font-medium truncate">{(item as Event).title}</div>
                            {(item as Event).description && (
                              <div className="text-xs opacity-75 mt-1 truncate">{(item as Event).description}</div>
                            )}
                            <div className="text-xs opacity-75 mt-1">
                              {formatTime(new Date((item as Event).startTime), settings)} - {formatTime(new Date((item as Event).endTime), settings)}
                            </div>
                          </div>
                        )}
                      </ResizableItem>
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