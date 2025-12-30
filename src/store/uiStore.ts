import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ViewMode } from '@/types';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  previewMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setPreviewMode: (preview: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      viewMode: 'table',
      previewMode: false,
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setPreviewMode: (preview) => set({ previewMode: preview }),
    }),
    {
      name: 'unipilot-ui',
    }
  )
);