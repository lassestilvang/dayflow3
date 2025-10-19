'use client';

import { format, isSameMonth, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { useDraggable, useDroppable, useDndMonitor, DragOverlay } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

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
    opacity: isDragging ? 0.3 : 1,
    transition: 'none',
  } : {
    transition: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className=""
    >
      <div {...listeners} className="h-full relative cursor-move">
        {children}
      </div>
    </div>
  );
}

function DayItems({ events, tasks, onTaskComplete, onEditEvent, onEditTask, maxItems }: {
  events: Event[];
  tasks: Task[];
  onTaskComplete: (taskId: string, completed: boolean, e: React.MouseEvent) => void;
  onEditEvent: (event: Event) => void;
  onEditTask: (task: Task) => void;
  maxItems: number;
}) {
  const allItems = [
    ...events.map(event => ({ type: 'event' as const, data: event })),
    ...tasks.map(task => ({ type: 'task' as const, data: task }))
  ];

  const visibleItems = allItems.slice(0, maxItems);
  const remainingCount = allItems.length - maxItems;

  return (
    <div className="flex-1 space-y-1 overflow-hidden">
      {visibleItems.map((item, index) => {
        if (item.type === 'event') {
          const event = item.data;
          return (
            <DraggableItem key={event.id} item={event}>
              <div
                className="text-xs p-1 rounded truncate cursor-move hover:opacity-80 h-6 flex items-center"
                style={{ 
                  backgroundColor: event.color + '20', 
                  color: event.color 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditEvent(event);
                }}
              >
                {event.title}
              </div>
            </DraggableItem>
          );
        } else {
          const task = item.data;
          return (
            <DraggableItem key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} item={task}>
              <div
                className={cn(
                  'text-xs p-1 rounded truncate cursor-move hover:opacity-80 flex items-center gap-1 h-6',
                  task.category === 'work' && 'bg-blue-100 text-blue-800',
                  task.category === 'family' && 'bg-green-100 text-green-800',
                  task.category === 'personal' && 'bg-orange-100 text-orange-800',
                  task.category === 'travel' && 'bg-purple-100 text-purple-800',
                  task.category === 'inbox' && 'bg-gray-100 text-gray-800',
                  task.completed && 'opacity-60 line-through'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTask(task);
                }}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => onTaskComplete(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                  onClick={(e) => onTaskComplete(task.id, !task.completed, e)}
                  className="size-3"
                />
                {task.title}
              </div>
            </DraggableItem>
          );
        }
      })}
      
      {remainingCount > 0 && (
        <div className="text-xs text-muted-foreground cursor-pointer hover:text-foreground h-6 flex items-center">
          +{remainingCount} more
        </div>
      )}
    </div>
  );
}

