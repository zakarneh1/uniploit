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
  Edit,
  MoreVertical,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { SessionDialog } from '@/components/planner/SessionDialog';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const today = new Date();

  const getSessionsForDay = (date: Date) => {
    return sessions.filter((s) => {
      try {
        return isSameDay(new Date(s.date), date);
      } catch (error) {
        console.error('Error parsing session date:', s.date, error);
        return false;
      }
    });
  };

  const todaySessions = getSessionsForDay(today);
  const completedToday = todaySessions.filter(s => s.completed).length;
  const totalToday = todaySessions.length;
  const hasStudiedToday = completedToday > 0;

  const missedSessions = sessions.filter(s => {
    try {
      const sessionDate = new Date(s.date);
      return sessionDate < today && !s.completed;
    } catch (error) {
      console.error('Error parsing session date for missed sessions:', s.date, error);
      return false;
    }
  }).length;

  const completedThisWeek = sessions.filter(
    (s) => {
      try {
        return s.completed &&
          new Date(s.date) >= weekStart &&
          new Date(s.date) < addDays(weekStart, 7);
      } catch (error) {
        console.error('Error parsing session date for week calculation:', s.date, error);
        return false;
      }
    }
  ).length;

  const totalThisWeek = sessions.filter(
    (s) => {
      try {
        return new Date(s.date) >= weekStart && new Date(s.date) < addDays(weekStart, 7);
      } catch (error) {
        console.error('Error parsing session date for week calculation:', s.date, error);
        return false;
      }
    }
  ).length;

  const weekProgress = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  // Calculate streak
  const calculateStreak = () => {
    const completedSessions = sessions.filter((s) => s.completed);
    if (completedSessions.length === 0) return 0;

    // Get unique dates with completed sessions, sorted descending
    const completedDates = [...new Set(
      completedSessions.map(s => format(new Date(s.date), 'yyyy-MM-dd'))
    )].sort().reverse();

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today has a completed session
    const todayStr = format(today, 'yyyy-MM-dd');
    const hasToday = completedDates.includes(todayStr);

    // If no session completed today, check if yesterday has one for current streak
    if (!hasToday) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      if (!completedDates.includes(yesterdayStr)) {
        return 0; // No recent completion
      }
    }

    // Count consecutive days backwards from today
    for (let i = 0; ; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');

      if (completedDates.includes(checkDateStr)) {
        streak++;
      } else {
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {hasStudiedToday ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : totalToday > 0 ? (
                <Circle className="h-6 w-6 text-yellow-500" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <div className="text-2xl font-bold">
                  {completedToday}/{totalToday}
                </div>
                <div className="text-xs text-muted-foreground">
                  {hasStudiedToday ? 'Completed' : totalToday > 0 ? 'In progress' : 'No sessions'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Missed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-red-500" />
              <div className="text-2xl font-bold">{missedSessions}</div>
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
                const isPast = day < new Date() && !isToday;
                const hasUncompletedSessions = isPast && daySessions.some(s => !s.completed);

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 rounded-lg border ${
                      isToday ? 'bg-primary/5 border-primary' :
                      hasUncompletedSessions ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                      'bg-card'
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
                          <div
                            key={session.id}
                            className="flex items-center gap-2 p-2 rounded text-xs hover:bg-muted/50 transition-colors group"
                            style={{
                              backgroundColor: course?.color ? course.color + '20' : '#f3f4f6',
                              borderLeft: `3px solid ${course?.color || '#d1d5db'}`,
                            }}
                          >
                            <button
                              onClick={() => handleToggleComplete(session.id)}
                              disabled={previewMode}
                              className="shrink-0"
                            >
                              {session.completed ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{session.title || 'Untitled Session'}</div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {session.duration || 0}m
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={previewMode}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingSessionId(session.id);
                                  setDialogOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                    </div>
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
            .sort((a, b) => {
              try {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              } catch (error) {
                console.error('Error sorting sessions:', a.date, b.date, error);
                return 0;
              }
            })
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
                            {(() => {
                              try {
                                return format(new Date(session.date), 'MMM d, yyyy');
                              } catch (error) {
                                console.error('Error formatting session date:', session.date, error);
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration || 0} minutes
                          </span>
                        </div>
                        {session.topic && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.topic}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={previewMode}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingSessionId(session.id);
                            setDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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