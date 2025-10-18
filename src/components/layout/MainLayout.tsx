'use client';

import { ReactNode, useState, useEffect } from 'react';
import { DndContext, 
         closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
  const { updateTask, addTask } = useTaskStore();
  const { updateEvent, addEvent } = useEventStore();
  const [showUnifiedDialog, setShowUnifiedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState<{ type: 'task' | 'event'; data: Partial<Task> | Partial<Event> } | null>(null);

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
      setInitialFormData({ type: 'task', data: taskData });
      setCreateDialogData(null);
      setShowUnifiedDialog(true);
    }
  }, [createDialogData, setCreateDialogData, setShowUnifiedDialog, setInitialFormData]);

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
            <UnifiedForm
              type="task"
              task={editingTask}
              onSubmit={(data) => {
                handleUpdateTask(data as Partial<Task>);
              }}
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
              onSubmit={(data) => {
                handleUpdateEvent(data as Partial<Event>);
              }}
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