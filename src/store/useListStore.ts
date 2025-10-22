import { create } from 'zustand';
import { List } from '@/types';

interface ListStore {
  lists: List[];
  selectedListId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (id: string, updates: Partial<List>) => void;
  removeList: (id: string) => void;
  setSelectedList: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getListById: (id: string) => List | undefined;
  getSelectedList: () => List | undefined;
  getDefaultList: () => List | undefined;
}

export const useListStore = create<ListStore>((set, get) => ({
  lists: [],
  selectedListId: null,
  isLoading: false,
  error: null,

  setLists: (lists) => set({ lists }),
  
  addList: (list) => set((state) => ({ 
    lists: [...state.lists, list] 
  })),
  
  updateList: (id, updates) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === id ? { ...list, ...updates } : list
    )
  })),
  
  removeList: (id) => set((state) => ({
    lists: state.lists.filter((list) => list.id !== id),
    selectedListId: state.selectedListId === id ? null : state.selectedListId
  })),
  
  setSelectedList: (id) => set({ selectedListId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  getListById: (id) => get().lists.find((list) => list.id === id),
  getSelectedList: () => {
    const { selectedListId, lists } = get();
    return lists.find((list) => list.id === selectedListId);
  },
  getDefaultList: () => get().lists.find((list) => list.isDefault),
}));