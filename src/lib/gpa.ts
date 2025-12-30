import { Course, Semester } from '@/types';
import { GradeScale, letterToPoints, getGradeScale } from './gradeScale';

export interface GPAResult {
  gpa: number;
  totalCredits: number;
  includedCourses: number;
}

/**
 * Calculate GPA for a specific semester
 */
export function calculateSemesterGPA(
  courses: Course[],
  semesterId: string,
  gpaScale: 4.0 | 4.3
): GPAResult {
  const gradeScale = getGradeScale(gpaScale);
  const semesterCourses = courses.filter(
    (c) => c.semesterId === semesterId && c.finalGradeConfirmed && c.finalLetterGrade
  );

  if (semesterCourses.length === 0) {
    return { gpa: 0, totalCredits: 0, includedCourses: 0 };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  semesterCourses.forEach((course) => {
    const points = letterToPoints(course.finalLetterGrade!, gradeScale);
    totalPoints += points * course.credits;
    totalCredits += course.credits;
  });

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Number(gpa.toFixed(2)),
    totalCredits,
    includedCourses: semesterCourses.length,
  };
}

/**
 * Calculate CGPA (Cumulative GPA) across all semesters
 */
export function calculateCGPA(courses: Course[], gpaScale: 4.0 | 4.3): GPAResult {
  const gradeScale = getGradeScale(gpaScale);
  const confirmedCourses = courses.filter((c) => c.finalGradeConfirmed && c.finalLetterGrade);

  if (confirmedCourses.length === 0) {
    return { gpa: 0, totalCredits: 0, includedCourses: 0 };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  confirmedCourses.forEach((course) => {
    const points = letterToPoints(course.finalLetterGrade!, gradeScale);
    totalPoints += points * course.credits;
    totalCredits += course.credits;
  });

  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Number(cgpa.toFixed(2)),
    totalCredits,
    includedCourses: confirmedCourses.length,
  };
}

/**
 * Calculate predicted GPA for current semester (including in-progress courses)
 */
export function calculatePredictedGPA(
  courses: Course[],
  semesterId: string,
  gpaScale: 4.0 | 4.3,
  getCurrentAverage: (course: Course) => number | null
): GPAResult {
  const gradeScale = getGradeScale(gpaScale);
  const semesterCourses = courses.filter((c) => c.semesterId === semesterId);

  if (semesterCourses.length === 0) {
    return { gpa: 0, totalCredits: 0, includedCourses: 0 };
  }

  let totalPoints = 0;
  let totalCredits = 0;
  let includedCount = 0;

  semesterCourses.forEach((course) => {
    let letterGrade: string | null = null;

    if (course.finalGradeConfirmed && course.finalLetterGrade) {
      letterGrade = course.finalLetterGrade;
    } else {
      const average = getCurrentAverage(course);
      if (average !== null) {
        letterGrade = gradeScale.ranges.find((r) => average >= r.min && average <= r.max)?.letter || null;
      }
    }

    if (letterGrade) {
      const points = letterToPoints(letterGrade, gradeScale);
      totalPoints += points * course.credits;
      totalCredits += course.credits;
      includedCount++;
    }
  });

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Number(gpa.toFixed(2)),
    totalCredits,
    includedCourses: includedCount,
  };
}

/**
 * Get transcript data grouped by semester
 */
export interface TranscriptSemester {
  semester: Semester;
  courses: Course[];
  gpa: number;
  credits: number;
}

export function generateTranscript(
  semesters: Semester[],
  courses: Course[],
  gpaScale: 4.0 | 4.3
): TranscriptSemester[] {
  return semesters
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .map((semester) => {
      const semesterCourses = courses.filter((c) => c.semesterId === semester.id);
      const gpaResult = calculateSemesterGPA(courses, semester.id, gpaScale);

      return {
        semester,
        courses: semesterCourses,
        gpa: gpaResult.gpa,
        credits: gpaResult.totalCredits,
      };
    });
}