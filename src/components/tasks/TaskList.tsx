'use client';

import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  title: string;
  onTaskClick: (task: Task) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TaskList({ tasks, title, onTaskClick, onTaskToggle, onTaskDelete }: TaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'family': return 'bg-green-100 text-green-800 border-green-200';
      case 'personal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'travel': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inbox': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tasks found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className={cn(
              'transition-all hover:shadow-md cursor-pointer',
              task.completed && 'opacity-60'
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onTaskToggle(task.id)}
                    className="mt-1"
                  />

                  {/* Task Content */}
                  <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={cn(
                        'font-medium truncate',
                        task.completed && 'line-through'
                      )}>
                        {task.title}
                      </h4>
                      
                      {/* Status indicators */}
                      {isOverdue(task) && (
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      
                      {task.scheduledDate && (
                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category */}
                      <Badge variant="outline" className={cn('text-xs', getCategoryColor(task.category))}>
                        {task.category}
                      </Badge>

                      {/* Priority */}
                      <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </div>
                      )}

                      {/* Scheduled Time */}
                      {task.scheduledDate && task.scheduledTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.scheduledDate), 'MMM d')} at {task.scheduledTime}
                        </div>
                      )}

                      {/* Completion Time */}
                      {task.completed && task.completedAt && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                        </div>
                      )}

                      {/* Duration */}
                      {task.duration && (
                        <div className="text-xs text-muted-foreground">
                          {task.duration}min
                        </div>
                      )}
                    </div>

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                        </div>
                        <div className="space-y-1">
                          {task.subtasks.slice(0, 3).map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2 text-xs">
                              {subtask.completed ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={cn(subtask.completed && 'line-through text-muted-foreground')}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                          {task.subtasks.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{task.subtasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskDelete(task.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}