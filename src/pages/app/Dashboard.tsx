import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Flame,
  Lock,
  BarChart3,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { calculatePredictedGPA, calculateCGPA } from '@/lib/gpa';
import { calculateCourseAverage, calculateWeightCoverage } from '@/lib/courseMath';
import { percentToLetter } from '@/lib/gradeScale';
import { subDays } from 'date-fns';

export default function Dashboard() {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const sessions = useWorkspaceStore((state) => state.getSessions());
  const user = useWorkspaceStore((state) => state.getUser());
  const currentSemester = useWorkspaceStore((state) => state.getCurrentSemester());
  const { previewMode } = useUIStore();

  const gpaScale = user?.gpaScale || 4.0;

  // Calculate predicted GPA for current semester
  const predictedGPA = currentSemester
    ? calculatePredictedGPA(
        courses,
        currentSemester.id,
        gpaScale,
        (course) => calculateCourseAverage(course, gpaScale)
      )
    : { gpa: 0, totalCredits: 0, includedCourses: 0 };

  // Calculate CGPA
  const cgpaResult = calculateCGPA(courses, gpaScale);

  // Completed sessions in last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentSessions = sessions.filter(
    (s) => s.completed && new Date(s.date) >= thirtyDaysAgo
  );

  // Identify at-risk courses
  const atRiskCourses = courses
    .filter((c) => {
      if (c.archived || c.finalGradeConfirmed) return false;
      if (!currentSemester || c.semesterId !== currentSemester.id) return false;

      const average = calculateCourseAverage(c, gpaScale);
      const coverage = calculateWeightCoverage(c);

      return (
        (average !== null && average < 70) ||
        coverage.percentage < 50 ||
        c.weights.length === 0
      );
    })
    .map((c) => {
      const average = calculateCourseAverage(c, gpaScale);
      const coverage = calculateWeightCoverage(c);
      let reason = '';

      if (c.weights.length === 0) {
        reason = 'No grading weights defined';
      } else if (average !== null && average < 70) {
        reason = `Low average: ${average.toFixed(1)}%`;
      } else if (coverage.percentage < 50) {
        reason = `Low coverage: ${coverage.percentage.toFixed(0)}%`;
      }

      return { course: c, reason };
    });

  // Calculate study streak
  const calculateStreak = () => {
    const sortedSessions = [...sessions]
      .filter((s) => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedSessions.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // GPA trend data (simulated for demo)
  const gpaData = Array.from({ length: 6 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    gpa: Math.max(2.0, predictedGPA.gpa - (5 - i) * 0.1),
  }));

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}! 👋</p>
          </div>
        </div>

        <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <BookOpen className="h-16 w-16 text-primary" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Get Started with UniPilot</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Begin tracking your academic journey by adding your first course.
            </p>
            <div className="space-y-4 text-left max-w-md mb-8">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  1
                </div>
                <div>
                  <p className="font-medium">Add a course</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first course with grading weights
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  2
                </div>
                <div>
                  <p className="font-medium">Enter grades</p>
                  <p className="text-sm text-muted-foreground">
                    Add your assignment and exam scores
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  3
                </div>
                <div>
                  <p className="font-medium">Track your progress</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor your GPA and identify areas for improvement
                  </p>
                </div>
              </div>
            </div>
            <Link to="/app/courses">
              <Button size="lg" disabled={previewMode} className="shadow-lg shadow-primary/20">
                {previewMode && <Lock className="mr-2 h-4 w-4" />}
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            {currentSemester ? currentSemester.name : 'No current semester'}
          </p>
        </div>
        <Link to="/app/courses">
          <Button disabled={previewMode} className="shadow-md">
            {previewMode && <Lock className="mr-2 h-4 w-4" />}
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Predicted GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {predictedGPA.gpa > 0 ? predictedGPA.gpa.toFixed(2) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current semester ({predictedGPA.includedCourses} courses)
            </p>
            {predictedGPA.gpa > 0 && (
              <Progress value={(predictedGPA.gpa / gpaScale) * 100} className="mt-2 h-1.5" />
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              CGPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {cgpaResult.gpa > 0 ? cgpaResult.gpa.toFixed(2) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cgpaResult.totalCredits} credits completed
            </p>
            {cgpaResult.gpa > 0 && (
              <Progress value={(cgpaResult.gpa / gpaScale) * 100} className="mt-2 h-1.5" />
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Study Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{recentSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>Keep it up!</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/20 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 flex items-center gap-2">
              {streak}
              {streak > 0 && <Flame className="h-6 w-6 text-orange-500 animate-pulse" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Consecutive days</p>
            {streak >= 7 && (
              <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                🔥 On fire!
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and At-Risk */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              GPA Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictedGPA.gpa > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gpaData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, gpaScale]} className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={{ fill: '#6366F1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Add courses with grades to see your GPA trend
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/10 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              At-Risk Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskCourses.length > 0 ? (
              <div className="space-y-2">
                {atRiskCourses.slice(0, 3).map(({ course, reason }) => (
                  <Link key={course.id} to={`/app/courses/${course.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-orange-200 dark:hover:border-orange-900">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                          style={{ backgroundColor: course.color }}
                        >
                          {course.code.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{course.code}</p>
                          <p className="text-xs text-muted-foreground">{reason}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="shadow-sm">At Risk</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center">
                <div>
                  <div className="relative inline-block mb-2">
                    <TrendingUp className="h-12 w-12 text-green-600" />
                    <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="font-medium text-green-600">All courses on track!</p>
                  <p className="text-sm text-muted-foreground">Keep up the great work</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}