'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Tag, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Event, Subtask, Attendee } from '@/types';
import { cn } from '@/lib/utils';
import { useListStore } from '@/store/useListStore';
import { useEffect } from 'react';
import { getIconEmoji } from '@/lib/iconUtils';

type FormType = 'task' | 'event';

interface UnifiedFormProps {
  type?: FormType;
  task?: Task;
  event?: Event;
  onSubmit: (data: Partial<Task> | Partial<Event>, type: FormType) => void;
  onCancel: () => void;
}

export function UnifiedForm({ type: initialType = 'task', task, event, onSubmit, onCancel }: UnifiedFormProps) {
  const [formType, setFormType] = useState<FormType>(initialType);

  const [taskData, setTaskData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    listId: task?.listId || '',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
    scheduledDate: task?.scheduledDate ? format(task.scheduledDate, 'yyyy-MM-dd') : '',
    scheduledTime: task?.scheduledTime || '',
    allDay: task?.allDay || false,
    duration: task?.duration?.toString() || '',
  });

  const { lists, setLists, getDefaultList } = useListStore();

  // Fetch lists when component mounts
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch('/api/lists');
        if (response.ok) {
          const userLists = await response.json();
          setLists(userLists);
          
          // Set default list if no listId is selected
          if (!taskData.listId && userLists.length > 0) {
            const defaultList = userLists.find((list: any) => list.isDefault) || userLists[0];
            setTaskData(prev => ({ ...prev, listId: defaultList.id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      }
    };
    
    fetchLists();
  }, [setLists, taskData.listId]);

  const [eventData, setEventData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'meeting',
    startTime: event?.startTime ? format(event.startTime, "yyyy-MM-dd'T'HH:mm") : '',
    endTime: event?.endTime ? format(event.endTime, "yyyy-MM-dd'T'HH:mm") : '',
    allDay: event?.allDay || false,
    location: event?.location || '',
    color: event?.color || '#3b82f6',
  });

  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [attendees, setAttendees] = useState<Attendee[]>(event?.attendees || []);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formType === 'task') {
      const taskSubmitData: Partial<Task> = {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate) : undefined,
        duration: taskData.duration ? parseInt(taskData.duration) : undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
      };
      onSubmit(taskSubmitData, 'task');
    } else {
      const eventSubmitData: Partial<Event> = {
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: eventData.allDay ? new Date(eventData.startTime) : new Date(eventData.endTime),
        attendees: attendees.length > 0 ? attendees : undefined,
      };
      onSubmit(eventSubmitData, 'event');
    }
  };

  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        title: newSubtaskTitle.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st =>
      st.id === id ? { ...st, completed: !st.completed } : st
    ));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const addAttendee = () => {
    if (newAttendeeEmail.trim()) {
      const newAttendee: Attendee = {
        id: Date.now().toString(),
        name: newAttendeeName.trim() || newAttendeeEmail.split('@')[0],
        email: newAttendeeEmail.trim(),
        status: 'pending',
      };
      setAttendees([...attendees, newAttendee]);
      setNewAttendeeEmail('');
      setNewAttendeeName('');
    }
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter(a => a.id !== id));
  };

  const updateAttendeeStatus = (id: string, status: Attendee['status']) => {
    setAttendees(attendees.map(a =>
      a.id === id ? { ...a, status } : a
    ));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {formType === 'task' ? <Tag className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          {task || event ? `Edit ${formType === 'task' ? 'Task' : 'Event'}` : `New ${formType === 'task' ? 'Task' : 'Event'}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div>
            <Label>Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormType('task')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                  formType === 'task' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-muted hover:border-muted-foreground/20"
                )}
              >
                <Tag className="h-4 w-4" />
                <span className="font-medium">Task</span>
              </button>
              <button
                type="button"
                onClick={() => setFormType('event')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                  formType === 'event' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-muted hover:border-muted-foreground/20"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Event</span>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formType === 'task' ? taskData.title : eventData.title}
                onChange={(e) => {
                  if (formType === 'task') {
                    setTaskData({ ...taskData, title: e.target.value });
                  } else {
                    setEventData({ ...eventData, title: e.target.value });
                  }
                }}
                placeholder={`Enter ${formType} title`}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formType === 'task' ? taskData.description : eventData.description}
                onChange={(e) => {
                  if (formType === 'task') {
                    setTaskData({ ...taskData, description: e.target.value });
                  } else {
                    setEventData({ ...eventData, description: e.target.value });
                  }
                }}
                placeholder={`Add ${formType} description`}
                rows={3}
              />
            </div>
          </div>

          {/* Task-specific fields */}
          {formType === 'task' && (
            <>
              {/* List and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="list">List</Label>
                  <Select value={taskData.listId} onValueChange={(value) => setTaskData({ ...taskData, listId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getIconEmoji(list.icon)}</span>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: list.color }}
                            />
                            {list.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={taskData.priority} onValueChange={(value) => setTaskData({ ...taskData, priority: value as Task['priority'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Task Scheduling */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allDay"
                      checked={taskData.allDay}
                      onCheckedChange={(checked) => {
                        setTaskData({ 
                          ...taskData, 
                          allDay: checked as boolean,
                          scheduledTime: checked ? '' : taskData.scheduledTime
                        });
                      }}
                    />
                    <Label htmlFor="allDay">All day task</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledDate">Schedule Date</Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={taskData.scheduledDate}
                        onChange={(e) => setTaskData({ ...taskData, scheduledDate: e.target.value })}
                      />
                    </div>

                    {!taskData.allDay && (
                      <div>
                        <Label htmlFor="scheduledTime">Time</Label>
                        <Input
                          id="scheduledTime"
                          type="time"
                          value={taskData.scheduledTime}
                          onChange={(e) => setTaskData({ ...taskData, scheduledTime: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskData({ ...taskData, duration: '15' })}
                        className={cn(
                          "px-3 py-1 rounded-md border text-sm font-medium transition-all",
                          taskData.duration === '15' 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        15m
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskData({ ...taskData, duration: '30' })}
                        className={cn(
                          "px-3 py-1 rounded-md border text-sm font-medium transition-all",
                          taskData.duration === '30' 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        30m
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskData({ ...taskData, duration: '60' })}
                        className={cn(
                          "px-3 py-1 rounded-md border text-sm font-medium transition-all",
                          taskData.duration === '60' 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        1h
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskData({ ...taskData, duration: '120' })}
                        className={cn(
                          "px-3 py-1 rounded-md border text-sm font-medium transition-all",
                          taskData.duration === '120' 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        2h
                      </button>
                    </div>
                    <Input
                      id="duration"
                      type="number"
                      value={taskData.duration}
                      onChange={(e) => setTaskData({ ...taskData, duration: e.target.value })}
                      placeholder="Custom (min)"
                      min="1"
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-4">
                <Label>Subtasks</Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  />
                  <Button type="button" onClick={addSubtask} variant="outline">
                    Add
                  </Button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 border rounded">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => toggleSubtask(subtask.id)}
                        />
                        <span className={cn(subtask.completed && 'line-through text-muted-foreground')}>
                          {subtask.title}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubtask(subtask.id)}
                          className="ml-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Event-specific fields */}
          {formType === 'event' && (
            <>
              {/* Type and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventType">Type</Label>
                  <Select value={eventData.type} onValueChange={(value) => setEventData({ ...eventData, type: value as Event['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={eventData.color}
                    onChange={(e) => setEventData({ ...eventData, color: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Event Time */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allDay"
                    checked={eventData.allDay}
                    onCheckedChange={(checked) => setEventData({ ...eventData, allDay: checked as boolean })}
                  />
                  <Label htmlFor="allDay">All day event</Label>
                </div>

                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type={eventData.allDay ? 'date' : 'datetime-local'}
                    value={eventData.startTime}
                    onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                    required
                  />
                </div>

                {!eventData.allDay && (
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={eventData.endTime}
                      onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  placeholder="Add location"
                />
              </div>

              {/* Attendees */}
              <div className="space-y-4">
                <Label>Attendees</Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newAttendeeName}
                    onChange={(e) => setNewAttendeeName(e.target.value)}
                    placeholder="Name (optional)"
                  />
                  <Input
                    value={newAttendeeEmail}
                    onChange={(e) => setNewAttendeeEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                  />
                  <Button type="button" onClick={addAttendee} variant="outline">
                    Add
                  </Button>
                </div>

                {attendees.length > 0 && (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center gap-2 p-2 border rounded">
                        <Users className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-sm text-muted-foreground">{attendee.email}</div>
                        </div>
                        <Select
                          value={attendee.status}
                          onValueChange={(value) => updateAttendeeStatus(attendee.id, value as Attendee['status'])}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="tentative">Tentative</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttendee(attendee.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {task || event ? `Update ${formType === 'task' ? 'Task' : 'Event'}` : `Create ${formType === 'task' ? 'Task' : 'Event'}`}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}