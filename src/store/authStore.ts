import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { useWorkspaceStore } from './workspaceStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        set({ user, isAuthenticated: true });
        
        // Load or create workspace
        const workspaceStore = useWorkspaceStore.getState();
        workspaceStore.loadWorkspace(user.id);
        
        const workspace = workspaceStore.getCurrentWorkspace();
        if (!workspace) {
          workspaceStore.createWorkspace(user);
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        useWorkspaceStore.getState().loadWorkspace('');
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
        
        // Update workspace user
        useWorkspaceStore.getState().updateUser(updates);
      },
    }),
    {
      name: 'unipilot-auth',
    }
  )
);