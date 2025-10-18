'use client';

import { ReactNode } from 'react';
import { DndContext, 
         closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { EventForm } from '@/components/events/EventForm';
import { useUIStore, useTaskStore, useEventStore } from '@/store';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, editingTask, editingEvent, setEditingTask, setEditingEvent } = useUIStore();
  const { updateTask } = useTaskStore();
  const { updateEvent } = useEventStore();

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
    </DndContext>
  );
}