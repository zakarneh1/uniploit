import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types';
import { calculateRequiredScore, calculateCourseAverage } from '@/lib/courseMath';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Target, TrendingUp } from 'lucide-react';

interface GradeCalculatorProps {
  course: Course;
}

export function GradeCalculator({ course }: GradeCalculatorProps) {
  const user = useWorkspaceStore((state) => state.getUser());
  const gpaScale = user?.gpaScale || 4.0;
  const [targetPercent, setTargetPercent] = useState<string>('90');
  const currentAverage = calculateCourseAverage(course, gpaScale);

  const result = targetPercent
    ? calculateRequiredScore(course, parseFloat(targetPercent), gpaScale)
    : null;

  const quickTargets = [
    { label: 'A (90%)', value: 90 },
    { label: 'B (80%)', value: 80 },
    { label: 'C (70%)', value: 70 },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What Do I Need to Score?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Average</Label>
            <div className="text-3xl font-bold">
              {currentAverage !== null ? `${currentAverage.toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Final Grade (%)</Label>
            <Input
              id="target"
              type="number"
              min="0"
              max="100"
              value={targetPercent}
              onChange={(e) => setTargetPercent(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {quickTargets.map((target) => (
              <Button
                key={target.value}
                variant="outline"
                size="sm"
                onClick={() => setTargetPercent(target.value.toString())}
              >
                {target.label}
              </Button>
            ))}
          </div>

          {result && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining Weight</span>
                <span className="font-medium">{result.remainingWeight.toFixed(1)}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Required Score</span>
                <span className="text-2xl font-bold">
                  {result.requiredPercent.toFixed(1)}%
                </span>
              </div>

              <Badge
                variant={result.achievable ? 'default' : 'destructive'}
                className="w-full justify-center"
              >
                {result.message}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Grade Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[95, 85, 75, 65].map((score) => {
              const scenario = calculateRequiredScore(course, score, gpaScale);
              if (!scenario) return null;

              return (
                <div
                  key={score}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span>To get {score}%</span>
                  <Badge variant={scenario.achievable ? 'default' : 'secondary'}>
                    Need {scenario.requiredPercent.toFixed(1)}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}