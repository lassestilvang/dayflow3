import { create } from 'zustand';
import { Event } from '@/types';

interface EventStore {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
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

  setEvents: (events) => set({ events }),
  
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map((event) =>
      event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
    ),
  })),
  
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((event) => event.id !== id),
    selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
  })),
  
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