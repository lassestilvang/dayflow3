import { create } from 'zustand';
import { Task, Subtask } from '@/types';

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
  addSubtask: (taskId: string, subtask: Subtask) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
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

  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    ),
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
    selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
  })),
  
  toggleTaskComplete: (id) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date() } : task
    ),
  })),
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  addSubtask: (taskId, subtask) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? { ...task, subtasks: [...(task.subtasks || []), subtask], updatedAt: new Date() }
        : task
    ),
  })),
  
  updateSubtask: (taskId, subtaskId, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks?.map((st) =>
              st.id === subtaskId ? { ...st, ...updates } : st
            ),
            updatedAt: new Date(),
          }
        : task
    ),
  })),
  
  deleteSubtask: (taskId, subtaskId) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks?.filter((st) => st.id !== subtaskId),
            updatedAt: new Date(),
          }
        : task
    ),
  })),
  
  toggleSubtaskComplete: (taskId, subtaskId) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks?.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
            updatedAt: new Date(),
          }
        : task
    ),
  })),
  
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