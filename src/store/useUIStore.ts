import { create } from 'zustand';
import { Task, Event } from '@/types';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  notifications: Notification[];
  editingTask: Task | null;
  editingEvent: Event | null;
  hideScheduledTasks: boolean;
  
  createDialogData: {
    date: Date;
    time?: string;
    allDay?: boolean;
    endDate?: Date;
  } | null;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setEditingTask: (task: Task | null) => void;
  setEditingEvent: (event: Event | null) => void;
  
  setCreateDialogData: (data: { date: Date; time?: string; allDay?: boolean; endDate?: Date } | null) => void;
  clearCalendarSelection: () => void;
  setHideScheduledTasks: (hide: boolean) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: true,
  theme: 'system',
  isLoading: false,
  notifications: [],
  editingTask: null,
  editingEvent: null,
  hideScheduledTasks: false,
  
  createDialogData: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setTheme: (theme) => set({ theme }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setEditingTask: (task) => set({ editingTask: task }),
  
  setEditingEvent: (event) => set({ editingEvent: event }),
  
  
  
  setCreateDialogData: (data) => set({ createDialogData: data }),
  
  clearCalendarSelection: () => {
    // This will be implemented as a custom event for now
    const event = new CustomEvent('clearCalendarSelection', { bubbles: true });
    window.dispatchEvent(event);
  },
  
  setHideScheduledTasks: (hide) => set({ hideScheduledTasks: hide }),
}));