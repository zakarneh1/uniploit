import { Course, Grade, StudySession, User } from "@/types";
import { mockCourses, mockSessions } from "@/data/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** =========================
 *  Token helpers
 *  ========================= */
const TOKEN_KEY = "unipilot-token";

const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = (t: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {}
};

const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

/** =========================
 *  HTTP helpers
 *  ========================= */
// IMPORTANT: keep this EMPTY so requests go to the same domain (Vercel) reliably.
const API_BASE = "";

type JsonValue = any;

async function requestJSON<T = JsonValue>(
  path: string,
  options: RequestInit & { json?: any; auth?: boolean } = {}
): Promise<T> {
  const { json, auth = false, headers, ...rest } = options;

  const h: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (json !== undefined) {
    h["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  // Try parse JSON; if server returns plain text, keep it.
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    // Backend might send {error:"..."} or {message:"..."}
    const msg =
      data?.error ||
      data?.message ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new Error(msg);
  }

  return data as T;
}

/** =========================
 *  API
 *  ========================= */
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const data = await requestJSON<{ token: string; user: User }>(
        "/api/auth/login",
        {
          method: "POST",
          json: { email, password },
        }
      );

      if (data?.token) setToken(data.token);
      return data.user;
    },

    signup: async (
      email: string,
      password: string,
      name: string
    ): Promise<User> => {
      const data = await requestJSON<{ token: string; user: User }>(
        "/api/auth/signup",
        {
          method: "POST",
          json: { email, password, name },
        }
      );

      if (data?.token) setToken(data.token);
      return data.user;
    },

    logout: async (): Promise<void> => {
      clearToken();
      await delay(150);
    },

    // Optional: for later if you add /api/auth/me
    me: async (): Promise<User> => {
      const data = await requestJSON<{ user: User }>("/api/auth/me", {
        method: "GET",
        auth: true,
      });
      return data.user;
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
    update: async (
      id: string,
      updates: Partial<StudySession>
    ): Promise<StudySession> => {
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