function DroppableDay({ date, children, isCurrentMonth, isCurrentDay, onClick }: { 
  date: Date; 
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
  onClick?: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `date-${format(date, 'yyyy-MM-dd')}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-background min-h-full p-2 border border-border hover:bg-accent/50 cursor-pointer flex flex-col',
        !isCurrentMonth && 'bg-muted/30',
        isCurrentDay && 'bg-primary/5',
        isOver && 'bg-accent/30 ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function MonthView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const { setEditingTask, setEditingEvent, setCreateDialogData } = useUIStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);
const [draggedElement, setDraggedElement] = useState<{item: Task | Event, element: React.ReactNode} | null>(null);
  const [maxItemsPerCell, setMaxItemsPerCell] = useState(3);
  const gridRef = useRef<HTMLDivElement>(null);
  const [optimisticItems, setOptimisticItems] = useState<Map<string, Task | Event>>(new Map());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
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
  
  // Calculate starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust for Monday start

  // Add empty cells for days before month starts
  const calendarDays = Array(adjustedStartDay).fill(null).concat(monthDays);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleTaskCompleteToggle = async (taskId: string, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(taskId, { 
      completed, 
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date() 
    });
  };

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
      
      if (draggedData && dropZoneId.startsWith('date-')) {
        const dateStr = dropZoneId.replace('date-', '');
        const newDate = new Date(dateStr);
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        if ('category' in item) {
          // It's a task - move to new date, keep existing time or set to 9:00 AM
          const newScheduledTime = item.scheduledTime || '09:00';
          
          const optimisticTask = {
            ...item,
            scheduledDate: newDate,
            scheduledTime: newScheduledTime,
            updatedAt: new Date()
          } as Task;
          
          // Apply optimistic update immediately
          setOptimisticItems(prev => new Map(prev).set(item.id, optimisticTask));
          
          // Update in background
          await updateTask(item.id, {
            scheduledDate: newDate,
            scheduledTime: newScheduledTime,
            updatedAt: new Date()
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
          
          const optimisticEvent = {
            ...item,
            startTime: newStartTime,
            endTime: newEndTime,
            updatedAt: new Date()
          } as Event;
          
          // Apply optimistic update immediately
          setOptimisticItems(prev => new Map(prev).set(item.id, optimisticEvent));
          
          // Update in background
          await updateEvent(item.id, {
            startTime: newStartTime,
            endTime: newEndTime,
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
      
      setDraggedItem(null);
    },
  });

  const handleDayClick = (date: Date) => {
    setCreateDialogData({
      date,
      allDay: true,
    });
  };

  

  // Calculate max items per cell based on available height
  useEffect(() => {
    const calculateMaxItems = () => {
      if (gridRef.current) {
        const gridHeight = gridRef.current.clientHeight;
        const headerHeight = 32; // Week day headers height
        const availableHeight = gridHeight - headerHeight;
        const itemHeight = 24; // Height of each item (h-6 = 24px)
        const padding = 16; // Container padding
        const dateNumberHeight = 28; // Height for date number
        const cellPadding = 16; // Cell padding
        const availableItemHeight = availableHeight / 6 - dateNumberHeight - cellPadding; // Divide by 6 rows
        const maxItems = Math.max(1, Math.floor(availableItemHeight / itemHeight));
        setMaxItemsPerCell(maxItems);
      }
    };

    calculateMaxItems();
    window.addEventListener('resize', calculateMaxItems);
    return () => window.removeEventListener('resize', calculateMaxItems);
  }, []);

  return (
    <>
      <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background p-4">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-px bg-border mb-px flex-shrink-0">
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
          <div ref={gridRef} className="grid grid-cols-7 gap-px bg-border flex-1 auto-rows-fr">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="bg-muted/50 min-h-full" />;
              }

              const itemsForDate = getItemsForDate(date);
              const events = itemsForDate.events;
              const tasks = itemsForDate.tasks;
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);

return (
                 <DroppableDay 
                      key={date.toISOString()} 
                      date={date}
                      isCurrentMonth={isCurrentMonth}
                      isCurrentDay={isCurrentDay}
                      onClick={() => handleDayClick(date)}
                    >
                    {/* Date number */}
                    <div 
className={cn(
                        'text-sm font-medium mb-1 flex-shrink-0',
                        !isCurrentMonth && 'text-muted-foreground',
                        isCurrentDay && 'text-primary font-bold'
                      )}
                     onClick={() => handleDayClick(date)}
                   >
                     {format(date, 'd')}
                   </div>

                   {/* Events and tasks preview */}
                   <DayItems
                     events={events}
                     tasks={tasks}
                     onTaskComplete={handleTaskCompleteToggle}
                     onEditEvent={setEditingEvent}
                     onEditTask={setEditingTask}
                     maxItems={maxItemsPerCell}
                   />
                 </DroppableDay>
               );
            })}
          </div>
        </div>
</div>

      {/* Drag overlay rendered at root level */}
      <DragOverlay>
        {draggedItem && (
          <div className="text-xs p-1 rounded bg-background max-w-48">
            {'category' in draggedItem ? (
              <div className={cn(
                'flex items-center gap-1 h-6',
                draggedItem.category === 'work' && 'bg-blue-100 text-blue-800',
                draggedItem.category === 'family' && 'bg-green-100 text-green-800',
                draggedItem.category === 'personal' && 'bg-orange-100 text-orange-800',
                draggedItem.category === 'travel' && 'bg-purple-100 text-purple-800',
                draggedItem.category === 'inbox' && 'bg-gray-100 text-gray-800',
                draggedItem.completed && 'opacity-60 line-through'
              )}>
                <Checkbox checked={draggedItem.completed} className="size-3" disabled />
                {draggedItem.title}
              </div>
            ) : (
              <div
                className="truncate h-6 flex items-center"
                style={{ 
                  backgroundColor: draggedItem.color + '20', 
                  color: draggedItem.color 
                }}
              >
                {draggedItem.title}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </>
  );
}