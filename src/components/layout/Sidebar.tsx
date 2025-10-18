'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  Users, 
  Settings,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { EventForm } from '@/components/events/EventForm';
import { useTaskStore, useEventStore } from '@/store';
import { Task, Event } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

export function Sidebar() {
  const { data: session } = useSession();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['inbox', 'work']);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { getTasksByCategory, getOverdueTasks, addTask } = useTaskStore();
  const { addEvent } = useEventStore();
  
  const overdueCount = getOverdueTasks().length;
  
  const categories: TaskCategory[] = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-gray-600',
      count: getTasksByCategory('inbox').length,
    },
    {
      id: 'overdue',
      name: 'Overdue',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-red-600',
      count: overdueCount,
    },
    {
      id: 'work',
      name: 'Work',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-blue-600',
      count: getTasksByCategory('work').length,
    },
    {
      id: 'family',
      name: 'Family',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600',
      count: getTasksByCategory('family').length,
    },
    {
      id: 'personal',
      name: 'Personal',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-orange-600',
      count: getTasksByCategory('personal').length,
    },
    {
      id: 'travel',
      name: 'Travel',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600',
      count: getTasksByCategory('travel').length,
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!session?.user?.id) return;
    
    await addTask({
      userId: session.user.id,
      title: taskData.title!,
      description: taskData.description,
      category: taskData.category || 'inbox',
      priority: taskData.priority || 'medium',
      completed: false,
      dueDate: taskData.dueDate,
      scheduledDate: taskData.scheduledDate,
      scheduledTime: taskData.scheduledTime,
      duration: taskData.duration,
      subtasks: taskData.subtasks,
    });
    setShowTaskDialog(false);
  };

  const handleCreateEvent = async (eventData: Partial<Event>) => {
    if (!session?.user?.id) return;
    
    await addEvent({
      userId: session.user.id,
      title: eventData.title!,
      description: eventData.description,
      type: eventData.type || 'meeting',
      startTime: eventData.startTime!,
      endTime: eventData.endTime!,
      allDay: eventData.allDay || false,
      location: eventData.location,
      attendees: eventData.attendees,
      color: eventData.color || '#3b82f6',
    });
    setShowEventDialog(false);
  };

  return (
    <div className="w-64 bg-background border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dayflow</h1>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button 
          className="w-full justify-start" 
          variant="default"
          onClick={() => setShowTaskDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setShowEventDialog(true)}
        >
          <Calendar className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Tasks</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className={category.color}>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  {category.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  )}
                </button>
                
                {expandedCategories.includes(category.id) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {category.id === 'overdue' ? (
                      <div className="text-xs text-muted-foreground p-2">
                        {category.count === 0 ? 'No overdue tasks' : `${category.count} overdue task(s)`}
                      </div>
                    ) : (
                      getTasksByCategory(category.id).map((task) => (
                        <div
                          key={task.id}
                          className="text-xs p-2 rounded hover:bg-accent cursor-pointer flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {
                              // This would need to be connected to the store
                              // For now, just display
                            }}
                            className="rounded"
                          />
                          <span className={cn(
                            'flex-1 truncate',
                            task.completed && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </span>
                          {task.priority === 'high' && (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>
                      ))
                    )}
                    {category.id !== 'overdue' && category.count === 0 && (
                      <div className="text-xs text-muted-foreground p-2">
                        No tasks
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">user@example.com</p>
          </div>
        </div>
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Event Creation Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowEventDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}