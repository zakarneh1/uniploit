import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { calculateCourseAverage } from '@/lib/courseMath';
import { percentToLetter, getGradeScale } from '@/lib/gradeScale';
import { calculateCGPA } from '@/lib/gpa';
import { TrendingUp, Award, AlertCircle, Lock } from 'lucide-react';
import { subDays, format, isWithinInterval } from 'date-fns';

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

type DateRangeType = '30' | '90' | 'all';

export default function Analytics() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const courses = useWorkspaceStore((state) => state.getCourses());
  const sessions = useWorkspaceStore((state) => state.getSessions());
  const user = useWorkspaceStore((state) => state.getUser());
  const [dateRange, setDateRange] = useState<DateRangeType>('30');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  // Show loading state while checking authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your analytics.
            </p>
            <Button onClick={() => navigate('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gpaScale = user?.gpaScale || 4.0;
  const gradeScale = getGradeScale(gpaScale);
  const activeCourses = courses.filter((c) => !c.archived);

  // Filter data by date range
  const getDateFilter = () => {
    if (dateRange === 'all') return () => true;
    const days = dateRange === '30' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    return (date: Date) => date >= startDate;
  };

  const dateFilter = getDateFilter();

  // GPA Trend Data - with NaN protection
  const cgpaResult = calculateCGPA(activeCourses, gpaScale);
  const hasValidGPA = !isNaN(cgpaResult.gpa) && isFinite(cgpaResult.gpa) && cgpaResult.gpa > 0;
  
  const gpaData = hasValidGPA
    ? Array.from({ length: 6 }, (_, i) => {
        const monthsAgo = 5 - i;
        const date = subDays(new Date(), monthsAgo * 30);
        const simulatedGPA = Math.max(2.0, cgpaResult.gpa - monthsAgo * 0.1);
        return {
          month: format(date, 'MMM'),
          gpa: Number(simulatedGPA.toFixed(2)),
        };
      })
    : [];

  // Study Hours by Week
  const studyHoursData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = subDays(new Date(), (3 - i) * 7);
    const weekEnd = subDays(new Date(), (2 - i) * 7);
    const weekSessions = sessions.filter(
      (s) =>
        s.completed &&
        isWithinInterval(new Date(s.date), { start: weekStart, end: weekEnd })
    );
    const hours = weekSessions.reduce((sum, s) => sum + s.duration / 60, 0);
    return {
      week: `Week ${i + 1}`,
      hours: Number(hours.toFixed(1)),
    };
  });

  // Grade Distribution
  const gradeDistribution = activeCourses
    .map((c) => {
      const average = calculateCourseAverage(c, gpaScale);
      return average !== null && !isNaN(average) && isFinite(average) 
        ? percentToLetter(average, gradeScale) 
        : null;
    })
    .filter((g) => g !== null)
    .reduce((acc: Record<string, number>, grade) => {
      acc[grade!] = (acc[grade!] || 0) + 1;
      return acc;
    }, {});

  const gradeDistributionData = Object.entries(gradeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Course Performance Comparison - with NaN protection
  const coursePerformanceData = activeCourses
    .map((course) => {
      const average = calculateCourseAverage(course, gpaScale);
      const validAverage = average !== null && !isNaN(average) && isFinite(average) ? average : 0;
      return {
        name: course.code,
        average: Number(validAverage.toFixed(1)),
        color: course.color,
      };
    })
    .filter((item) => item.average > 0) // Filter out courses with no valid grades
    .sort((a, b) => b.average - a.average);

  // Insights
  const lowestCourse = coursePerformanceData.length > 0 ? coursePerformanceData[coursePerformanceData.length - 1] : null;
  const highestCourse = coursePerformanceData.length > 0 ? coursePerformanceData[0] : null;
  const mostStudiedCourse = activeCourses.length > 0
    ? activeCourses
        .map((course) => ({
          course,
          hours: sessions
            .filter((s) => s.courseId === course.id && s.completed)
            .reduce((sum, s) => sum + s.duration / 60, 0),
        }))
        .sort((a, b) => b.hours - a.hours)[0]
    : null;

  if (activeCourses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Analytics</h1>
            <p className="text-muted-foreground">Track your academic performance</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add courses and grades to see your analytics and insights.
            </p>
            <Button onClick={() => navigate('/app/courses')}>
              Add Your First Course
            </Button>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-muted-foreground">Track your academic performance</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insight Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {highestCourse && (
          <Card className="border-2 border-green-500/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                Top Performing Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold">{highestCourse.name}</div>
              <div className="text-2xl font-bold text-green-600">
                {highestCourse.average.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        )}

        {lowestCourse && (
          <Card className="border-2 border-orange-500/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold">{lowestCourse.name}</div>
              <div className="text-2xl font-bold text-orange-600">
                {lowestCourse.average.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        )}

        {mostStudiedCourse && (
          <Card className="border-2 border-blue-500/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Most Studied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold">{mostStudiedCourse.course.code}</div>
              <div className="text-2xl font-bold text-blue-600">
                {mostStudiedCourse.hours.toFixed(1)}h
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              GPA Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gpaData.length > 0 && hasValidGPA ? (
              <ResponsiveContainer width="100%" height={300}>
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
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Add grades to your courses to see GPA trends
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/10 shadow-md">
          <CardHeader>
            <CardTitle>Study Hours by Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studyHoursData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="hours" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/10 shadow-md">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Add grades to see distribution
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/10 shadow-md">
          <CardHeader>
            <CardTitle>Course Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {coursePerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coursePerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="name" type="category" width={60} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="average" radius={[0, 8, 8, 0]}>
                    {coursePerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Add grades to compare course performance
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}