'use client';

import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Draggable } from '@fullcalendar/interaction';
import { useCalendarStore, useEventStore, useTaskStore, useUIStore } from '@/store';
import { Task, Event } from '@/types';

interface FullCalendarComponentProps {
  sidebarRef?: React.RefObject<HTMLElement | null>;
}

export function FullCalendarComponent({ sidebarRef }: FullCalendarComponentProps) {
  const { view, setCurrentDate, setView } = useCalendarStore();
  const { events, updateEvent } = useEventStore();
  const { tasks, updateTask } = useTaskStore();
  const { setEditingEvent, setEditingTask, setCreateDialogData } = useUIStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [, setDraggableInstance] = useState<Draggable | null>(null);

  // Convert tasks and events to FullCalendar event format
  const calendarEvents = [
    // Convert events
    ...events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      allDay: event.allDay,
      backgroundColor: event.color + '20',
      borderColor: event.color,
      textColor: event.color,
      extendedProps: {
        type: 'event',
        data: event
      }
    })),
    // Convert tasks
    ...tasks.filter(task => task.scheduledDate).map(task => {
      let start = new Date(task.scheduledDate!);
      let end: Date;
      
      if (task.allDay) {
        end = new Date(task.scheduledDate!);
        end.setHours(23, 59, 59, 999);
      } else if (task.scheduledTime) {
        const [hours, minutes] = task.scheduledTime.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
        end = new Date(start);
        if (task.duration) {
          end.setMinutes(end.getMinutes() + task.duration);
        } else {
          end.setHours(end.getHours() + 1); // Default 1 hour
        }
      } else {
        start.setHours(9, 0, 0, 0); // Default 9 AM
        end = new Date(start);
        end.setHours(end.getHours() + 1);
      }

      const categoryColors = {
        work: '#3b82f6',
        family: '#22c55e',
        personal: '#f97316',
        travel: '#a855f7',
        inbox: '#6b7280'
      };

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        allDay: task.allDay,
        backgroundColor: categoryColors[task.category] + '20',
        borderColor: categoryColors[task.category],
        textColor: categoryColors[task.category],
        extendedProps: {
          type: 'task',
          data: task
        }
      };
    })
  ];

  // Map view state to FullCalendar view names
  const getFullCalendarView = () => {
    switch (view) {
      case 'day':
        return 'timeGridDay';
      case 'week':
        return 'timeGridWeek';
      case 'month':
        return 'dayGridMonth';
      default:
        return 'timeGridWeek';
    }
  };

  // Initialize draggable for external elements
  useEffect(() => {
    if (sidebarRef?.current) {
      const newDraggable = new Draggable(sidebarRef.current, {
        itemSelector: '.fc-draggable-item',
        eventData: (eventEl) => {
          const taskId = eventEl.getAttribute('data-task-id');
          const eventId = eventEl.getAttribute('data-event-id');
          
          if (taskId) {
            // Find the task in store
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              return {
                title: task.title,
                duration: task.duration ? `${task.duration}m` : '01:00',
                extendedProps: {
                  type: 'task',
                  data: task,
                  fromSidebar: true
                }
              };
            }
          } else if (eventId) {
            // Find the event in store
            const event = events.find(e => e.id === eventId);
            if (event) {
              return {
                title: event.title,
                duration: '01:00',
                extendedProps: {
                  type: 'event',
                  data: event,
                  fromSidebar: true
                }
              };
            }
          }
          
          return {
            title: eventEl.innerText.trim(),
            duration: '01:00'
          };
        }
      });

      setDraggableInstance(newDraggable);

      return () => {
        if (newDraggable) {
          newDraggable.destroy();
        }
      };
    }
  }, [sidebarRef, tasks, events]);

  // Handle date navigation
  const handleDatesSet = (dateInfo: any) => {
    if (dateInfo.start) {
      setCurrentDate(new Date(dateInfo.start));
    }
  };

  // Handle view change
  const handleViewChange = (viewInfo: any) => {
    const newView = viewInfo.view.type;
    let mappedView: 'day' | 'week' | 'month';
    
    switch (newView) {
      case 'timeGridDay':
        mappedView = 'day';
        break;
      case 'timeGridWeek':
        mappedView = 'week';
        break;
      case 'dayGridMonth':
        mappedView = 'month';
        break;
      default:
        mappedView = 'week';
    }
    
    setView(mappedView);
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const { extendedProps } = clickInfo.event;
    
    if (extendedProps.type === 'event') {
      setEditingEvent(extendedProps.data as Event);
    } else if (extendedProps.type === 'task') {
      setEditingTask(extendedProps.data as Task);
    }
  };

  // Handle event drop (drag and drop within calendar)
  const handleEventDrop = (dropInfo: any) => {
    const { event } = dropInfo;
    const { extendedProps } = event;
    
    if (extendedProps.type === 'event') {
      const eventData = extendedProps.data as Event;
      updateEvent(eventData.id, {
        startTime: event.start,
        endTime: event.end,
        allDay: event.allDay,
        updatedAt: new Date()
      });
    } else if (extendedProps.type === 'task') {
      const taskData = extendedProps.data as Task;
      const newScheduledDate = new Date(event.start);
      let newScheduledTime: string | undefined;
      
      if (!event.allDay) {
        const hours = event.start.getHours().toString().padStart(2, '0');
        const minutes = event.start.getMinutes().toString().padStart(2, '0');
        newScheduledTime = `${hours}:${minutes}`;
      }
      
      updateTask(taskData.id, {
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime,
        allDay: event.allDay,
        updatedAt: new Date()
      });
    }
  };

  // Handle event resize
  const handleEventResize = (resizeInfo: any) => {
    const { event } = resizeInfo;
    const { extendedProps } = event;
    
    if (extendedProps.type === 'event') {
      const eventData = extendedProps.data as Event;
      updateEvent(eventData.id, {
        startTime: event.start,
        endTime: event.end,
        updatedAt: new Date()
      });
    } else if (extendedProps.type === 'task') {
      const taskData = extendedProps.data as Task;
      const newScheduledDate = new Date(event.start);
      const hours = event.start.getHours().toString().padStart(2, '0');
      const minutes = event.start.getMinutes().toString().padStart(2, '0');
      const newScheduledTime = `${hours}:${minutes}`;
      
      // Calculate new duration in minutes
      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      
      updateTask(taskData.id, {
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime,
        duration: Math.round(duration),
        updatedAt: new Date()
      });
    }
  };

  // Handle external drop (from sidebar)
  const handleDrop = (dropInfo: any) => {
    const { draggedEl, date, allDay } = dropInfo;
    const taskId = draggedEl.getAttribute('data-task-id');
    const eventId = draggedEl.getAttribute('data-event-id');
    
    if (taskId) {
      // Handle task drop
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newScheduledDate = new Date(date);
        let newScheduledTime: string | undefined;
        
        if (!allDay) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          newScheduledTime = `${hours}:${minutes}`;
        }
        
        updateTask(task.id, {
          scheduledDate: newScheduledDate,
          scheduledTime: newScheduledTime,
          allDay,
          updatedAt: new Date()
        });
      }
    } else if (eventId) {
      // Handle event drop
      const event = events.find(e => e.id === eventId);
      if (event) {
        const newStartTime = new Date(date);
        let newEndTime: Date;
        
        if (allDay) {
          newEndTime = new Date(date);
          newEndTime.setHours(23, 59, 59, 999);
        } else {
          newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour
        }
        
        updateEvent(event.id, {
          startTime: newStartTime,
          endTime: newEndTime,
          allDay,
          updatedAt: new Date()
        });
      }
    }
  };

  // Handle date click for creating new items
  const handleDateClick = (clickInfo: any) => {
    setCreateDialogData({
      date: clickInfo.date,
      allDay: clickInfo.allDay,
      time: !clickInfo.allDay ? clickInfo.dateStr.split('T')[1]?.substring(0, 5) : undefined
    });
  };

  // Custom event rendering for tasks with checkboxes
  const handleEventContent = (eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    
    if (extendedProps.type === 'task') {
      const task = extendedProps.data as Task;
      return {
        html: `
          <div class="fc-task-event">
            <div class="fc-task-checkbox">
              <input type="checkbox" 
                ${task.completed ? 'checked' : ''} 
                onclick="event.stopPropagation(); window.handleTaskToggle('${task.id}', ${!task.completed})"
                style="margin-right: 4px; pointer-events: auto;"
              />
            </div>
            <div class="fc-task-title ${task.completed ? 'completed' : ''}">
              ${eventInfo.event.title}
            </div>
          </div>
        `
      };
    }
    
    return null; // Use default rendering for events
  };

  // Global function for task checkbox toggle
  useEffect(() => {
    (window as any).handleTaskToggle = async (taskId: string, completed: boolean) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask(taskId, {
          completed,
          completedAt: completed ? new Date() : undefined,
          updatedAt: new Date()
        });
      }
    };
  }, [tasks, updateTask]);

  return (
    <div className="h-full bg-background">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={getFullCalendarView()}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        editable={true}
        droppable={true}
        nowIndicator={true}
        height="100%"
        contentHeight="100%"
        aspectRatio={undefined}
        datesSet={handleDatesSet}
        viewDidMount={handleViewChange}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        drop={handleDrop}
        dateClick={handleDateClick}
        eventContent={handleEventContent}
        eventMouseEnter={(info) => {
          // Add hover effect
          info.el.style.cursor = 'pointer';
        }}
        eventMouseLeave={(info) => {
          // Remove hover effect
          info.el.style.cursor = '';
        }}
      />
      
      <style jsx global>{`
        .fc-task-event {
          display: flex;
          align-items: center;
          padding: 2px 4px;
          gap: 4px;
        }
        
        .fc-task-checkbox input {
          width: 12px;
          height: 12px;
          cursor: pointer;
        }
        
        .fc-task-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .fc-task-title.completed {
          text-decoration: line-through;
          opacity: 0.6;
        }
        
        /* Override FullCalendar styles to match our design */
        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border));
        }
        
        .fc-theme-standard .fc-col-header-cell {
          background-color: hsl(var(--background));
          border-color: hsl(var(--border));
        }
        
        .fc-theme-standard .fc-daygrid-day-number {
          color: hsl(var(--foreground));
        }
        
        .fc-theme-standard .fc-day-today {
          background-color: hsl(var(--primary) / 0.1);
        }
        
        .fc-theme-standard .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
          font-weight: bold;
        }
        
        .fc-theme-standard .fc-event {
          border-radius: 6px;
          font-size: 12px;
          padding: 2px 4px;
        }
        
        .fc-theme-standard .fc-event:hover {
          opacity: 0.8;
        }
        
        .fc-theme-standard .fc-timegrid-slot {
          border-color: hsl(var(--border));
        }
        
        .fc-theme-standard .fc-timegrid-axis {
          border-color: hsl(var(--border));
        }
        
        /* Current time indicator */
        .fc-timegrid-now-indicator-arrow {
          color: hsl(var(--destructive));
        }
        
        .fc-timegrid-now-indicator-line {
          border-color: hsl(var(--destructive));
        }
      `}</style>
    </div>
  );
}