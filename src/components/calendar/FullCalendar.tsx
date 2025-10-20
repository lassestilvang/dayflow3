"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Draggable } from "@fullcalendar/interaction";
import {
  useCalendarStore,
  useEventStore,
  useTaskStore,
  useUIStore,
  useSettingsStore,
} from "@/store";
import { Task, Event } from "@/types";
import { createFullCalendarFormatters, formatDate } from "@/lib/dateUtils";
import { format } from "date-fns";

interface FullCalendarComponentProps {
  sidebarRef?: React.RefObject<HTMLElement | null>;
}

export function FullCalendarComponent({
  sidebarRef,
}: FullCalendarComponentProps) {
  const { view, setCurrentDate, setView } = useCalendarStore();
  const { events, updateEvent } = useEventStore();
  const { tasks, updateTask } = useTaskStore();
  const { setEditingEvent, setEditingTask, setCreateDialogData } = useUIStore();
  const { settings } = useSettingsStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [, setDraggableInstance] = useState<Draggable | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Get color for task category
  const getTaskColor = useCallback((category: string, completed: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> =
      {
        inbox: { bg: "#6b728020", border: "#6b7280", text: "#6b7280" },
        overdue: { bg: "#dc262620", border: "#dc2626", text: "#dc2626" },
        work: { bg: "#2563eb20", border: "#2563eb", text: "#2563eb" },
        family: { bg: "#16a34a20", border: "#16a34a", text: "#16a34a" },
        personal: { bg: "#ea580c20", border: "#ea580c", text: "#ea580c" },
        travel: { bg: "#9333ea20", border: "#9333ea", text: "#9333ea" },
      };

    if (completed) {
      return { bg: "#22c55e20", border: "#22c55e", text: "#22c55e" };
    }

    return colors[category] || colors.inbox;
  }, []);

  // Convert single task to FullCalendar event format
  const convertTaskToEvent = useCallback(
    (task: Task) => {
      let start = new Date(task.scheduledDate!);
      let end: Date;

      if (task.allDay) {
        end = new Date(task.scheduledDate!);
        end.setHours(23, 59, 59, 999);
      } else if (task.scheduledTime) {
        const [hours, minutes] = task.scheduledTime.split(":").map(Number);
        start.setHours(hours, minutes, 0, 0);

        if (task.duration) {
          end = new Date(start.getTime() + task.duration * 60 * 1000);
        } else {
          end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
        }
      } else {
        end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
      }

      const colors = getTaskColor(task.category, task.completed);

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        allDay: task.allDay,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          type: "task",
          data: task,
        },
      };
    },
    [getTaskColor],
  );

  // Convert single event to FullCalendar event format
  const convertEventToEvent = useCallback((event: Event) => {
    let start = event.startTime;
    let end = event.endTime;

    // For all-day events, ensure proper date handling
    if (event.allDay) {
      start = new Date(event.startTime);
      start.setHours(0, 0, 0, 0);
      end = new Date(event.startTime);
      end.setDate(end.getDate() + 1); // End should be next day for all-day events
      end.setHours(0, 0, 0, 0);
    }

    const converted = {
      id: event.id,
      title: event.title,
      start,
      end,
      allDay: event.allDay,
      backgroundColor: event.color + "20",
      borderColor: event.color,
      textColor: event.color,
      extendedProps: {
        type: "event",
        data: event,
      },
    };
    console.log("Converted event:", {
      ...converted,
      startValid: !isNaN(start.getTime()),
      endValid: !isNaN(end.getTime()),
      startStr: start.toString(),
      endStr: end.toString(),
    });
    return converted;
  }, []);

  // Initialize calendar events
  useEffect(() => {
    const newEvents = [
      ...events.map(convertEventToEvent),
      ...tasks.filter((task) => task.scheduledDate).map(convertTaskToEvent),
    ];
    console.log("Calendar events:", newEvents);
    console.log("Raw events:", events);
    console.log("Raw tasks:", tasks);
    setCalendarEvents(newEvents);
  }, [events, tasks, convertEventToEvent, convertTaskToEvent]);

  // Create formatters based on user settings
  const formatters = React.useMemo(() => {
    return createFullCalendarFormatters(settings);
  }, [settings]);

  // Get FullCalendar view name from our store view
  const getFullCalendarView = () => {
    switch (view) {
      case "day":
        return "timeGridDay";
      case "week":
        return "timeGridWeek";
      case "month":
        return "dayGridMonth";
      default:
        return "timeGridWeek";
    }
  };

  // Initialize draggable for external elements
  useEffect(() => {
    if (sidebarRef?.current) {
      const newDraggable = new Draggable(sidebarRef.current, {
        itemSelector: ".fc-draggable-item",
        eventData: (eventEl) => {
          const taskId = eventEl.getAttribute("data-task-id");
          const eventId = eventEl.getAttribute("data-event-id");

          if (taskId) {
            // Find the task in store
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
              return {
                title: task.title,
                duration: task.duration ? `${task.duration}m` : "01:00",
                extendedProps: {
                  type: "task",
                  data: task,
                  fromSidebar: true,
                },
              };
            }
          } else if (eventId) {
            // Find the event in store
            const event = events.find((e) => e.id === eventId);
            if (event) {
              return {
                title: event.title,
                duration: "01:00",
                extendedProps: {
                  type: "event",
                  data: event,
                  fromSidebar: true,
                },
              };
            }
          }

          return {
            title: eventEl.innerText.trim(),
            duration: "01:00",
          };
        },
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
    let mappedView: "day" | "week" | "month";

    switch (newView) {
      case "timeGridDay":
        mappedView = "day";
        break;
      case "timeGridWeek":
        mappedView = "week";
        break;
      case "dayGridMonth":
        mappedView = "month";
        break;
      default:
        mappedView = "week";
    }

    setView(mappedView);
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const { extendedProps } = clickInfo.event;

    if (extendedProps.type === "event") {
      setEditingEvent(extendedProps.data as Event);
    } else if (extendedProps.type === "task") {
      setEditingTask(extendedProps.data as Task);
    }
  };

  // Handle event drop (drag and drop within calendar)
  const handleEventDrop = (dropInfo: any) => {
    const { event } = dropInfo;
    const { extendedProps } = event;

    if (extendedProps.type === "event") {
      const eventData = extendedProps.data as Event;
      updateEvent(eventData.id, {
        startTime: event.start,
        endTime: event.end,
        allDay: event.allDay,
        updatedAt: new Date(),
      });
    } else if (extendedProps.type === "task") {
      const taskData = extendedProps.data as Task;
      const newScheduledDate = new Date(event.start);
      let newScheduledTime: string | undefined;

      if (!event.allDay) {
        const hours = event.start.getHours().toString().padStart(2, "0");
        const minutes = event.start.getMinutes().toString().padStart(2, "0");
        newScheduledTime = `${hours}:${minutes}`;
      }

      updateTask(taskData.id, {
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime,
        allDay: event.allDay,
        updatedAt: new Date(),
      });
    }
  };

  // Handle event resize
  const handleEventResize = (resizeInfo: any) => {
    const { event } = resizeInfo;
    const { extendedProps } = event;

    if (extendedProps.type === "event") {
      const eventData = extendedProps.data as Event;
      updateEvent(eventData.id, {
        startTime: event.start,
        endTime: event.end,
        updatedAt: new Date(),
      });
    } else if (extendedProps.type === "task") {
      const taskData = extendedProps.data as Task;
      const newScheduledDate = new Date(event.start);
      let newScheduledTime: string | undefined;

      if (!event.allDay) {
        const hours = event.start.getHours().toString().padStart(2, "0");
        const minutes = event.start.getMinutes().toString().padStart(2, "0");
        newScheduledTime = `${hours}:${minutes}`;
      }

      // Calculate new duration in minutes
      const duration =
        (event.end.getTime() - event.start.getTime()) / (1000 * 60);

      updateTask(taskData.id, {
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime,
        duration: Math.round(duration),
        allDay: event.allDay,
        updatedAt: new Date(),
      });
    }
  };

  // Handle external drop (from sidebar)
  const handleDrop = (dropInfo: any) => {
    const { draggedEl, date, allDay } = dropInfo;
    const taskId = draggedEl.getAttribute("data-task-id");
    const eventId = draggedEl.getAttribute("data-event-id");

    if (taskId) {
      // Handle task drop
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const newScheduledDate = new Date(date);
        let newScheduledTime: string | undefined;

        if (!allDay) {
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          newScheduledTime = `${hours}:${minutes}`;
        }

        updateTask(task.id, {
          scheduledDate: newScheduledDate,
          scheduledTime: newScheduledTime,
          allDay,
          updatedAt: new Date(),
        });
      }
    } else if (eventId) {
      // Handle event drop
      const event = events.find((e) => e.id === eventId);
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
          updatedAt: new Date(),
        });
      }
    }
  };

  // Handle date click for creating new items
  const handleDateClick = (clickInfo: any) => {
    setCreateDialogData({
      date: clickInfo.date,
      allDay: clickInfo.allDay,
      time: !clickInfo.allDay
        ? clickInfo.dateStr.split("T")[1]?.substring(0, 5)
        : undefined,
    });
  };

  // Custom event rendering for tasks with checkboxes
  const handleEventContent = (eventInfo: any) => {
    const { extendedProps } = eventInfo.event;

    console.log("handleEventContent called for:", {
      title: eventInfo.event.title,
      type: extendedProps.type,
      start: eventInfo.event.start,
      end: eventInfo.event.end,
      allDay: eventInfo.event.allDay,
    });

    if (extendedProps.type === "task") {
      const task = extendedProps.data as Task;
      return {
        html: `
          <div class="fc-task-event">
            <div class="fc-task-checkbox">
              <input type="checkbox"
                ${task.completed ? "checked" : ""}
                onclick="event.stopPropagation(); window.handleTaskToggle('${task.id}', ${!task.completed})"
                style="margin-right: 4px; pointer-events: auto;"
              />
            </div>
            <div class="fc-task-title ${task.completed ? "completed" : ""}">
              ${eventInfo.event.title}
            </div>
          </div>
        `,
      };
    }

    if (extendedProps.type === "event") {
      // Custom rendering for events to ensure they show up
      return {
        html: `
          <div class="fc-event-event">
            <div class="fc-event-title">
              ${eventInfo.event.title}
            </div>
          </div>
        `,
      };
    }

    return null; // Use default rendering for anything else
  };

  // Global function for task checkbox toggle
  useEffect(() => {
    (window as any).handleTaskToggle = async (
      taskId: string,
      completed: boolean,
    ) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await updateTask(taskId, {
          completed,
          completedAt: completed ? new Date() : undefined,
          updatedAt: new Date(),
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
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth",
        }}
        events={calendarEvents}
        editable={true}
        droppable={true}
        nowIndicator={true}
        height="100%"
        contentHeight="100%"
        aspectRatio={undefined}
        expandRows={true}
        dayMaxEventRows={true}
        dayMaxEvents={true}
        fixedWeekCount={false}
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
          info.el.style.cursor = "pointer";
        }}
        eventMouseLeave={(info) => {
          // Remove hover effect
          info.el.style.cursor = "";
        }}
        // Week start setting
        firstDay={settings.weekStart === "monday" ? 1 : 0}
        // Week numbers setting
        weekNumbers={settings.displayWeekNumbers}
        // Custom formatters based on user settings
        slotLabelFormat={
          settings.timeFormat === "12h"
            ? { hour: "numeric", minute: "2-digit", hour12: true }
            : { hour: "2-digit", minute: "2-digit", hour12: false }
        }
        eventTimeFormat={
          settings.timeFormat === "12h"
            ? { hour: "numeric", minute: "2-digit", hour12: true }
            : { hour: "2-digit", minute: "2-digit", hour12: false }
        }
        titleFormat={{
          month: "long",
          year: "numeric",
        }}
        dayHeaderFormat={{
          weekday: "short",
          day: "numeric",
        }}
        views={{
          dayGridMonth: {
            dayHeaderFormat: {
              weekday: "short",
            },
          },
        }}
      />

      <style jsx global>{`
        .fc .fc-toolbar.fc-header-toolbar {
          margin: 0.69em 0;
        }

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
          font-size: 0.875rem;
        }

        .fc-task-title.completed {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .fc-event-event {
          padding: 2px 6px;
          font-size: 0.875rem;
        }

        .fc-event-title {
          font-weight: 500;
        }

        /* FullCalendar styling to match our theme */
        .fc {
          font-family: inherit;
          --fc-border-color: var(--border);
        }

        .fc-toolbar-title {
          color: var(--foreground);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .fc-button {
          background: var(--muted);
          color: var(--muted-foreground);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .fc-button:hover {
          background: var(--accent);
          color: var(--accent-foreground);
        }

        .fc-button-active {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
        }

        .fc-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fc-today-button:disabled {
          opacity: 0.5;
        }

        .fc-daygrid-day-number {
          color: var(--foreground);
        }

        .fc-col-header-cell {
          background: color-mix(in oklch, var(--muted) 30%, transparent);
          color: var(--muted-foreground);
        }

        .fc-day-today {
          background: color-mix(in oklch, var(--primary) 10%, transparent) !important;
        }

        .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          font-weight: 600;
          color: var(--primary);
        }

        .fc-timegrid-slot {
          border-top: 1px solid var(--border);
        }

        .fc-timegrid-axis {
          color: var(--muted-foreground);
        }

        .fc-event {
          border-radius: 0.25rem;
          font-size: 0.875rem;
          padding: 2px 6px;
        }

        .fc-event:hover {
          opacity: 0.8;
        }

        .fc-now-indicator {
          border-color: var(--destructive);
        }

        .fc-now-indicator-arrow {
          border-top-color: var(--destructive);
        }

        /* Grid lines for day grid (month view) */
        .fc-daygrid-day-frame {
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border));
          border-color: var(--border);
        }

        .fc-daygrid-day:last-child .fc-daygrid-day-frame {
          border-right: none;
        }

        .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          border-right: 1px solid hsl(var(--border));
          border-bottom: 1px solid hsl(var(--border));
        }

        /* Grid lines for time grid (week/day views) */
        .fc-timegrid-col {
          border-right: 1px solid var(--border);
          border-color: var(--border);
        }

        .fc-timegrid-col:last-child {
          border-right: none;
        }

        .fc-timegrid-body {
          border-top: 1px solid var(--border);
          border-color: var(--border);
        }

        /* Horizontal grid lines in time grid */
        .fc-timegrid-slot-minor {
          border-top: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
          border-color: color-mix(in oklch, var(--border) 30%, transparent);
        }

        .fc-timegrid-slot-major {
          border-top: 1px solid var(--border);
          border-color: var(--border);
        }

        /* Column headers */
        .fc-col-header {
          border-bottom: 1px solid var(--border);
          border-color: var(--border);
        }

        .fc-col-header-cell {
          border-right: 1px solid var(--border);
          border-color: var(--border);
        }

        .fc-col-header-cell:last-child {
          border-right: none;
        }



        /* Compact event styling */
        .fc-daygrid-event {
          font-size: 0.75rem !important;
          padding: 1px 3px !important;
          margin-bottom: 1px !important;
          line-height: 1.2 !important;
        }

        .fc-daygrid-more-link {
          font-size: 0.75rem !important;
          padding: 1px 3px !important;
        }

        /* FullCalendar popover/modal for "+X more" */
        .fc-popover {
          background: var(--popover);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        }

        .dark .fc-theme-standard .fc-popover {
          background: transparent;
          border: none;
        }

        .fc-popover-title {
          background: var(--muted);
          color: var(--foreground);
          border-bottom: 1px solid var(--border);
          border-radius: 0.5rem 0.5rem 0 0;
          font-weight: 600;
          padding: 0.5rem 1rem;
        }

        .fc-theme-standard .fc-popover-header {
          background: var(--muted);
          color: var(--foreground);
          border-bottom: 1px solid var(--border);
          border-radius: 0.5rem 0.5rem 0 0;
          font-weight: 600;
          padding: 0.5rem 1rem;
        }

        .fc-popover-body {
          background: var(--popover);
          color: var(--foreground);
          padding: 0.5rem;
        }

        .fc-popover .fc-event {
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--foreground);
          margin-bottom: 0.25rem;
        }

        .fc-popover .fc-event:hover {
          background: var(--accent);
          color: var(--accent-foreground);
        }
      `}</style>
    </div>
  );
}
