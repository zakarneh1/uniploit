import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Calendar,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { SemesterDialog } from '@/components/semesters/SemesterDialog';
import { format } from 'date-fns';
import { calculateSemesterGPA } from '@/lib/gpa';
import { motion } from 'framer-motion';

export default function Semesters() {
  const semesters = useWorkspaceStore((state) => state.getSemesters());
  const courses = useWorkspaceStore((state) => state.getCourses());
  const user = useWorkspaceStore((state) => state.getUser());
  const deleteSemester = useWorkspaceStore((state) => state.deleteSemester);
  const setCurrentSemester = useWorkspaceStore((state) => state.setCurrentSemester);
  const { previewMode } = useUIStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);

  const gpaScale = user?.gpaScale || 4.0;

  const handleDelete = (id: string) => {
    if (previewMode) return;
    const semester = semesters.find((s) => s.id === id);
    const semesterCourses = courses.filter((c) => c.semesterId === id);
    
    if (semesterCourses.length > 0) {
      if (!confirm(`Delete "${semester?.name}" and its ${semesterCourses.length} courses? This cannot be undone.`)) {
        return;
      }
    }
    
    deleteSemester(id);
  };

  const handleEdit = (id: string) => {
    if (previewMode) return;
    setEditingSemesterId(id);
    setDialogOpen(true);
  };

  const handleSetCurrent = (id: string) => {
    if (previewMode) return;
    setCurrentSemester(id);
  };

  if (semesters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Semesters</h1>
            <p className="text-muted-foreground">Manage your academic semesters</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Semesters Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first semester to start organizing your courses.
            </p>
            <Button size="lg" onClick={() => setDialogOpen(true)} disabled={previewMode}>
              {previewMode && <Lock className="mr-2 h-4 w-4" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Semester
            </Button>
          </CardContent>
        </Card>

        <SemesterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Semesters</h1>
          <p className="text-muted-foreground">{semesters.length} semesters</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={previewMode}>
          {previewMode && <Lock className="mr-2 h-4 w-4" />}
          <Plus className="mr-2 h-4 w-4" />
          Add Semester
        </Button>
      </div>

      {/* Semesters Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {semesters
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .map((semester, index) => {
            const semesterCourses = courses.filter((c) => c.semesterId === semester.id);
            const gpaResult = calculateSemesterGPA(courses, semester.id, gpaScale);

            return (
              <motion.div
                key={semester.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={semester.isCurrent ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {semester.name}
                          {semester.isCurrent && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(semester.startDate, 'MMM d, yyyy')} -{' '}
                          {format(semester.endDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Courses</p>
                        <p className="text-2xl font-bold">{semesterCourses.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GPA</p>
                        <p className="text-2xl font-bold">
                          {gpaResult.gpa > 0 ? gpaResult.gpa.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Credits</p>
                      <p className="font-medium">{gpaResult.totalCredits} total</p>
                    </div>

                    <div className="flex gap-2">
                      {!semester.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(semester.id)}
                          disabled={previewMode}
                          className="flex-1"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Set Current
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(semester.id)}
                        disabled={previewMode}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(semester.id)}
                        disabled={previewMode}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
      </div>

      <SemesterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSemesterId(null);
        }}
        semesterId={editingSemesterId}
      />
    </div>
  );
}