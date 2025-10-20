import { create } from 'zustand';
import { addDays, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarStore {
  currentDate: Date;
  view: 'week' | 'month' | 'day' | 'list';
  selectedDate: Date | null;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  setView: (view: 'week' | 'month' | 'day' | 'list') => void;
  setSelectedDate: (date: Date | null) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToday: () => void;
  goToWeek: (date: Date) => void;
  goToMonth: (date: Date) => void;
  goToDay: (date: Date) => void;
  
  // Computed values
  getWeekStart: () => Date;
  getWeekEnd: () => Date;
  getWeekDates: () => Date[];
  getMonthDates: () => Date[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  currentDate: new Date(),
  view: 'week',
  selectedDate: null,

  setCurrentDate: (date) => set({ currentDate: date }),
  
  setView: (view) => set({ view }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  navigatePrevious: () => {
    const { currentDate, view } = get();
    let newDate: Date;
    
    switch (view) {
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'list':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        break;
      default:
        newDate = currentDate;
    }
    
    set({ currentDate: newDate });
  },
  
  navigateNext: () => {
    const { currentDate, view } = get();
    let newDate: Date;
    
    switch (view) {
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'list':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        break;
      default:
        newDate = currentDate;
    }
    
    set({ currentDate: newDate });
  },
  
  navigateToday: () => set({ currentDate: new Date() }),
  
  goToWeek: (date) => {
    set({ currentDate: date, view: 'week' });
  },
  
  goToMonth: (date) => {
    set({ currentDate: date, view: 'month' });
  },
  
  goToDay: (date) => {
    set({ currentDate: date, view: 'day' });
  },
  
  getWeekStart: () => {
    const { currentDate } = get();
    return startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  },
  
  getWeekEnd: () => {
    const { currentDate } = get();
    return endOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  },
  
  getWeekDates: () => {
    const weekStart = get().getWeekStart();
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(weekStart, i));
    }
    
    return dates;
  },
  
  getMonthDates: () => {
    const { currentDate: stateDate } = get();
    const year = stateDate.getFullYear();
    const month = stateDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];
    
    // Start from the beginning of the week that contains the first day
    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
    
    // End at the end of the week that contains the last day
    const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  },
}));