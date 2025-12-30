import { Course, Grade, AssessmentWeight } from '@/types';
import { letterToPercent, getGradeScale } from './gradeScale';

export interface WeightValidation {
  isValid: boolean;
  total: number;
  message: string;
}

export function validateWeights(weights: AssessmentWeight[]): WeightValidation {
  if (weights.length === 0) {
    return {
      isValid: false,
      total: 0,
      message: 'No weights defined',
    };
  }

  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  return {
    isValid,
    total,
    message: isValid ? 'Valid' : `Weights sum to ${total.toFixed(1)}% (must be 100%)`,
  };
}

export interface WeightCoverage {
  covered: number;
  total: number;
  percentage: number;
  missingTypes: string[];
}

export function calculateWeightCoverage(course: Course): WeightCoverage {
  const totalWeight = course.weights.reduce((sum, w) => sum + w.weight, 0);
  let coveredWeight = 0;
  const missingTypes: string[] = [];

  course.weights.forEach((weight) => {
    const hasGrades = course.grades.some((g) => g.assessmentType === weight.name);
    if (hasGrades) {
      coveredWeight += weight.weight;
    } else {
      missingTypes.push(weight.name);
    }
  });

  return {
    covered: coveredWeight,
    total: totalWeight,
    percentage: totalWeight > 0 ? (coveredWeight / totalWeight) * 100 : 0,
    missingTypes,
  };
}

/**
 * Calculate course average percentage from grades
 * Handles both numeric and letter grade entries
 */
export function calculateCourseAverage(course: Course, gpaScale: 4.0 | 4.3): number | null {
  const validation = validateWeights(course.weights);
  if (!validation.isValid) return null;

  if (course.grades.length === 0) return null;

  const gradeScaleObj = getGradeScale(gpaScale);
  let totalWeightedScore = 0;
  let coveredWeight = 0;

  course.weights.forEach((weight) => {
    const gradesForType = course.grades.filter((g) => g.assessmentType === weight.name);

    if (gradesForType.length > 0) {
      // Calculate average for this assessment type
      const typeAverage =
        gradesForType.reduce((sum, g) => {
          // Use the pre-computed percent (already converted from letter if needed)
          return sum + g.percent;
        }, 0) / gradesForType.length;

      totalWeightedScore += (typeAverage * weight.weight) / 100;
      coveredWeight += weight.weight;
    }
  });

  if (coveredWeight === 0) return null;

  return totalWeightedScore;
}

export interface RequiredScore {
  targetPercent: number;
  currentPercent: number;
  remainingWeight: number;
  requiredPercent: number;
  achievable: boolean;
  message: string;
}

export function calculateRequiredScore(
  course: Course,
  targetPercent: number,
  gpaScale: 4.0 | 4.3
): RequiredScore | null {
  const currentAverage = calculateCourseAverage(course, gpaScale);
  if (currentAverage === null) {
    return null;
  }

  const coverage = calculateWeightCoverage(course);
  const remainingWeight = 100 - coverage.covered;

  if (remainingWeight === 0) {
    return {
      targetPercent,
      currentPercent: currentAverage,
      remainingWeight: 0,
      requiredPercent: 0,
      achievable: currentAverage >= targetPercent,
      message: 'All weights covered',
    };
  }

  const neededPoints = targetPercent - currentAverage;
  const requiredPercent = (neededPoints / remainingWeight) * 100;

  const achievable = requiredPercent >= 0 && requiredPercent <= 100;

  let message = '';
  if (requiredPercent < 0) {
    message = 'Target already achieved!';
  } else if (requiredPercent > 100) {
    message = 'Target not achievable with remaining assessments';
  } else {
    message = `You need ${requiredPercent.toFixed(1)}% on remaining ${coverage.missingTypes.join(', ')}`;
  }

  return {
    targetPercent,
    currentPercent: currentAverage,
    remainingWeight,
    requiredPercent,
    achievable,
    message,
  };
}

export function generateCourseInsights(course: Course, gpaScale: 4.0 | 4.3): string[] {
  const insights: string[] = [];
  const average = calculateCourseAverage(course, gpaScale);
  const coverage = calculateWeightCoverage(course);
  const validation = validateWeights(course.weights);

  if (!validation.isValid) {
    insights.push(`⚠️ Grading weights sum to ${validation.total.toFixed(1)}% (must be 100%)`);
  }

  if (course.grades.length === 0) {
    insights.push('📝 No grades entered yet');
  }

  if (coverage.percentage < 50 && course.grades.length > 0) {
    insights.push(
      `📊 Only ${coverage.percentage.toFixed(0)}% of weights covered (${coverage.missingTypes.join(', ')} missing)`
    );
  }

  if (average !== null) {
    if (average < 70) {
      insights.push(`🚨 Current average ${average.toFixed(1)}% is below 70%`);
    } else if (average >= 90) {
      insights.push(`🎉 Excellent performance! Current average: ${average.toFixed(1)}%`);
    }

    // Check for declining trend
    const recentGrades = course.grades
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (recentGrades.length >= 3) {
      const recentAvg =
        recentGrades.reduce((sum, g) => sum + g.percent, 0) / recentGrades.length;
      if (recentAvg < average - 5) {
        insights.push('📉 Recent grades are below your overall average');
      }
    }
  }

  // Check for specific assessment type performance
  course.weights.forEach((weight) => {
    const gradesForType = course.grades.filter((g) => g.assessmentType === weight.name);
    if (gradesForType.length >= 2) {
      const typeAvg =
        gradesForType.reduce((sum, g) => sum + g.percent, 0) / gradesForType.length;
      if (typeAvg < 75) {
        insights.push(`💡 ${weight.name} average is ${typeAvg.toFixed(1)}% - consider extra practice`);
      }
    }
  });

  if (insights.length === 0) {
    insights.push('✅ Everything looks good! Keep up the great work.');
  }

  return insights;
}