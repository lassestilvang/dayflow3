'use client';

import { useState, forwardRef } from 'react';
import { useSession } from 'next-auth/react';
import { startOfDay } from 'date-fns';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  Users, 
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UnifiedForm } from '@/components/forms/UnifiedForm';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useTaskStore, useEventStore, useUIStore, useSettingsStore } from '@/store';
import { Task, Event } from '@/types';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { formatDate, formatDateTime } from '@/lib/dateUtils';

interface TaskCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

interface DraggableTaskProps {
  task: Task;
  children: React.ReactNode;
}

function DraggableTask({ task, children }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-task-${task.id}`,
    data: {
      type: 'task',
      data: task,
      source: 'sidebar'
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
      className="fc-draggable-item"
      data-task-id={task.id}
      data-item-type="task"
    >
      {children}
    </div>
  );
}

interface SidebarProps {
  onResizeMouseDown?: (e: React.MouseEvent) => void;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ onResizeMouseDown }, ref) => {
  const { data: session } = useSession();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedCompletedCategories, setExpandedCompletedCategories] = useState<string[]>([]);
  const [showUnifiedDialog, setShowUnifiedDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [formType, setFormType] = useState<'task' | 'event'>('task');
  const { getTasksByCategory, getCompletedTasksByCategory, getOverdueTasks, addTask, updateTask } = useTaskStore();
  const { addEvent } = useEventStore();
  const { setEditingTask } = useUIStore();
  const { settings, updateSettings } = useSettingsStore();
  
  const overdueTasks = getOverdueTasks();
  const overdueCount = overdueTasks.length;
  
  const categories: TaskCategory[] = [
    {
      id: 'overdue',
      name: 'Overdue',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-red-600',
      count: overdueCount,
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-gray-600',
      count: getTasksByCategory('inbox').length,
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

  const toggleCompletedCategory = (categoryId: string) => {
    setExpandedCompletedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreate = async (data: Partial<Task> | Partial<Event>, type: 'task' | 'event') => {
    if (!session?.user?.id) return;
    
    if (type === 'task') {
      const taskData = data as Partial<Task>;
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
        allDay: taskData.allDay || false,
        duration: taskData.duration,
        subtasks: taskData.subtasks,
      });
    } else {
      const eventData = data as Partial<Event>;
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
    }
    setShowUnifiedDialog(false);
  };

  const handleTaskCompleteToggle = async (taskId: string, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(taskId, { 
      completed, 
      completedAt: completed ? new Date() : undefined,
      updatedAt: new Date() 
    });
  };

  const getOverdueReason = (task: Task): string => {
    const now = new Date();
    
    // Check due date first
    if (task.dueDate && task.dueDate < now) {
      return `Due ${formatDate(task.dueDate, settings)}`;
    }
    
    // Check scheduled time with duration
    if (task.scheduledDate && task.scheduledTime) {
      const scheduledDateTime = new Date(task.scheduledDate);
      const [hours, minutes] = task.scheduledTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      return formatDateTime(scheduledDateTime, settings);
    }
    
    // Check all-day scheduled date
    if (task.scheduledDate && !task.scheduledTime && task.allDay) {
      const today = startOfDay(now);
      const taskDate = startOfDay(task.scheduledDate);
      if (taskDate < today) {
        return formatDate(taskDate, settings);
      }
    }
    
    return 'Overdue';
  };

  return (
    <div className="relative flex h-full">
      <div ref={ref} className="bg-background border-r border-border h-full flex flex-col flex-1" style={{ width: '100%' }}>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dayflow</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 flex-shrink-0">
        <Button 
          className="w-full justify-start" 
          variant="default"
          onClick={() => {
            setFormType('task');
            setShowUnifiedDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
                      <>
                        {overdueTasks.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2">
                            No overdue tasks
                          </div>
                        ) : (
                          overdueTasks.map((task) => (
                            <DraggableTask key={`${task.id}-${task.completed ? 'completed' : 'incomplete'}`} task={task}>
                              <div
                                className="text-xs p-2 rounded hover:bg-accent cursor-pointer flex items-start gap-2"
                                onClick={(e) => {
                                  // Prevent drag when clicking checkbox
                                  if ((e.target as HTMLInputElement).type !== 'checkbox') {
                                    setEditingTask(task);
                                  }
                                }}
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground cursor-move mt-0.5 flex-shrink-0" />
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                                  onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                                  className="size-3 mt-0.5 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={cn(
                                    'truncate font-medium',
                                    task.completed && 'line-through text-muted-foreground'
                                  )}>
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-red-600 mt-0.5 truncate">
                                    {getOverdueReason(task)}
                                  </div>
                                </div>
                                {task.priority === 'high' && (
                                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                            </DraggableTask>
                          ))
                        )}
                      </>
                    ) : (
                      getTasksByCategory(category.id).map((task) => (
                        <DraggableTask key={task.id} task={task}>
                          <div
                            className="text-xs p-2 rounded hover:bg-accent cursor-pointer flex items-center gap-2"
                            onClick={(e) => {
                              // Prevent drag when clicking checkbox
                              if ((e.target as HTMLInputElement).type !== 'checkbox') {
                                setEditingTask(task);
                              }
                            }}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                              onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                              className="size-3"
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
                        </DraggableTask>
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

        {/* Completed Tasks */}
        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Completed Tasks</h3>
          <div className="space-y-1">
            {categories.filter(cat => cat.id !== 'overdue').map((category) => {
              const completedTasks = getCompletedTasksByCategory(category.id);
              const completedCount = completedTasks.length;
              
              if (completedCount === 0) return null;
              
              return (
                <div key={`completed-${category.id}`}>
                  <button
                    onClick={() => toggleCompletedCategory(category.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedCompletedCategories.includes(category.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span className={category.color}>{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {completedCount}
                    </Badge>
                  </button>
                  
                  {expandedCompletedCategories.includes(category.id) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {completedTasks.map((task) => (
                        <DraggableTask key={`completed-${task.id}`} task={task}>
                          <div
                            className="text-xs p-2 rounded hover:bg-accent cursor-pointer flex items-center gap-2 opacity-75"
                            onClick={(e) => {
                              if ((e.target as HTMLInputElement).type !== 'checkbox') {
                                setEditingTask(task);
                              }
                            }}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompleteToggle(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                              onClick={(e) => handleTaskCompleteToggle(task.id, !task.completed, e)}
                              className="size-3"
                            />
                            <span className="flex-1 truncate line-through text-muted-foreground">
                              {task.title}
                            </span>
                            {task.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                {formatDate(task.completedAt, settings)}
                              </div>
                            )}
                          </div>
                        </DraggableTask>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">user@example.com</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsDialog(true)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Unified Creation Dialog */}
      <Dialog open={showUnifiedDialog} onOpenChange={setShowUnifiedDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formType === 'task' ? 'Create New Task' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <UnifiedForm
            type={formType}
            onSubmit={handleCreate}
            onCancel={() => setShowUnifiedDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <SettingsModal
        isOpen={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        settings={settings}
        onSave={updateSettings}
      />
      </div>
      
      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-border cursor-col-resize transition-colors z-10 group"
        onMouseDown={onResizeMouseDown}
        style={{ right: '-1px' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';