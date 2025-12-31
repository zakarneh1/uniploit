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
// For local development, point to deployed backend. For production, keep empty.
const API_BASE = "https://uniploit.ahmadsalama.com";

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
      const data = await requestJSON<Course[]>("/api/courses", {
        method: "GET",
        auth: true,
      });
      return data;
    },
    getById: async (id: string): Promise<Course | undefined> => {
      const data = await requestJSON<Course>(`/api/courses/${id}`, {
        method: "GET",
        auth: true,
      });
      return data;
    },
    create: async (course: Omit<Course, "id">): Promise<Course> => {
      const data = await requestJSON<Course>("/api/courses", {
        method: "POST",
        json: course,
        auth: true,
      });
      return data;
    },
    update: async (id: string, updates: Partial<Course>): Promise<Course> => {
      const data = await requestJSON<Course>(`/api/courses/${id}`, {
        method: "PUT",
        json: updates,
        auth: true,
      });
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await requestJSON(`/api/courses/${id}`, {
        method: "DELETE",
        auth: true,
      });
    },
  },

  semesters: {
    getAll: async (): Promise<Semester[]> => {
      const data = await requestJSON<Semester[]>("/api/semesters", {
        method: "GET",
        auth: true,
      });
      return data;
    },
    create: async (semester: Omit<Semester, "id">): Promise<Semester> => {
      const data = await requestJSON<Semester>("/api/semesters", {
        method: "POST",
        json: semester,
        auth: true,
      });
      return data;
    },
    update: async (id: string, updates: Partial<Semester>): Promise<Semester> => {
      const data = await requestJSON<Semester>(`/api/semesters/${id}`, {
        method: "PUT",
        json: updates,
        auth: true,
      });
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await requestJSON(`/api/semesters/${id}`, {
        method: "DELETE",
        auth: true,
      });
    },
  },

  grades: {
    create: async (grade: Omit<Grade, "id">): Promise<Grade> => {
      const data = await requestJSON<Grade>("/api/grades", {
        method: "POST",
        json: grade,
        auth: true,
      });
      return data;
    },
    update: async (id: string, updates: Partial<Grade>): Promise<Grade> => {
      const data = await requestJSON<Grade>(`/api/grades/${id}`, {
        method: "PUT",
        json: updates,
        auth: true,
      });
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await requestJSON(`/api/grades/${id}`, {
        method: "DELETE",
        auth: true,
      });
    },
  },

  sessions: {
    getAll: async (): Promise<StudySession[]> => {
      const data = await requestJSON<StudySession[]>("/api/sessions", {
        method: "GET",
        auth: true,
      });
      return data;
    },
    create: async (session: Omit<StudySession, "id">): Promise<StudySession> => {
      const data = await requestJSON<StudySession>("/api/sessions", {
        method: "POST",
        json: session,
        auth: true,
      });
      return data;
    },
    update: async (
      id: string,
      updates: Partial<StudySession>
    ): Promise<StudySession> => {
      const data = await requestJSON<StudySession>(`/api/sessions/${id}`, {
        method: "PUT",
        json: updates,
        auth: true,
      });
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await requestJSON(`/api/sessions/${id}`, {
        method: "DELETE",
        auth: true,
      });
    },
    toggleComplete: async (id: string): Promise<StudySession> => {
      // First get the current session
      const session = await requestJSON<StudySession>(`/api/sessions/${id}`, {
        method: "GET",
        auth: true,
      });
      // Then update it
      const data = await requestJSON<StudySession>(`/api/sessions/${id}`, {
        method: "PUT",
        json: { completed: !session.completed },
        auth: true,
      });
      return data;
    },
  },

  user: {
    getProfile: async (): Promise<User> => {
      const data = await requestJSON<User>("/api/user", {
        method: "GET",
        auth: true,
      });
      return data;
    },
    updateProfile: async (updates: Partial<User>): Promise<User> => {
      const data = await requestJSON<User>("/api/user", {
        method: "PUT",
        json: updates,
        auth: true,
      });
      return data;
    },
  },

  workspace: {
    getAll: async (): Promise<{ user: User; semesters: Semester[]; courses: Course[]; sessions: StudySession[] }> => {
      const data = await requestJSON<{ user: User; semesters: Semester[]; courses: Course[]; sessions: StudySession[] }>("/api/workspace", {
        method: "GET",
        auth: true,
      });
      return data;
    },
  },
};
