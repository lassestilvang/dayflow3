'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event, Attendee } from '@/types';

interface EventFormProps {
  event?: Event;
  onSubmit: (event: Partial<Event>) => void;
  onCancel: () => void;
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'meeting',
    startTime: event?.startTime ? format(event.startTime, "yyyy-MM-dd'T'HH:mm") : '',
    endTime: event?.endTime ? format(event.endTime, "yyyy-MM-dd'T'HH:mm") : '',
    allDay: event?.allDay || false,
    location: event?.location || '',
    color: event?.color || '#3b82f6',
  });

  const [attendees, setAttendees] = useState<Attendee[]>(event?.attendees || []);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: Partial<Event> = {
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: formData.allDay ? new Date(formData.startTime) : new Date(formData.endTime),
      attendees: attendees.length > 0 ? attendees : undefined,
    };

    onSubmit(eventData);
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
          <Calendar className="h-5 w-5" />
          {event ? 'Edit Event' : 'New Event'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add event description"
                rows={3}
              />
            </div>
          </div>

          {/* Type and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Event['type'] })}>
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
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked as boolean })}
              />
              <Label htmlFor="allDay">All day event</Label>
            </div>

            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            {!formData.allDay && (
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {event ? 'Update Event' : 'Create Event'}
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