import { create } from 'zustand';
import { Task, Subtask } from '@/types';

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  addSubtask: (taskId: string, subtask: Subtask) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filters
  getTasksByCategory: (category: string) => Task[];
  getOverdueTasks: () => Task[];
  getTasksForDate: (date: Date) => Task[];
  getCompletedTasks: () => Task[];
  getIncompleteTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasks = await response.json();
      // Convert date strings back to Date objects
      const processedTasks = tasks.map((task: Omit<Task, 'dueDate' | 'scheduledDate' | 'createdAt' | 'updatedAt'> & {
        dueDate?: string;
        scheduledDate?: string;
        createdAt: string;
        updatedAt: string;
      }) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
      set({ tasks: processedTasks, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false 
      });
    }
  },

  setTasks: (tasks) => set({ tasks }),
  
  addTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      const newTask = await response.json();
      set((state) => ({ 
        tasks: [...state.tasks, newTask],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false 
      });
    }
  },
  
  updateTask: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const updatedTask = await response.json();
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false 
      });
    }
  },
  
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false 
      });
    }
  },
  
  toggleTaskComplete: async (id) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === id);
    if (task) {
      await get().updateTask(id, { 
        completed: !task.completed,
        updatedAt: new Date()
      });
    }
  },
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  addSubtask: async (taskId, subtask) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await get().updateTask(taskId, {
        subtasks: [...(task.subtasks || []), subtask],
        updatedAt: new Date()
      });
    }
  },
  
  updateSubtask: async (taskId, subtaskId, updates) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const updatedSubtasks = task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, ...updates } : st
      );
      await get().updateTask(taskId, {
        subtasks: updatedSubtasks,
        updatedAt: new Date()
      });
    }
  },
  
  deleteSubtask: async (taskId, subtaskId) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const updatedSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
      await get().updateTask(taskId, {
        subtasks: updatedSubtasks,
        updatedAt: new Date()
      });
    }
  },
  
  toggleSubtaskComplete: async (taskId, subtaskId) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        await get().updateSubtask(taskId, subtaskId, {
          completed: !subtask.completed
        });
      }
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  getTasksByCategory: (category) => {
    const { tasks } = get();
    return tasks.filter((task) => task.category === category);
  },
  
  getOverdueTasks: () => {
    const { tasks } = get();
    const now = new Date();
    return tasks.filter(
      (task) => !task.completed && task.dueDate && task.dueDate < now
    );
  },
  
  getTasksForDate: (date) => {
    const { tasks } = get();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return tasks.filter((task) => {
      if (task.scheduledDate) {
        const taskDate = new Date(task.scheduledDate);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      }
      return false;
    });
  },
  
  getCompletedTasks: () => {
    const { tasks } = get();
    return tasks.filter((task) => task.completed);
  },
  
  getIncompleteTasks: () => {
    const { tasks } = get();
    return tasks.filter((task) => !task.completed);
  },
}));