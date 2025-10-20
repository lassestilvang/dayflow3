import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSettings {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday';
}

interface SettingsStore {
  settings: UserSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setSettings: (settings: UserSettings) => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  dateFormat: 'MMM d, yyyy',
  timeFormat: '24h',
  weekStart: 'sunday',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const settings = await response.json();
            set({ settings });
          }
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateSettings: async (newSettings) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        try {
          const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedSettings),
          });

          if (response.ok) {
            set({ settings: updatedSettings });
          } else {
            throw new Error('Failed to update settings');
          }
        } catch (error) {
          console.error('Failed to update settings:', error);
          throw error;
        }
      },

      setSettings: (settings) => {
        set({ settings });
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);