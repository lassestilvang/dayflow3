import { create } from 'zustand';
import { Event } from '@/types';

interface EventStore {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchEvents: () => Promise<void>;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedEvent: (event: Event | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filters and queries
  getEventsForDate: (date: Date) => Event[];
  getEventsForWeek: (startDate: Date, endDate: Date) => Event[];
  getEventsForMonth: (year: number, month: number) => Event[];
  checkConflicts: (startTime: Date, endTime: Date, excludeId?: string) => Event[];
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const events = await response.json();
      set({ events, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false 
      });
    }
  },

  setEvents: (events) => set({ events }),
  
  addEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const newEvent = await response.json();
      set((state) => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create event',
        isLoading: false 
      });
    }
  },
  
  updateEvent: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      const updatedEvent = await response.json();
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? updatedEvent : event
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update event',
        isLoading: false 
      });
    }
  },
  
  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete event',
        isLoading: false 
      });
    }
  },
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  getEventsForDate: (date) => {
    const { events } = get();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      if (event.allDay) {
        const eventDate = new Date(eventStart);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === startOfDay.getTime();
      }
      
      return (
        (eventStart >= startOfDay && eventStart <= endOfDay) ||
        (eventEnd >= startOfDay && eventEnd <= endOfDay) ||
        (eventStart <= startOfDay && eventEnd >= endOfDay)
      );
    });
  },
  
  getEventsForWeek: (startDate, endDate) => {
    const { events } = get();
    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= endDate && eventEnd >= startDate;
    });
  },
  
  getEventsForMonth: (year, month) => {
    const { events } = get();
    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart.getFullYear() === year && eventStart.getMonth() === month;
    });
  },
  
  checkConflicts: (startTime, endTime, excludeId) => {
    const { events } = get();
    return events.filter((event) => {
      if (event.id === excludeId || event.allDay) return false;
      
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (startTime < eventEnd && endTime > eventStart)
      );
    });
  },
}));