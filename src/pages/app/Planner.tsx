import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Lock,
  Flame,
  LayoutList,
  CalendarDays,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { SessionDialog } from '@/components/planner/SessionDialog';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

export default function Planner() {
  const sessions = useWorkspaceStore((state) => state.getSessions());
  const courses = useWorkspaceStore((state) => state.getCourses());
  const toggleSessionComplete = useWorkspaceStore((state) => state.toggleSessionComplete);
  const { previewMode } = useUIStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSessionsForDay = (date: Date) => {
    return sessions.filter((s) => isSameDay(new Date(s.date), date));
  };

  const completedThisWeek = sessions.filter(
    (s) =>
      s.completed &&
      new Date(s.date) >= weekStart &&
      new Date(s.date) < addDays(weekStart, 7)
  ).length;

  const totalThisWeek = sessions.filter(
    (s) => new Date(s.date) >= weekStart && new Date(s.date) < addDays(weekStart, 7)
  ).length;

  const weekProgress = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  // Calculate streak
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

  const handleToggleComplete = (id: string) => {
    if (previewMode) return;
    toggleSessionComplete(id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Study Planner</h1>
            <p className="text-muted-foreground">Plan and track your study sessions</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Study Sessions Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first study session to start building productive habits.
            </p>
            <Button size="lg" onClick={() => setDialogOpen(true)} disabled={previewMode}>
              {previewMode && <Lock className="mr-2 h-4 w-4" />}
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>

        <SessionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground">
            {completedThisWeek} of {totalThisWeek} sessions completed this week
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={previewMode}>
          {previewMode && <Lock className="mr-2 h-4 w-4" />}
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{weekProgress.toFixed(0)}%</div>
            <Progress value={weekProgress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <div className="text-2xl font-bold">{streak} days</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                sessions
                  .filter((s) => s.completed)
                  .reduce((sum, s) => sum + s.duration, 0) / 60
              ).toFixed(1)}
              h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewMode('calendar')}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <LayoutList className="mr-2 h-4 w-4" />
          List
        </Button>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Week of {format(weekStart, 'MMM d, yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const daySessions = getSessionsForDay(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${
                      isToday ? 'bg-primary/5 border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-lg font-bold">{format(day, 'd')}</div>
                    </div>
                    <div className="space-y-1">
                      {daySessions.map((session) => {
                        const course = courses.find((c) => c.id === session.courseId);
                        return (
                          <button
                            key={session.id}
                            onClick={() => handleToggleComplete(session.id)}
                            disabled={previewMode}
                            className="w-full text-left p-2 rounded text-xs hover:bg-muted/50 transition-colors"
                            style={{
                              backgroundColor: course?.color + '20',
                              borderLeft: `3px solid ${course?.color}`,
                            }}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {session.completed ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                              <span className="font-medium truncate">{session.title}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {session.duration}m
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {sessions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((session) => {
              const course = courses.find((c) => c.id === session.courseId);
              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleComplete(session.id)}
                        disabled={previewMode}
                        className="shrink-0"
                      >
                        {session.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>

                      <div
                        className="h-12 w-1 rounded"
                        style={{ backgroundColor: course?.color }}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{session.title}</h4>
                          <Badge variant="secondary">{course?.code}</Badge>
                          <div
                            className={`h-2 w-2 rounded-full ${getPriorityColor(
                              session.priority
                            )}`}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(session.date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration} minutes
                          </span>
                        </div>
                        {session.topic && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.topic}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <SessionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSessionId(null);
        }}
        sessionId={editingSessionId}
      />
    </div>
  );
}