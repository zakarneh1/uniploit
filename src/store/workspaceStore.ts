import { create } from 'zustand';
import { Course, StudySession, User, UserWorkspace, Semester, Grade } from '@/types';
import { letterToPercent, getGradeScale } from '@/lib/gradeScale';
import { api } from '@/lib/api';

interface WorkspaceState extends UserWorkspace {
  // User methods
  getUser: () => User | null;
  updateUser: (updates: Partial<User>) => void;

  // Semester methods
  getSemesters: () => Semester[];
  getCurrentSemester: () => Semester | null;
  addSemester: (semester: Semester) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void;
  setCurrentSemester: (id: string) => void;

  // Course methods
  getCourses: () => Course[];
  getCoursesBySemester: (semesterId: string) => Course[];
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  archiveCourse: (id: string) => void;
  confirmFinalGrade: (courseId: string, letterGrade: string) => void;

  // Session methods
  getSessions: () => StudySession[];
  addSession: (session: StudySession) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;
  toggleSessionComplete: (id: string) => void;

  // Workspace methods
  getCurrentWorkspace: () => UserWorkspace;
  loadWorkspace: (userId: string) => Promise<void>;
  saveWorkspace: () => Promise<void>;
  resetWorkspace: () => void;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY_PREFIX = 'unipilot-workspace-';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function createDefaultWorkspace(user: User): UserWorkspace {
  const currentSemester: Semester = {
    id: crypto.randomUUID(),
    name: 'Fall 2024',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31'),
    isCurrent: true,
  };

  return {
    user,
    semesters: [currentSemester],
    courses: [],
    sessions: [],
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  user: null as unknown as User,
  semesters: [],
  courses: [],
  sessions: [],
  isLoading: false,
  error: null,

  // User methods
  getUser: () => get().user,

  updateUser: async (updates) => {
    try {
      const updatedUser = await api.user.updateProfile(updates);
      set({ user: updatedUser });
    } catch (error) {
      console.error('Failed to update user:', error);
      set({ error: 'Failed to update user profile' });
    }
  },

  // Semester methods
  getSemesters: () => get().semesters,

  getCurrentSemester: () => {
    return get().semesters.find((s) => s.isCurrent) || null;
  },

  addSemester: async (semester) => {
    try {
      set({ isLoading: true, error: null });
      const newSemester = await api.semesters.create(semester);
      set((state) => ({
        semesters: [...state.semesters, newSemester],
      }));
    } catch (error) {
      console.error('Failed to add semester:', error);
      set({ error: 'Failed to add semester' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSemester: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedSemester = await api.semesters.update(id, updates);
      set((state) => ({
        semesters: state.semesters.map((s) => (s.id === id ? updatedSemester : s)),
      }));
    } catch (error) {
      console.error('Failed to update semester:', error);
      set({ error: 'Failed to update semester' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSemester: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await api.semesters.delete(id);
      set((state) => ({
        semesters: state.semesters.filter((s) => s.id !== id),
        courses: state.courses.filter((c) => c.semesterId !== id),
      }));
    } catch (error) {
      console.error('Failed to delete semester:', error);
      set({ error: 'Failed to delete semester' });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentSemester: async (id) => {
    try {
      set({ isLoading: true, error: null });
      // Update all semesters to set the current one
      const updatedSemesters = get().semesters.map((s) => ({
        ...s,
        isCurrent: s.id === id,
      }));

      // Update the current semester in the database
      await api.semesters.update(id, { isCurrent: true });

      set({ semesters: updatedSemesters });
    } catch (error) {
      console.error('Failed to set current semester:', error);
      set({ error: 'Failed to set current semester' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Course methods
  getCourses: () => get().courses,

  getCoursesBySemester: (semesterId) => {
    return get().courses.filter((c) => c.semesterId === semesterId);
  },

  addCourse: async (course) => {
    try {
      set({ isLoading: true, error: null });
      const newCourse = await api.courses.create(course);
      set((state) => ({
        courses: [...state.courses, newCourse],
      }));
    } catch (error) {
      console.error('Failed to add course:', error);
      set({ error: 'Failed to add course' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateCourse: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCourse = await api.courses.update(id, updates);
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? updatedCourse : c)),
      }));
    } catch (error) {
      console.error('Failed to update course:', error);
      set({ error: 'Failed to update course' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCourse: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await api.courses.delete(id);
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        sessions: state.sessions.filter((s) => s.courseId !== id),
      }));
    } catch (error) {
      console.error('Failed to delete course:', error);
      set({ error: 'Failed to delete course' });
    } finally {
      set({ isLoading: false });
    }
  },

  archiveCourse: (id) => {
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)),
    }));
    get().saveWorkspace();
  },

  confirmFinalGrade: (courseId, letterGrade) => {
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId
          ? { ...c, finalLetterGrade: letterGrade, finalGradeConfirmed: true }
          : c
      ),
    }));
    get().saveWorkspace();
  },

  // Session methods
  getSessions: () => get().sessions,

  addSession: async (session) => {
    try {
      set({ isLoading: true, error: null });
      const newSession = await api.sessions.create(session);
      set((state) => ({
        sessions: [...state.sessions, newSession],
      }));
    } catch (error) {
      console.error('Failed to add session:', error);
      set({ error: 'Failed to add study session' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSession: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedSession = await api.sessions.update(id, updates);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updatedSession : s)),
      }));
    } catch (error) {
      console.error('Failed to update session:', error);
      set({ error: 'Failed to update study session' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }));
    get().saveWorkspace();
  },

  toggleSessionComplete: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const updatedSession = await api.sessions.toggleComplete(id);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updatedSession : s)),
      }));
    } catch (error) {
      console.error('Failed to toggle session:', error);
      set({ error: 'Failed to update study session' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Workspace methods
  getCurrentWorkspace: () => {
    const state = get();
    return {
      user: state.user,
      semesters: state.semesters,
      courses: state.courses,
      sessions: state.sessions,
    };
  },

  loadWorkspace: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      const workspace = await api.workspace.getAll();

      // Convert date strings back to Date objects
      const processedWorkspace = {
        user: workspace.user,
        semesters: workspace.semesters.map((s) => ({
          ...s,
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate),
        })),
        courses: workspace.courses.map((c) => ({
          ...c,
          grades: c.grades.map((g) => ({
            ...g,
            date: new Date(g.date),
          })),
        })),
        sessions: workspace.sessions.map((s) => ({
          ...s,
          date: new Date(s.date),
        })),
      };

      set(processedWorkspace);
    } catch (error) {
      console.error('Failed to load workspace:', error);
      set({ error: 'Failed to load workspace' });
      // Fallback to local storage if API fails
      try {
        const stored = localStorage.getItem(getStorageKey(userId));
        if (stored) {
          const workspace: UserWorkspace = JSON.parse(stored);
          // Convert date strings back to Date objects
          workspace.semesters = workspace.semesters.map((s) => ({
            ...s,
            startDate: new Date(s.startDate),
            endDate: new Date(s.endDate),
          }));
          workspace.courses = workspace.courses.map((c) => ({
            ...c,
            grades: c.grades.map((g) => ({
              ...g,
              date: new Date(g.date),
            })),
          }));
          workspace.sessions = workspace.sessions.map((s) => ({
            ...s,
            date: new Date(s.date),
          }));
          set(workspace);
        }
      } catch (localError) {
        console.error('Failed to load from local storage:', localError);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  saveWorkspace: async () => {
    // Since we're using the database now, we don't need to save to local storage
    // The data is automatically saved when we make API calls
    // But we can keep this for offline fallback
    try {
      const workspace = get().getCurrentWorkspace();
      const userId = workspace.user?.id;
      if (userId) {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(workspace));
      }
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  },

  resetWorkspace: () => {
    set({
      user: null as unknown as User,
      semesters: [],
      courses: [],
      sessions: [],
      isLoading: false,
      error: null,
    });
  },
}));