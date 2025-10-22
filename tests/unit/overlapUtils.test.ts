import { calculateOverlapLayout } from '@/lib/overlapUtils';
import { Event, Task } from '@/types';

describe('overlapUtils', () => {
  const createEvent = (id: string, startHour: number, endHour: number): Event => {
    const startMinutes = Math.floor(startHour * 60);
    const endMinutes = Math.floor(endHour * 60);
    return {
      id,
      userId: 'test-user',
      title: `Event ${id}`,
      description: '',
      startTime: new Date(2024, 0, 1, Math.floor(startHour), (startHour * 60) % 60),
      endTime: new Date(2024, 0, 1, Math.floor(endHour), (endHour * 60) % 60),
      allDay: false,
      color: '#3b82f6',
      type: 'meeting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const createTask = (id: string, startHour: number, duration: number = 60): Task => ({
    id,
    userId: 'test-user',
    title: `Task ${id}`,
    description: '',
    listId: 'list-1',
    completed: false,
    scheduledDate: new Date(2024, 0, 1),
    scheduledTime: `${startHour.toString().padStart(2, '0')}:00`,
    duration,
    priority: 'medium',
    allDay: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('calculateOverlapLayout', () => {
    it('should handle no overlapping items', () => {
      const events = [
        createEvent('1', 9, 10),
        createEvent('2', 11, 12),
      ];
      const tasks = [
        createTask('1', 13, 60),
      ];

      const result = calculateOverlapLayout(events, tasks);

      expect(result).toHaveLength(3);
      result.forEach(item => {
        expect(item.left).toBe(0);
        expect(item.width).toBe(100);
        expect(item.columnIndex).toBe(0);
        expect(item.totalColumns).toBe(1);
      });
    });

    it('should handle overlapping events', () => {
      const events = [
        createEvent('1', 9, 11),
        createEvent('2', 10, 12),
        createEvent('3', 9, 10), // Overlaps with event 1 but not event 2
      ];
      const tasks: Task[] = [];

      const result = calculateOverlapLayout(events, tasks);

      expect(result).toHaveLength(3);
      
      // All items should be in the same cluster with multiple columns
      const totalColumns = Math.max(...result.map(item => item.totalColumns));
      expect(totalColumns).toBe(2); // Max 2 concurrent events at any time
      
      // Events 1 and 3 should be in different columns since they overlap
      const event1 = result.find(item => item.id === '1');
      const event3 = result.find(item => item.id === '3');
      expect(event1?.columnIndex).not.toBe(event3?.columnIndex);
      
      // Event 2 should share a column with event 3 since they don't overlap
      const event2 = result.find(item => item.id === '2');
      expect(event2?.columnIndex).toBe(event3?.columnIndex);
      
      // Width should be distributed evenly
      const expectedWidth = 100 / totalColumns;
      result.forEach(item => {
        expect(item.width).toBeCloseTo(expectedWidth, 1);
      });
    });

    it('should handle overlapping tasks and events', () => {
      const events = [
        createEvent('1', 9, 11),
      ];
      const tasks = [
        createTask('1', 10, 60),
        createTask('2', 9.5, 30),
      ];

      const result = calculateOverlapLayout(events, tasks);

      expect(result).toHaveLength(3);
      
      // All items should overlap and be arranged in columns
      const totalColumns = Math.max(...result.map(item => item.totalColumns));
      expect(totalColumns).toBeGreaterThan(1);
    });

    it('should handle partial overlaps', () => {
      const events = [
        createEvent('1', 9, 11), // Overlaps with event 2
        createEvent('2', 10, 12), // Overlaps with event 1
        createEvent('3', 13, 14), // No overlap
      ];
      const tasks: Task[] = [];

      const result = calculateOverlapLayout(events, tasks);

      expect(result).toHaveLength(3);
      
      // Event 3 should be alone (full width)
      const event3 = result.find(item => item.id === '3');
      expect(event3?.width).toBe(100);
      expect(event3?.left).toBe(0);
      
      // Events 1 and 2 should share space
      const event1 = result.find(item => item.id === '1');
      const event2 = result.find(item => item.id === '2');
      expect(event1?.totalColumns).toBe(2);
      expect(event2?.totalColumns).toBe(2);
      expect(event1?.columnIndex).not.toBe(event2?.columnIndex);
    });

    it('should filter out all-day items', () => {
      const events = [
        createEvent('1', 9, 10),
        { ...createEvent('2', 10, 11), allDay: true },
      ];
      const tasks = [
        createTask('1', 11, 60),
        { ...createTask('2', 12, 60), allDay: true },
      ];

      const result = calculateOverlapLayout(events, tasks);

      expect(result).toHaveLength(2);
      expect(result.every(item => !item.data.allDay)).toBe(true);
    });

    it('should handle tasks without scheduled time', () => {
      const events: Event[] = [];
      const tasks = [
        createTask('1', 9, 60),
        { ...createTask('2', 10, 60), scheduledTime: undefined },
      ];

      const result = calculateOverlapLayout(events, tasks);

      // Only the task with scheduled time should be included
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});