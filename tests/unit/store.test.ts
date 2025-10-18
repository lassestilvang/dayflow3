import { renderHook, act } from '@testing-library/react';
import { useTaskStore, useEventStore, useCalendarStore } from '@/store';

// Mock tasks for testing
const mockTasks = [
  {
    id: '1',
    userId: 'user1',
    title: 'Test Task',
    category: 'work' as const,
    priority: 'medium' as const,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Completed Task',
    category: 'personal' as const,
    priority: 'low' as const,
    completed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Task Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useTaskStore());
    act(() => {
      result.current.setTasks([]);
    });
  });

  it('should add a task', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(mockTasks[0]);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });

  it('should toggle task completion', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask(mockTasks[0]);
    });

    act(() => {
      result.current.toggleTaskComplete('1');
    });

    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('should filter tasks by category', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.setTasks(mockTasks);
    });

    const workTasks = result.current.getTasksByCategory('work');
    expect(workTasks).toHaveLength(1);
    expect(workTasks[0].category).toBe('work');
  });

  it('should get completed tasks', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.setTasks(mockTasks);
    });

    const completedTasks = result.current.getCompletedTasks();
    expect(completedTasks).toHaveLength(1);
    expect(completedTasks[0].completed).toBe(true);
  });

  it('should get incomplete tasks', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.setTasks(mockTasks);
    });

    const incompleteTasks = result.current.getIncompleteTasks();
    expect(incompleteTasks).toHaveLength(1);
    expect(incompleteTasks[0].completed).toBe(false);
  });
});

describe('Event Store', () => {
  const mockEvents = [
    {
      id: '1',
      userId: 'user1',
      title: 'Test Event',
      type: 'meeting' as const,
      startTime: new Date('2024-01-22T10:00:00'),
      endTime: new Date('2024-01-22T11:00:00'),
      allDay: false,
      color: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    const { result } = renderHook(() => useEventStore());
    act(() => {
      result.current.setEvents([]);
    });
  });

  it('should add an event', () => {
    const { result } = renderHook(() => useEventStore());
    
    act(() => {
      result.current.addEvent(mockEvents[0]);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('Test Event');
  });

  it('should get events for a specific date', () => {
    const { result } = renderHook(() => useEventStore());
    
    act(() => {
      result.current.setEvents(mockEvents);
    });

    const events = result.current.getEventsForDate(new Date('2024-01-22'));
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Test Event');
  });

  it('should check for conflicts', () => {
    const { result } = renderHook(() => useEventStore());
    
    act(() => {
      result.current.setEvents(mockEvents);
    });

    const conflicts = result.current.checkConflicts(
      new Date('2024-01-22T10:30:00'),
      new Date('2024-01-22T11:30:00')
    );
    
    expect(conflicts).toHaveLength(1);
  });
});

describe('Calendar Store', () => {
  it('should navigate to previous week', () => {
    const { result } = renderHook(() => useCalendarStore());
    const initialDate = result.current.currentDate;
    
    act(() => {
      result.current.navigatePrevious();
    });

    expect(result.current.currentDate.getTime()).toBeLessThan(initialDate.getTime());
  });

  it('should navigate to next week', () => {
    const { result } = renderHook(() => useCalendarStore());
    const initialDate = result.current.currentDate;
    
    act(() => {
      result.current.navigateNext();
    });

    expect(result.current.currentDate.getTime()).toBeGreaterThan(initialDate.getTime());
  });

  it('should navigate to today', () => {
    const { result } = renderHook(() => useCalendarStore());
    const today = new Date();
    
    act(() => {
      result.current.navigateToday();
    });

    expect(result.current.currentDate.toDateString()).toBe(today.toDateString());
  });

  it('should change view', () => {
    const { result } = renderHook(() => useCalendarStore());
    
    act(() => {
      result.current.setView('month');
    });

    expect(result.current.view).toBe('month');
  });

  it('should get week dates', () => {
    const { result } = renderHook(() => useCalendarStore());
    
    const weekDates = result.current.getWeekDates();
    expect(weekDates).toHaveLength(7);
  });
});