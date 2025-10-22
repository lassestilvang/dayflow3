'use client';

import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Task, Event } from '@/types';
import { useListStore } from '@/store/useListStore';

interface DayOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: Event[];
  tasks: Task[];
  onTaskComplete: (taskId: string, completed: boolean, e: React.MouseEvent) => void;
  onEditEvent: (event: Event) => void;
  onEditTask: (task: Task) => void;
}

export function DayOverviewModal({
  isOpen,
  onClose,
  date,
  events,
  tasks,
  onTaskComplete,
  onEditEvent,
  onEditTask,
}: DayOverviewModalProps) {
  const { lists } = useListStore();

  const getTaskStyle = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    const color = list?.color || '#6b7280';
    return {
      backgroundColor: `${color}20`,
      color: color,
    };
  };
  const allItems = [
    ...events.map(event => ({ type: 'event' as const, data: event })),
    ...tasks.map(task => ({ type: 'task' as const, data: task }))
  ].sort((a, b) => {
    // Sort by time for events, then by completion status for tasks
    if (a.type === 'event' && b.type === 'event') {
      return new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime();
    }
    if (a.type === 'task' && b.type === 'task') {
      return a.data.completed ? 1 : -1;
    }
    // Events come before tasks
    return a.type === 'event' ? -1 : 1;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {allItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No events or tasks for this day</p>
          ) : (
            allItems.map((item) => {
              if (item.type === 'event') {
                const event = item.data;
                return (
                  <div
                    key={event.id}
                    className="text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: event.color + '20', 
                      color: event.color 
                    }}
                    onClick={() => {
                      onEditEvent(event);
                      onClose();
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                    </div>
                  </div>
                );
              } else {
                const task = item.data;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2',
                      task.completed && 'opacity-60'
                    )}
                    style={getTaskStyle(task.listId)}
                    onClick={() => {
                      onEditTask(task);
                      onClose();
                    }}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => onTaskComplete(task.id, checked as boolean, { stopPropagation: () => {} } as React.MouseEvent)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskComplete(task.id, !task.completed, e);
                      }}
                      className="size-4"
                    />
                    <div className="flex-1">
                      <div className={cn('font-medium', task.completed && 'line-through')}>
                        {task.title}
                      </div>
                      {task.scheduledTime && (
                        <div className="text-xs opacity-75">{task.scheduledTime}</div>
                      )}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}