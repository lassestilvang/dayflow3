"use client";

import { format, isToday, isSameDay } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useDraggable, useDroppable, useDndMonitor } from "@dnd-kit/core";
import {
  useCalendarStore,
  useEventStore,
  useTaskStore,
  useUIStore,
  useSettingsStore,
} from "@/store";
import { cn } from "@/lib/utils";
import { Task, Event } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime } from "@/lib/dateUtils";
import { useResize } from "@/hooks/useResize";
import { calculateDayLayout, PositionedLayoutItem } from '@/lib/overlapUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour
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
  return (
    start.getHours() * HOUR_HEIGHT + start.getMinutes() * (HOUR_HEIGHT / 60)
  );
}

function getTaskTopPosition(task: Task): number {
  if (task.scheduledTime) {
    const [hours, minutes] = task.scheduledTime.split(":").map(Number);
    return hours * HOUR_HEIGHT + minutes * (HOUR_HEIGHT / 60);
  }
  return 0; // default to top if no time specified
}

function getItemHeight(duration: number): number {
  return Math.max(duration * (HOUR_HEIGHT / 60), 30); // minimum 30px height for week view
}



function DroppableSlot({
  date,
  hour,
  children,
  onClick,
  isResizing,
}: {
  date: Date;
  hour: number;
  children: React.ReactNode;
  onClick?: () => void;
  isResizing?: boolean;
}) {
  const slotId = `${format(date, "yyyy-MM-dd")}-hour-${hour}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    disabled: isResizing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-border relative",
        isOver && !isResizing && "bg-accent/20",
        !isResizing && "group",
      )}
      style={{ height: `${HOUR_HEIGHT}px` }}
    >
      {children}
    </div>
  );
}

function DroppableTimeBlock({
  date,
  hour,
  block,
  children,
  onClick,
  isResizing,
}: {
  date: Date;
  hour: number;
  block: { start: number; end: number; label: string };
  children: React.ReactNode;
  onClick?: () => void;
  isResizing?: boolean;
}) {
  const blockId = `${format(date, "yyyy-MM-dd")}-hour-${hour}-block-${block.label}`;
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

function DroppableAllDaySlot({
  date,
  children,
  onClick,
  isResizing,
}: {
  date: Date;
  children: React.ReactNode;
  onClick?: () => void;
  isResizing?: boolean;
}) {
  const slotId = `${format(date, "yyyy-MM-dd")}-all-day`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    disabled: isResizing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[120px] border-r border-border last:border-r-0 p-1 min-h-[60px] relative",
        isToday(date) && "bg-primary/5 border-l-2 border-l-primary",
        isOver && !isResizing && "bg-accent/20",
      )}
      onClick={!isResizing ? onClick : undefined}
    >
      {children}
    </div>
  );
}

// ResizableItem component for WeekView (same as DayView but adapted for week view)
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
      type: isTask ? "task" : "event",
      data: item,
    },
    disabled: isResizing, // Disable dragging when resizing
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        transition: 'none',
      }
    : {
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
          'absolute top-0 left-0 right-0 h-1 z-30 cursor-ns-resize opacity-0 transition-opacity',
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
          'absolute bottom-0 left-0 right-0 h-1 z-30 cursor-ns-resize opacity-0 transition-opacity',
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

export function WeekView() {
  const { getWeekDates } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const { setEditingTask, setEditingEvent, setCreateDialogData } = useUIStore();
  const { settings } = useSettingsStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [optimisticItems, setOptimisticItems] = useState<Map<string, Task | Event>>(new Map());
  const { isResizing, resizeHandle, startY, finalDelta, startResize, handleMouseMove, stopResize, calculateResizeResult } = useResize();
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  const weekDates = getWeekDates();

  // Helper function to get optimistic item if available
  const getOptimisticItem = (item: Task | Event): Task | Event => {
    return optimisticItems.get(item.id) || item;
  };

  // Helper function to get all items that should appear on a specific date (including optimistic updates)
  const getItemsForDate = (date: Date) => {
    const events = getEventsForDate(date);
    const tasks = getTasksForDate(date);
    
    // Filter out items that have been optimistically moved away from this date
    const filteredEvents = events.filter(event => {
      const optimisticEvent = optimisticItems.get(event.id) as Event;
      if (optimisticEvent) {
        // If there's an optimistic update, check if it's still on this date
        return isSameDay(optimisticEvent.startTime, date);
      }
      return true; // No optimistic update, keep original
    });
    
    const filteredTasks = tasks.filter(task => {
      const optimisticTask = optimisticItems.get(task.id) as Task;
      if (optimisticTask) {
        // If there's an optimistic update, check if it's still on this date
        return optimisticTask.scheduledDate && isSameDay(optimisticTask.scheduledDate, date);
      }
      return true; // No optimistic update, keep original
    });
    
    // Also check optimistic items that might have been moved to this date from other dates
    const optimisticEventsForDate: Event[] = [];
    const optimisticTasksForDate: Task[] = [];
    
    optimisticItems.forEach((optimisticItem) => {
      if ('category' in optimisticItem) {
        // It's a task
        const task = optimisticItem as Task;
        if (task.scheduledDate && isSameDay(task.scheduledDate, date)) {
          // Check if this task is not already in the filtered tasks for this date
          if (!filteredTasks.find(t => t.id === task.id)) {
            optimisticTasksForDate.push(task);
          }
        }
      } else {
        // It's an event
        const event = optimisticItem as Event;
        if (isSameDay(event.startTime, date)) {
          // Check if this event is not already in the filtered events for this date
          if (!filteredEvents.find(e => e.id === event.id)) {
            optimisticEventsForDate.push(event);
          }
        }
      }
    });
    
    return {
      events: [...filteredEvents.map(e => getOptimisticItem(e) as Event), ...optimisticEventsForDate],
      tasks: [...filteredTasks.map(t => getOptimisticItem(t) as Task), ...optimisticTasksForDate]
    };
  };

  const handleTaskCompleteToggle = async (
    taskId: string,
    completed: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    await updateTask(taskId, {
      completed,
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date(),
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

  // Auto-scroll to current time on initial load and when week changes
  useEffect(() => {
    if (calendarContainerRef.current) {
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
  }, [weekDates]);

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
      const item = active.data.current as
        | { type: "task" | "event"; data: Task | Event }
        | undefined;
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

      const draggedData = active.data.current as
        | { type: "task" | "event"; data: Task | Event; source?: string }
        | undefined;
      const dropZoneId = over.id as string;

      if (draggedData) {
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === "sidebar";

        if (dropZoneId.includes("-all-day")) {
          // Handle dropping in all-day section
          const datePart = dropZoneId.replace("-all-day", "");
          const newDate = new Date(datePart);

          if ("category" in item) {
            // It's a task - make it all-day
            const optimisticTask = {
              ...item,
              scheduledDate: newDate,
              scheduledTime: undefined,
              allDay: true,
              updatedAt: new Date(),
            } as Task;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticTask));
            
            // Update in background
            await updateTask(item.id, {
              scheduledDate: newDate,
              scheduledTime: undefined,
              allDay: true,
              updatedAt: new Date(),
            }).then(() => {
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }).catch(error => {
              console.error('Error updating task:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            });
          } else {
            // It's an event - make it all-day
            const newStartTime = new Date(newDate);
            newStartTime.setHours(0, 0, 0, 0);
            const newEndTime = new Date(newDate);
            newEndTime.setHours(23, 59, 59, 999);

            const optimisticEvent = {
              ...item,
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: true,
              updatedAt: new Date(),
            } as Event;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticEvent));
            
            // Update in background
            await updateEvent(item.id, {
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: true,
              updatedAt: new Date(),
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
        } else if (dropZoneId.includes("-hour-")) {
          // Handle dropping in specific hour or time block
          let hour: number;
          let minute: number = 0;
          let newDate: Date;
          
          if (dropZoneId.includes('-block-')) {
            // Handle dropping in specific time block
            const parts = dropZoneId.split('-hour-');
            const datePart = parts[0];
            const timePart = parts[1];
            const timeParts = timePart.split('-block-');
            hour = parseInt(timeParts[0]);
            minute = parseInt(timeParts[1]);
            newDate = new Date(datePart);
          } else {
            // Handle dropping in hour (default to 0 minutes)
            const [datePart, hourPart] = dropZoneId.split("-hour-");
            hour = parseInt(hourPart);
            minute = 0;
            newDate = new Date(datePart);
          }

          if ("category" in item) {
            // It's a task
            const newScheduledTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

            const optimisticTask = {
              ...item,
              scheduledDate: newDate,
              scheduledTime: newScheduledTime,
              allDay: false,
              updatedAt: new Date(),
            } as Task;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticTask));
            
            // Update in background
            await updateTask(item.id, {
              scheduledDate: newDate,
              scheduledTime: newScheduledTime,
              allDay: false,
              updatedAt: new Date(),
            }).then(() => {
              // Remove optimistic update after successful sync
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            }).catch(error => {
              console.error('Error updating task:', error);
              // Remove optimistic update on error
              setOptimisticItems(prev => {
                const next = new Map(prev);
                next.delete(item.id);
                return next;
              });
            });
          } else {
            // It's an event
            let newStartTime: Date;
            let newEndTime: Date;

            if (fromSidebar) {
              // Event from sidebar (unlikely but handle it)
              newStartTime = new Date(newDate);
              newStartTime.setHours(hour, minute, 0, 0);
              newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
            } else {
              // Existing event being rescheduled
              const originalStart = new Date(item.startTime);
              const originalEnd = new Date(item.endTime);
              const duration = originalEnd.getTime() - originalStart.getTime();

              newStartTime = new Date(newDate);
              newStartTime.setHours(hour, minute, 0, 0);
              newEndTime = new Date(newStartTime.getTime() + duration);
            }

            const optimisticEvent = {
              ...item,
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: false,
              updatedAt: new Date(),
            } as Event;
            
            // Apply optimistic update immediately
            setOptimisticItems(prev => new Map(prev).set(item.id, optimisticEvent));
            
            // Update in background
            await updateEvent(item.id, {
              startTime: newStartTime,
              endTime: newEndTime,
              allDay: false,
              updatedAt: new Date(),
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

  return (
    <>
      <div ref={calendarContainerRef} className="h-full overflow-auto bg-background">
        <div className="relative min-w-[800px]">
          {/* Sticky header container */}
          <div className="sticky top-0 z-30 bg-background">
            {/* Header row */}
            <div className="flex">
              {/* Empty corner cell for time column header */}
              <div className="sticky left-0 z-20 w-20 bg-background border-r border-border border-b" />

              {/* Date headers */}
              {weekDates.map((date, dateIndex) => (
                <div
                  key={dateIndex}
className={cn(
        "flex-1 min-w-[120px] border-r border-border last:border-r-0 border-b",
        isToday(date) && "bg-primary/5 border-l-2 border-l-primary",
      )}
                >
                  <div className="bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">
                      {format(date, "EEE")}
                    </div>
                    <div
className={cn(
        "text-sm font-semibold",
        isToday(date) &&
          "text-primary-foreground bg-primary rounded-full w-7 h-7 flex items-center justify-center mx-auto",
      )}
                    >
                      {format(date, "d")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky all-day section */}
            <div className="flex border-b border-border bg-muted/30">
              <div className="sticky left-0 z-20 w-20 bg-background border-r border-border flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-muted-foreground font-medium">
                  All day
                </span>
              </div>
              <div className="flex flex-1">
                {weekDates.map((date, dateIndex) => {
                  const itemsForDate = getItemsForDate(date);
                  const allDayEvents = itemsForDate.events.filter((event) => event.allDay);
                  const allDayTasks = itemsForDate.tasks.filter((task) => task.allDay);

                  return (
                    <DroppableAllDaySlot
                      key={dateIndex}
                      date={date}
                      isResizing={isResizing}
                      onClick={() => {
                        setCreateDialogData({
                          date,
                          allDay: true,
                        });
                      }}
                    >
                      <div className="space-y-1">
{allDayEvents.map((event) => (
                           <div
                               key={event.id}
                               className={cn(
                               "text-xs p-1 rounded cursor-move truncate",
                               !isResizing && "hover:opacity-80"
                             )}
                               style={{
                                 backgroundColor: event.color + "20",
                                 borderColor: event.color,
                               }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setEditingEvent(event);
                               }}
                             >
                               {event.title}
                             </div>
                         ))}
{allDayTasks.map((task) => (
                           <div
                               key={task.id}
className={cn(
                                  "text-xs p-1 rounded border cursor-move truncate flex items-center gap-1",
                                  !isResizing && "hover:opacity-80",
                                 task.category === "work" &&
                                   "bg-blue-100 text-blue-800 border-blue-200",
                                 task.category === "family" &&
                                   "bg-green-100 text-green-800 border-green-200",
                                 task.category === "personal" &&
                                   "bg-orange-100 text-orange-800 border-orange-200",
                                 task.category === "travel" &&
                                   "bg-purple-100 text-purple-800 border-purple-200",
                                 task.category === "inbox" &&
                                   "bg-gray-100 text-gray-800 border-gray-200",
                                 task.completed && "opacity-60 line-through",
                               )}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setEditingTask(task);
                               }}
                             >
                               <Checkbox
                                 checked={task.completed}
                                 onCheckedChange={(checked) =>
                                   handleTaskCompleteToggle(
                                     task.id,
                                     checked as boolean,
                                     {
                                       stopPropagation: () => {},
                                     } as React.MouseEvent,
                                   )
                                 }
                                 onClick={(e) =>
                                   handleTaskCompleteToggle(
                                     task.id,
                                     !task.completed,
                                     e,
                                   )
                                 }
                                 className="size-3"
                               />
                               {task.title}
                             </div>
                         ))}
                        {allDayEvents.length === 0 &&
                          allDayTasks.length === 0 && (
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
          </div>

          {/* Time slots grid */}
          <div className="flex">
            {/* Time column */}
            <div className="sticky left-0 z-20 w-20 bg-background border-r border-border">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border flex items-start justify-end pr-2 pt-1"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatTime(createHourDate(hour), settings)}
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
        "flex-1 min-w-[120px] border-r border-border last:border-r-0 relative",
        isToday(date) &&
          "bg-primary/5 border-l-2 border-l-primary",
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

                  {/* Time slots with positioned events and tasks */}
                  <div
                    className="relative"
                    style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Time slots for drop zones */}
                    {HOURS.map((hour) => (
                      <DroppableSlot
                        key={hour}
                        date={date}
                        hour={hour}
                        isResizing={isResizing}
                      >
                        <div className="flex w-full h-full">
                          {TIME_BLOCKS.map((block) => (
                            <DroppableTimeBlock
                              key={`${hour}-${block.label}`}
                              date={date}
                              hour={hour}
                              block={block}
                              isResizing={isResizing}
                              onClick={() => {
                                const time = `${hour.toString().padStart(2, "0")}:${block.label}`;
                                setCreateDialogData({
                                  date,
                                  time,
                                  allDay: false,
                                });
                              }}
                            >
                              {/* Empty slot indicator */}
                              <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                {block.label}
                              </div>
                            </DroppableTimeBlock>
                          ))}
                        </div>
                      </DroppableSlot>
                    ))}

                    {/* Positioned items with overlap layout for this date - rendered outside the hour slots */}
                    <div
                      className="absolute left-1 right-1 top-0 pointer-events-none z-10"
                      style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
                    >
                      {(() => {
                        const itemsForDate = getItemsForDate(date);
                        const positionedItems = calculateDayLayout(
                          itemsForDate.events.filter(event => !event.allDay),
                          itemsForDate.tasks.filter(task => !task.allDay && task.scheduledTime)
                        );

                        return positionedItems.map((positionedItem) => {
                          const isTask = 'category' in positionedItem.data;
                          const item = positionedItem.data;
                          const top = positionedItem.startMinutes * (HOUR_HEIGHT / 60); // Convert minutes to pixels
                          const height = getItemHeight(isTask ? getTaskDuration(item as Task) : getEventDuration(item as Event));
                          
                          return (
                            <div
                              key={positionedItem.id}
                              className="absolute z-20 pointer-events-auto"
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
                                    className={cn(
                                      "h-full text-xs p-1 rounded border cursor-move truncate overflow-hidden flex items-start gap-1",
                                      !isResizing && "hover:opacity-80",
                                      (item as Task).category === "work" &&
                                        "bg-blue-100 text-blue-800 border-blue-200",
                                      (item as Task).category === "family" &&
                                        "bg-green-100 text-green-800 border-green-200",
                                      (item as Task).category === "personal" &&
                                        "bg-orange-100 text-orange-800 border-orange-200",
                                      (item as Task).category === "travel" &&
                                        "bg-purple-100 text-purple-800 border-purple-200",
                                      (item as Task).category === "inbox" &&
                                        "bg-gray-100 text-gray-800 border-gray-200",
                                      (item as Task).completed && "opacity-60 line-through",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTask(item as Task);
                                    }}
                                  >
                                    <Checkbox
                                      checked={(item as Task).completed}
                                      onCheckedChange={(checked) =>
                                        handleTaskCompleteToggle(
                                          item.id,
                                          checked as boolean,
                                          {
                                            stopPropagation: () => {},
                                          } as React.MouseEvent,
                                        )
                                      }
                                      onClick={(e) =>
                                        handleTaskCompleteToggle(
                                          item.id,
                                          !(item as Task).completed,
                                          e,
                                        )
                                      }
                                      className="size-3 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="truncate">{(item as Task).title}</span>
                                  </div>
                                ) : (
                                  // Event content
                                  <div
                                    className={cn(
                                      "h-full text-xs p-1 rounded cursor-move truncate overflow-hidden",
                                      !isResizing && "hover:opacity-80"
                                    )}
                                    style={{
                                      backgroundColor: (item as Event).color + "20",
                                      borderColor: (item as Event).color,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEvent(item as Event);
                                    }}
                                  >
                                    <div className="font-medium truncate">
                                      {(item as Event).title}
                                    </div>
                                    <div className="opacity-75">
                                      {formatTime(
                                        new Date((item as Event).startTime),
                                        settings,
                                      )}{" "}
                                      -{" "}
                                      {formatTime(
                                        new Date((item as Event).endTime),
                                        settings,
                                      )}
                                    </div>
                                  </div>
                                )}
                              </ResizableItem>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </>
  );
}