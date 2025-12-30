export interface GradeRange {
  letter: string;
  min: number;
  max: number;
  points: number;
}

export interface GradeScale {
  scale: 4.0 | 4.3;
  ranges: GradeRange[];
}

export const DEFAULT_GRADE_SCALE_4_0: GradeScale = {
  scale: 4.0,
  ranges: [
    { letter: 'A', min: 90, max: 100, points: 4.0 },
    { letter: 'A-', min: 85, max: 89, points: 3.7 },
    { letter: 'B+', min: 80, max: 84, points: 3.3 },
    { letter: 'B', min: 75, max: 79, points: 3.0 },
    { letter: 'B-', min: 70, max: 74, points: 2.7 },
    { letter: 'C+', min: 65, max: 69, points: 2.3 },
    { letter: 'C', min: 60, max: 64, points: 2.0 },
    { letter: 'C-', min: 55, max: 59, points: 1.7 },
    { letter: 'D+', min: 50, max: 54, points: 1.3 },
    { letter: 'D', min: 45, max: 49, points: 1.0 },
    { letter: 'F', min: 0, max: 44, points: 0.0 },
  ],
};

export const DEFAULT_GRADE_SCALE_4_3: GradeScale = {
  scale: 4.3,
  ranges: [
    { letter: 'A+', min: 95, max: 100, points: 4.3 },
    { letter: 'A', min: 90, max: 94, points: 4.0 },
    { letter: 'A-', min: 85, max: 89, points: 3.7 },
    { letter: 'B+', min: 80, max: 84, points: 3.3 },
    { letter: 'B', min: 75, max: 79, points: 3.0 },
    { letter: 'B-', min: 70, max: 74, points: 2.7 },
    { letter: 'C+', min: 65, max: 69, points: 2.3 },
    { letter: 'C', min: 60, max: 64, points: 2.0 },
    { letter: 'C-', min: 55, max: 59, points: 1.7 },
    { letter: 'D+', min: 50, max: 54, points: 1.3 },
    { letter: 'D', min: 45, max: 49, points: 1.0 },
    { letter: 'F', min: 0, max: 44, points: 0.0 },
  ],
};

/**
 * Convert a percentage to a letter grade based on the grade scale
 */
export function percentToLetter(percent: number, gradeScale: GradeScale): string {
  const range = gradeScale.ranges.find((r) => percent >= r.min && percent <= r.max);
  return range?.letter || 'F';
}

/**
 * Convert a letter grade to grade points
 */
export function letterToPoints(letter: string, gradeScale: GradeScale): number {
  const range = gradeScale.ranges.find((r) => r.letter === letter);
  return range?.points ?? 0;
}

/**
 * Convert a letter grade to a percentage (using midpoint of range)
 */
export function letterToPercent(letter: string, gradeScale: GradeScale): number {
  const range = gradeScale.ranges.find((r) => r.letter === letter);
  if (!range) return 0;
  return (range.min + range.max) / 2;
}

/**
 * Get all available letter grades for the scale
 */
export function getAvailableLetters(gradeScale: GradeScale): string[] {
  return gradeScale.ranges.map((r) => r.letter);
}

/**
 * Validate and get grade scale
 */
export function getGradeScale(scale: 4.0 | 4.3): GradeScale {
  return scale === 4.3 ? DEFAULT_GRADE_SCALE_4_3 : DEFAULT_GRADE_SCALE_4_0;
}