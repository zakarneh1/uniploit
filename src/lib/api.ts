import { Course, Grade, StudySession, User } from '@/types';
import { mockCourses, mockSessions, mockUser } from '@/data/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Store users in localStorage
const USERS_KEY = 'unipilot-users';

const getStoredUsers = (): Record<string, User> => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveUser = (user: User) => {
  const users = getStoredUsers();
  users[user.email] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const findUserByEmail = (email: string): User | null => {
  const users = getStoredUsers();
  return users[email] || null;
};

const TOKEN_KEY = "unipilot-token";
const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Login failed");
      setToken(data.token);
      return data.user;
    },
    signup: async (email: string, password: string, name: string) => {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Signup failed");
      setToken(data.token);
      return data.user;
    },
    logout: async () => {
      clearToken();
    },
  },
  // keep the rest for now
};
  courses: {
    getAll: async (): Promise<Course[]> => {
      await delay(500);
      return mockCourses;
    },
    getById: async (id: string): Promise<Course | undefined> => {
      await delay(400);
      return mockCourses.find((c) => c.id === id);
    },
    create: async (course: Omit<Course, 'id'>): Promise<Course> => {
      await delay(600);
      return { ...course, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<Course>): Promise<Course> => {
      await delay(500);
      const course = mockCourses.find((c) => c.id === id);
      if (!course) throw new Error('Course not found');
      return { ...course, ...updates };
    },
    delete: async (id: string): Promise<void> => {
      await delay(400);
    },
  },

  grades: {
    create: async (grade: Omit<Grade, 'id'>): Promise<Grade> => {
      await delay(500);
      return { ...grade, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<Grade>): Promise<Grade> => {
      await delay(400);
      const course = mockCourses.find((c) => c.grades.some((g) => g.id === id));
      const grade = course?.grades.find((g) => g.id === id);
      if (!grade) throw new Error('Grade not found');
      return { ...grade, ...updates };
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
    },
  },

  sessions: {
    getAll: async (): Promise<StudySession[]> => {
      await delay(400);
      return mockSessions;
    },
    create: async (session: Omit<StudySession, 'id'>): Promise<StudySession> => {
      await delay(500);
      return { ...session, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
      await delay(400);
      const session = mockSessions.find((s) => s.id === id);
      if (!session) throw new Error('Session not found');
      return { ...session, ...updates };
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
    },
    toggleComplete: async (id: string): Promise<StudySession> => {
      await delay(300);
      const session = mockSessions.find((s) => s.id === id);
      if (!session) throw new Error('Session not found');
      return { ...session, completed: !session.completed };
    },
  },
};