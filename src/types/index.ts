export interface User {
  id: string;
  email: string;
  name: string;
  gpaScale: 4.0 | 4.3;
  semesterStart?: string;
  semesterEnd?: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

export interface AssessmentWeight {
  id: string;
  name: string;
  weight: number;
}

export type GradeEntryType = 'letter' | 'numeric';

export interface Grade {
  id: string;
  courseId: string;
  assessmentType: string;
  name: string;
  entryType: GradeEntryType;
  // For numeric entry
  score?: number;
  maxScore?: number;
  // For letter entry
  letterGrade?: string;
  // Computed percent (from score or letter)
  percent: number;
  weight: number;
  date: Date;
  notes?: string;
}

export interface Course {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  instructor?: string;
  color: string;
  archived: boolean;
  weights: AssessmentWeight[];
  grades: Grade[];
  finalLetterGrade?: string;
  finalGradeConfirmed: boolean;
}

export interface StudySession {
  id: string;
  courseId: string;
  title: string;
  topic?: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  date: Date;
  completed: boolean;
  notes?: string;
}

export interface UserWorkspace {
  user: User;
  semesters: Semester[];
  courses: Course[];
  sessions: StudySession[];
}