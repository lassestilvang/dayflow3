'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar } from '@/components/calendar/Calendar';
import { useTaskStore, useEventStore, useUIStore } from '@/store';

// Mock data for development
const mockTasks = [
  {
    id: '1',
    userId: 'user1',
    title: 'Review project proposal',
    description: 'Review the Q4 project proposal and provide feedback',
    category: 'work' as const,
    priority: 'high' as const,
    completed: false,
    dueDate: new Date('2024-01-25'),
    scheduledDate: new Date('2024-01-22'),
    scheduledTime: '10:00',
    duration: 60,
    subtasks: [
      { id: '1', title: 'Read executive summary', completed: true },
      { id: '2', title: 'Review budget section', completed: false },
      { id: '3', title: 'Check timeline', completed: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Team standup meeting',
    description: 'Daily sync with the development team',
    category: 'work' as const,
    priority: 'medium' as const,
    completed: false,
    scheduledDate: new Date('2024-01-22'),
    scheduledTime: '09:00',
    duration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Grocery shopping',
    description: 'Buy groceries for the week',
    category: 'personal' as const,
    priority: 'medium' as const,
    completed: false,
    dueDate: new Date('2024-01-23'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'user1',
    title: 'Family dinner',
    description: 'Dinner with parents at home',
    category: 'family' as const,
    priority: 'high' as const,
    completed: false,
    scheduledDate: new Date('2024-01-22'),
    scheduledTime: '19:00',
    duration: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEvents = [
  {
    id: '1',
    userId: 'user1',
    title: 'Client Presentation',
    description: 'Present project progress to client',
    type: 'meeting' as const,
    startTime: new Date('2024-01-22T14:00:00'),
    endTime: new Date('2024-01-22T15:30:00'),
    allDay: false,
    location: 'Conference Room A',
    attendees: [
      { id: '1', name: 'John Doe', email: 'john@example.com', status: 'accepted' as const },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'tentative' as const },
    ],
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Project Deadline',
    description: 'Submit final project deliverables',
    type: 'deadline' as const,
    startTime: new Date('2024-01-26T17:00:00'),
    endTime: new Date('2024-01-26T17:00:00'),
    allDay: false,
    color: '#ef4444',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function DashboardPage() {
  const { setTasks } = useTaskStore();
  const { setEvents } = useEventStore();
  const { setLoading } = useUIStore();

  useEffect(() => {
    // Load mock data for development
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setTasks(mockTasks);
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  }, [setTasks, setEvents, setLoading]);

  return (
    <MainLayout>
      <Calendar />
    </MainLayout>
  );
}