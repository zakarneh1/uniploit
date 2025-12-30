import { Course, Grade, StudySession, User } from "@/types";
import { mockCourses, mockSessions } from "@/data/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKEN_KEY = "unipilot-token";
const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Login failed");

      setToken(data.token);
      return data.user as User;
    },

    signup: async (email: string, password: string, name: string): Promise<User> => {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Signup failed");

      setToken(data.token);
      return data.user as User;
    },

    logout: async (): Promise<void> => {
      clearToken();
      await delay(200);
    },
  },

  // keep the rest as placeholders for now (so app doesn't break)
  courses: {
    getAll: async (): Promise<Course[]> => {
      await delay(200);
      return mockCourses;
    },
    getById: async (id: string): Promise<Course | undefined> => {
      await delay(200);
      return mockCourses.find((c) => c.id === id);
    },
    create: async (course: Omit<Course, "id">): Promise<Course> => {
      await delay(200);
      return { ...course, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<Course>): Promise<Course> => {
      await delay(200);
      const course = mockCourses.find((c) => c.id === id);
      if (!course) throw new Error("Course not found");
      return { ...course, ...updates };
    },
    delete: async (_id: string): Promise<void> => {
      await delay(200);
    },
  },

  grades: {
    create: async (grade: Omit<Grade, "id">): Promise<Grade> => {
      await delay(200);
      return { ...grade, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<Grade>): Promise<Grade> => {
      await delay(200);
      const course = mockCourses.find((c) => c.grades.some((g) => g.id === id));
      const grade = course?.grades.find((g) => g.id === id);
      if (!grade) throw new Error("Grade not found");
      return { ...grade, ...updates };
    },
    delete: async (_id: string): Promise<void> => {
      await delay(200);
    },
  },

  sessions: {
    getAll: async (): Promise<StudySession[]> => {
      await delay(200);
      return mockSessions;
    },
    create: async (session: Omit<StudySession, "id">): Promise<StudySession> => {
      await delay(200);
      return { ...session, id: Date.now().toString() };
    },
    update: async (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
      await delay(200);
      const session = mockSessions.find((s) => s.id === id);
      if (!session) throw new Error("Session not found");
      return { ...session, ...updates };
    },
    delete: async (_id: string): Promise<void> => {
      await delay(200);
    },
    toggleComplete: async (id: string): Promise<StudySession> => {
      await delay(200);
      const session = mockSessions.find((s) => s.id === id);
      if (!session) throw new Error("Session not found");
      return { ...session, completed: !session.completed };
    },
  },
};
