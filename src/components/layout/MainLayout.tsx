'use client'; 

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { DndContext, 
         pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { useResizable } from '@/hooks/useResizable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnifiedForm } from '@/components/forms/UnifiedForm';

import { useUIStore, useTaskStore, useEventStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { 
    sidebarOpen, 
    editingTask, 
    editingEvent, 
    createDialogData,
    setEditingTask, 
    setEditingEvent,
    setCreateDialogData
  } = useUIStore();
  const { updateTask, addTask, deleteTask } = useTaskStore();
  const { updateEvent, addEvent, deleteEvent } = useEventStore();
  const [showUnifiedDialog, setShowUnifiedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState<{ type: 'task' | 'event'; data: Partial<Task> | Partial<Event> } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { width, isResizing, handleMouseDown } = useResizable({
    defaultWidth: 256,
    minWidth: 200,
    maxWidth: 400,
    storageKey: 'dayflow-sidebar-width'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-handle create dialog data by defaulting to task creation
  useEffect(() => {
    if (createDialogData) {
      const taskData = {
        scheduledDate: createDialogData.date,
        scheduledTime: createDialogData.time,
        allDay: createDialogData.allDay || false,
      };

      // If endDate is provided, calculate duration for tasks
      if (createDialogData.endDate && !createDialogData.allDay) {
        const durationMs = createDialogData.endDate.getTime() - createDialogData.date.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        if (durationMinutes > 0) {
          (taskData as any).duration = durationMinutes;
        }
      }

      setInitialFormData({ type: 'task', data: taskData });
      setCreateDialogData(null);
      setShowUnifiedDialog(true);
    }
  }, [createDialogData, setCreateDialogData, setShowUnifiedDialog, setInitialFormData]);

  

  const handleUnifiedUpdate = async (data: Partial<Task> | Partial<Event>, type: 'task' | 'event') => {
    try {
      if (type === 'task') {
        const taskData = data as Partial<Task>;
        
        // If we're editing an event but converting to task, delete the event and create a task
        if (editingEvent) {
          // Convert event to task
          await addTask({
            userId: 'user-1', // TODO: Get from auth context
            title: taskData.title || editingEvent.title,
            description: taskData.description || editingEvent.description,
            category: taskData.category || 'inbox',
            priority: taskData.priority || 'medium',
            completed: false,
            dueDate: taskData.dueDate,
            scheduledDate: taskData.scheduledDate || editingEvent.startTime,
            scheduledTime: taskData.scheduledTime,
            allDay: taskData.allDay || editingEvent.allDay,
            duration: taskData.duration,
            subtasks: taskData.subtasks,
          });
          
          // Delete the original event
          await deleteEvent(editingEvent.id);
          setEditingEvent(null);
        } else if (editingTask) {
          // Regular task update
          await updateTask(editingTask.id, taskData);
          setEditingTask(null);
        }
      } else {
        const eventData = data as Partial<Event>;
        
        // If we're editing a task but converting to event, delete the task and create an event
        if (editingTask) {
          // Convert task to event
          const startTime = eventData.startTime || (editingTask.scheduledDate ? new Date(editingTask.scheduledDate) : new Date());
          let endTime = eventData.endTime || new Date();
          
          // If no end time provided, set it 1 hour after start time
          if (!eventData.endTime) {
            endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
          }
          
          await addEvent({
            userId: 'user-1', // TODO: Get from auth context
            title: eventData.title || editingTask.title,
            description: eventData.description || editingTask.description,
            type: eventData.type || 'meeting',
            startTime,
            endTime,
            allDay: eventData.allDay || editingTask.allDay,
            location: eventData.location || '',
            color: eventData.color || '#3b82f6',
            attendees: eventData.attendees,
          });
          
          // Delete the original task
          await deleteTask(editingTask.id);
          setEditingTask(null);
        } else if (editingEvent) {
          // Regular event update
          await updateEvent(editingEvent.id, eventData as Partial<Event>);
          setEditingEvent(null);
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  

  const handleCreate = async (data: Partial<Task> | Partial<Event>, type: 'task' | 'event') => {
    if (type === 'task') {
      const taskData = data as Partial<Task>;
      await addTask({
        userId: 'user-1', // TODO: Get from auth context
        title: taskData.title || '',
        description: taskData.description || '',
        category: taskData.category || 'inbox',
        priority: taskData.priority || 'medium',
        completed: false,
        dueDate: taskData.dueDate,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        allDay: taskData.allDay || false,
        duration: taskData.duration,
        subtasks: taskData.subtasks,
      });
    } else {
      const eventData = data as Partial<Event>;
      await addEvent({
        userId: 'user-1', // TODO: Get from auth context
        title: eventData.title || '',
        description: eventData.description || '',
        type: eventData.type || 'meeting',
        startTime: eventData.startTime || new Date(),
        endTime: eventData.endTime || new Date(),
        allDay: eventData.allDay || false,
        location: eventData.location || '',
        color: eventData.color || '#3b82f6',
        attendees: eventData.attendees,
      });
    }
    setShowUnifiedDialog(false);
    setInitialFormData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
    >
      <div className={cn(
          'h-screen flex bg-background',
          isResizing && 'cursor-col-resize'
        )}>
        {/* Sidebar */}
        <div 
          className={cn(
            'transition-all duration-300 ease-in-out relative',
            sidebarOpen ? 'opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
          style={{ 
            width: sidebarOpen ? `${width}px` : '0px',
            minWidth: sidebarOpen ? '200px' : '0px',
            maxWidth: sidebarOpen ? '400px' : '0px'
          }}
        >
          <div className="h-full">
            <Sidebar ref={sidebarRef} onResizeMouseDown={handleMouseDown} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {React.isValidElement(children) 
              ? React.cloneElement(children, { sidebarRef } as any)
              : children
            }
          </main>
        </div>
      </div>

      {/* Task Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <UnifiedForm
              type="task"
              task={editingTask}
              onSubmit={handleUnifiedUpdate}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Event Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <UnifiedForm
              type="event"
              event={editingEvent}
              onSubmit={handleUnifiedUpdate}
              onCancel={() => setEditingEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      

      {/* Unified Create Dialog */}
      <Dialog open={showUnifiedDialog} onOpenChange={setShowUnifiedDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialFormData?.type === 'task' ? 'New Task' : 'New Event'}
            </DialogTitle>
          </DialogHeader>
          {initialFormData && (
            <UnifiedForm
              type={initialFormData.type}
              task={initialFormData.type === 'task' ? initialFormData.data as Task : undefined}
              event={initialFormData.type === 'event' ? initialFormData.data as Event : undefined}
              onSubmit={handleCreate}
              onCancel={() => {
                setShowUnifiedDialog(false);
                setInitialFormData(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}