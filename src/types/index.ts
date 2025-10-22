export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  listId: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  scheduledDate?: Date;
  scheduledTime?: string;
  allDay: boolean;
  duration?: number;
  subtasks?: Subtask[];
  externalId?: string;
  externalSource?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'meeting' | 'appointment' | 'reminder' | 'deadline';
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  attendees?: Attendee[];
  externalId?: string;
  externalSource?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  status?: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface CalendarItem {
  id: string;
  type: 'task' | 'event';
  title: string;
  startTime: Date;
  endTime?: Date;
  category?: string;
  color?: string;
  allDay?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface Integration {
  id: string;
  userId: string;
  provider: string;
  type: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}