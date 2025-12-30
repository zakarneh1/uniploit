import { create } from 'zustand';
import { Course, StudySession, User, UserWorkspace, Semester, Grade } from '@/types';
import { letterToPercent, getGradeScale } from '@/lib/gradeScale';

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
  loadWorkspace: (userId: string) => void;
  saveWorkspace: () => void;
  resetWorkspace: () => void;
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

  // User methods
  getUser: () => get().user,

  updateUser: (updates) => {
    set((state) => ({
      user: { ...state.user, ...updates },
    }));
    get().saveWorkspace();
  },

  // Semester methods
  getSemesters: () => get().semesters,

  getCurrentSemester: () => {
    return get().semesters.find((s) => s.isCurrent) || null;
  },

  addSemester: (semester) => {
    set((state) => ({
      semesters: [...state.semesters, semester],
    }));
    get().saveWorkspace();
  },

  updateSemester: (id, updates) => {
    set((state) => ({
      semesters: state.semesters.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().saveWorkspace();
  },

  deleteSemester: (id) => {
    // Also delete all courses in this semester
    set((state) => ({
      semesters: state.semesters.filter((s) => s.id !== id),
      courses: state.courses.filter((c) => c.semesterId !== id),
    }));
    get().saveWorkspace();
  },

  setCurrentSemester: (id) => {
    set((state) => ({
      semesters: state.semesters.map((s) => ({
        ...s,
        isCurrent: s.id === id,
      })),
    }));
    get().saveWorkspace();
  },

  // Course methods
  getCourses: () => get().courses,

  getCoursesBySemester: (semesterId) => {
    return get().courses.filter((c) => c.semesterId === semesterId);
  },

  addCourse: (course) => {
    set((state) => ({
      courses: [...state.courses, course],
    }));
    get().saveWorkspace();
  },

  updateCourse: (id, updates) => {
    set((state) => ({
      courses: state.courses.map((c) => {
        if (c.id !== id) return c;
        
        const updated = { ...c, ...updates };
        
        // If grades were updated, recompute grade percents
        if (updates.grades) {
          const user = get().user;
          const gradeScale = getGradeScale(user?.gpaScale || 4.0);
          
          updated.grades = updates.grades.map((grade: Grade) => {
            if (grade.entryType === 'letter' && grade.letterGrade) {
              return {
                ...grade,
                percent: letterToPercent(grade.letterGrade, gradeScale),
              };
            } else if (grade.entryType === 'numeric' && grade.score !== undefined && grade.maxScore) {
              return {
                ...grade,
                percent: (grade.score / grade.maxScore) * 100,
              };
            }
            return grade;
          });
        }
        
        return updated;
      }),
    }));
    get().saveWorkspace();
  },

  deleteCourse: (id) => {
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      sessions: state.sessions.filter((s) => s.courseId !== id),
    }));
    get().saveWorkspace();
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

  addSession: (session) => {
    set((state) => ({
      sessions: [...state.sessions, session],
    }));
    get().saveWorkspace();
  },

  updateSession: (id, updates) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().saveWorkspace();
  },

  deleteSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }));
    get().saveWorkspace();
  },

  toggleSessionComplete: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s
      ),
    }));
    get().saveWorkspace();
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

  loadWorkspace: (userId) => {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
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
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    } else {
      // Create default workspace for new user
      const user: User = {
        id: userId,
        email: userId,
        name: 'Student',
        gpaScale: 4.0,
      };
      const defaultWorkspace = createDefaultWorkspace(user);
      set(defaultWorkspace);
      get().saveWorkspace();
    }
  },

  saveWorkspace: () => {
    const state = get();
    if (!state.user) return;

    const key = getStorageKey(state.user.id);
    const workspace: UserWorkspace = {
      user: state.user,
      semesters: state.semesters,
      courses: state.courses,
      sessions: state.sessions,
    };

    try {
      localStorage.setItem(key, JSON.stringify(workspace));
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  },

  resetWorkspace: () => {
    const user = get().user;
    if (!user) return;

    const defaultWorkspace = createDefaultWorkspace(user);
    set(defaultWorkspace);
    get().saveWorkspace();
  },
}));