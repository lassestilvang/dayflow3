'use client';

import { format, isToday, setHours } from 'date-fns';
import { useState } from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useCalendarStore, useEventStore, useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // pixels per hour

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
    >
      {children}
    </div>
  );
}

export function DayView() {
  const { currentDate } = useCalendarStore();
  const { getEventsForDate, updateEvent } = useEventStore();
  const { getTasksForDate, updateTask } = useTaskStore();
  const [draggedItem, setDraggedItem] = useState<Task | Event | null>(null);

  const events = getEventsForDate(currentDate);
  const tasks = getTasksForDate(currentDate);

  

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
      
      if (draggedData && dropZoneId.startsWith('hour-')) {
        const hour = parseInt(dropZoneId.replace('hour-', ''));
        const item = draggedData.data as Task | Event;
        const fromSidebar = draggedData.source === 'sidebar';
        
        if ('category' in item) {
          // It's a task
          const newScheduledDate = new Date(currentDate);
          newScheduledDate.setHours(0, 0, 0, 0); // Reset time to midnight
          
          const newScheduledTime = `${hour.toString().padStart(2, '0')}:00`;
          
          
          
          try {
            await updateTask(item.id, {
              scheduledDate: newScheduledDate,
              scheduledTime: newScheduledTime,
              updatedAt: new Date()
            });
          } catch (error) {
            console.error('Error updating task:', error);
          }
        } else {
          // It's an event
          let newStartTime: Date;
          let newEndTime: Date;
          
          if (fromSidebar) {
            // Event from sidebar (unlikely but handle it)
            newStartTime = new Date(currentDate);
            newStartTime.setHours(hour, 0, 0, 0);
            newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
          } else {
            // Existing event being rescheduled
            const originalStart = new Date(item.startTime);
            const originalEnd = new Date(item.endTime);
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            newStartTime = new Date(currentDate);
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

  const handleTimeSlotClick = (hour: number) => {
    console.log('Create event at', currentDate, hour);
  };

  return (
    <>
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
              <DroppableHour key={hour} hour={hour}>
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
                      <DraggableItem key={event.id} item={event}>
                        <div
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
                      </DraggableItem>
                    ))}

                    {/* Tasks */}
                    {slotTasks.map((task) => (
                      <DraggableItem key={task.id} item={task}>
                        <div
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
                      </DraggableItem>
                    ))}
                  </div>

                  {/* Empty slot indicator */}
                  {slotEvents.length === 0 && slotTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to add event or task
                    </div>
                  )}
                </div>
              </DroppableHour>
            );
          })}
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