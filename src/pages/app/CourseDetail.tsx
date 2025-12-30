import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Lock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Target,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import {
  calculateCourseAverage,
  validateWeights,
  calculateWeightCoverage,
  calculateRequiredScore,
  generateCourseInsights,
} from '@/lib/courseMath';
import { percentToLetter, getGradeScale } from '@/lib/gradeScale';
import { WeightEditor } from '@/components/courses/WeightEditor';
import { GradeDialog } from '@/components/courses/GradeDialog';
import { GradeCalculator } from '@/components/courses/GradeCalculator';
import { format } from 'date-fns';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courses = useWorkspaceStore((state) => state.getCourses());
  const user = useWorkspaceStore((state) => state.getUser());
  const updateCourse = useWorkspaceStore((state) => state.updateCourse);
  const { previewMode } = useUIStore();
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
        <Link to="/app/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const gpaScale = user?.gpaScale || 4.0;
  const gradeScale = getGradeScale(gpaScale);
  const average = calculateCourseAverage(course, gpaScale);
  const validation = validateWeights(course.weights);
  const coverage = calculateWeightCoverage(course);
  const insights = generateCourseInsights(course, gpaScale);

  const handleDeleteGrade = (gradeId: string) => {
    if (previewMode) return;
    if (confirm('Are you sure you want to delete this grade?')) {
      const updatedGrades = course.grades.filter((g) => g.id !== gradeId);
      updateCourse(course.id, { grades: updatedGrades });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/courses')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div
          className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: course.color }}
        >
          {course.code.substring(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.code}</h1>
          <p className="text-muted-foreground">{course.name}</p>
        </div>
        {average !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold">{average.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {percentToLetter(average, gradeScale)}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.credits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grades Entered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.grades.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weight Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverage.percentage.toFixed(0)}%</div>
            <Progress value={coverage.percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {validation.isValid ? (
              <Badge variant="default">Valid</Badge>
            ) : (
              <Badge variant="destructive">Weights Invalid</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Grading Weights</CardTitle>
                {!validation.isValid && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {validation.message}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <WeightEditor courseId={course.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instructor</span>
                <span className="font-medium">{course.instructor || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Grades</span>
                <span className="font-medium">{course.grades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final Grade</span>
                <span className="font-medium">
                  {course.finalGradeConfirmed && course.finalLetterGrade
                    ? course.finalLetterGrade
                    : 'Not confirmed'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Grade Entries</h3>
            <Button onClick={() => setGradeDialogOpen(true)} disabled={previewMode}>
              {previewMode && <Lock className="mr-2 h-4 w-4" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </div>

          {course.grades.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Grades Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first grade to start tracking your progress
                </p>
                <Button onClick={() => setGradeDialogOpen(true)} disabled={previewMode}>
                  {previewMode && <Lock className="mr-2 h-4 w-4" />}
                  Add Grade
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {course.grades
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((grade) => (
                  <Card key={grade.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{grade.name}</h4>
                            <Badge variant="secondary">{grade.assessmentType}</Badge>
                            {grade.entryType === 'letter' && (
                              <Badge variant="outline">Letter Entry</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(grade.date), 'MMM d, yyyy')}
                            </span>
                            <span>Weight: {grade.weight}%</span>
                            {grade.entryType === 'letter' && grade.letterGrade && (
                              <span>Grade: {grade.letterGrade}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {grade.percent.toFixed(1)}%
                            </div>
                            {grade.entryType === 'numeric' && grade.score !== undefined && grade.maxScore && (
                              <div className="text-sm text-muted-foreground">
                                {grade.score}/{grade.maxScore}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingGradeId(grade.id);
                                setGradeDialogOpen(true);
                              }}
                              disabled={previewMode}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGrade(grade.id)}
                              disabled={previewMode}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {grade.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{grade.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <GradeCalculator course={course} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-2xl">{insight.charAt(0)}</div>
                  <p className="flex-1">{insight.substring(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {coverage.missingTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Missing Assessment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coverage.missingTypes.map((type) => (
                    <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span>{type}</span>
                      <Badge variant="secondary">No grades yet</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <GradeDialog
        open={gradeDialogOpen}
        onOpenChange={(open) => {
          setGradeDialogOpen(open);
          if (!open) setEditingGradeId(null);
        }}
        courseId={course.id}
        gradeId={editingGradeId}
      />
    </div>
  );
}