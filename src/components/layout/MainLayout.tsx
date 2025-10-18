'use client';

import { ReactNode, useState } from 'react';
import { DndContext, 
         closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { EventForm } from '@/components/events/EventForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
    showCreateDialog,
    createDialogData,
    setEditingTask, 
    setEditingEvent,
    setShowCreateDialog,
    setCreateDialogData
  } = useUIStore();
  const { updateTask, addTask } = useTaskStore();
  const { updateEvent, addEvent } = useEventStore();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null);
  const [initialEventData, setInitialEventData] = useState<Partial<Event> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;
    
    await updateTask(editingTask.id, taskData);
    setEditingTask(null);
  };

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    if (!editingEvent) return;
    
    await updateEvent(editingEvent.id, eventData as Partial<Event>);
    setEditingEvent(null);
  };

  const handleCreateChoice = (choice: 'task' | 'event') => {
    if (!createDialogData) return;

    if (choice === 'task') {
      const taskData = {
        scheduledDate: createDialogData.date,
        scheduledTime: createDialogData.time,
        allDay: createDialogData.allDay || false,
      };
      setInitialTaskData(taskData);
      setShowCreateTaskDialog(true);
    } else {
      const startTime = new Date(createDialogData.date);
      if (createDialogData.time) {
        const [hours, minutes] = createDialogData.time.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);
      } else {
        startTime.setHours(9, 0, 0, 0); // Default 9 AM
      }
      
      const endTime = new Date(startTime);
      if (createDialogData.allDay) {
        endTime.setHours(23, 59, 59, 999);
      } else {
        endTime.setHours(startTime.getHours() + 1); // Default 1 hour duration
      }
      
      const eventData = {
        startTime,
        endTime,
        allDay: createDialogData.allDay || false,
      };
      setInitialEventData(eventData);
      setShowCreateEventDialog(true);
    }
    
    setCreateDialogData(null);
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
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
  };

  const handleCreateEvent = async (eventData: Partial<Event>) => {
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
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarOpen ? 'w-64' : 'w-0'
          )}>
            <div className={cn(
              'h-full transition-all duration-300',
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}>
              <Sidebar />
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
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
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
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
            <EventForm
              event={editingEvent}
              onSubmit={handleUpdateEvent}
              onCancel={() => setEditingEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Choice Dialog */}
      <ConfirmDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Create Task or Event?"
        description="What would you like to create?"
        onConfirm={handleCreateChoice}
      />

      {/* Task Create Dialog */}
      <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={initialTaskData as Task}
            onSubmit={handleCreateTask}
            onCancel={() => {
              setShowCreateTaskDialog(false);
              setInitialTaskData(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Event Create Dialog */}
      <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          <EventForm
            event={initialEventData as Event}
            onSubmit={handleCreateEvent}
            onCancel={() => {
              setShowCreateEventDialog(false);
              setInitialEventData(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}