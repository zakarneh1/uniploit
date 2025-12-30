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

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      
      const user = findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials - user not found');
      }
      
      // In a real app, you'd verify the password hash
      // For this demo, we'll just return the user
      return user;
    },
    
    signup: async (email: string, password: string, name: string): Promise<User> => {
      await delay(1000);
      
      // Check if user already exists
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }
      
      // Create new user with unique ID
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        university: '',
        major: '',
        graduationYear: new Date().getFullYear() + 4,
        gpa: 0,
        targetGpa: 3.5,
      };
      
      // Save user to localStorage
      saveUser(newUser);
      
      return newUser;
    },
    
    logout: async (): Promise<void> => {
      await delay(300);
    },
  },

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