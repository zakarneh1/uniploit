import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  Lock,
  MoreVertical,
  Archive,
  Trash2,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { calculateCourseAverage, validateWeights, calculateWeightCoverage } from '@/lib/courseMath';
import { percentToLetter } from '@/lib/gradeScale';
import { CourseDialog } from '@/components/courses/CourseDialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Courses() {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const semesters = useWorkspaceStore((state) => state.getSemesters());
  const currentSemester = useWorkspaceStore((state) => state.getCurrentSemester());
  const user = useWorkspaceStore((state) => state.getUser());
  const archiveCourse = useWorkspaceStore((state) => state.archiveCourse);
  const deleteCourse = useWorkspaceStore((state) => state.deleteCourse);
  const confirmFinalGrade = useWorkspaceStore((state) => state.confirmFinalGrade);
  const { viewMode, setViewMode, previewMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>(currentSemester?.id || 'all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  const gpaScale = user?.gpaScale || 4.0;

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? true : !course.archived;
    const matchesSemester = selectedSemester === 'all' || course.semesterId === selectedSemester;
    return matchesSearch && matchesArchived && matchesSemester;
  });

  const handleArchive = (id: string) => {
    if (previewMode) return;
    archiveCourse(id);
  };

  const handleDelete = (id: string) => {
    if (previewMode) return;
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteCourse(id);
    }
  };

  const handleEdit = (id: string) => {
    if (previewMode) return;
    setEditingCourse(id);
    setDialogOpen(true);
  };

  const handleConfirmGrade = (courseId: string) => {
    if (previewMode) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const average = calculateCourseAverage(course, gpaScale);
    if (average === null) {
      toast.error('Cannot confirm grade: course has no valid average');
      return;
    }

    const letterGrade = percentToLetter(average, { scale: gpaScale, ranges: [] });
    confirmFinalGrade(courseId, letterGrade);
    toast.success(`Final grade confirmed: ${letterGrade}`);
  };

  const getCourseStatus = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return null;

    if (course.finalGradeConfirmed && course.finalLetterGrade) {
      return { label: course.finalLetterGrade, variant: 'default' as const };
    }

    const average = calculateCourseAverage(course, gpaScale);
    const validation = validateWeights(course.weights);
    const coverage = calculateWeightCoverage(course);

    if (!validation.isValid) {
      return { label: 'Weights Invalid', variant: 'destructive' as const };
    }

    if (course.grades.length === 0) {
      return { label: 'No Grades', variant: 'secondary' as const };
    }

    if (average === null) {
      return { label: 'Incomplete', variant: 'secondary' as const };
    }

    if (average < 70) {
      return { label: 'At Risk', variant: 'destructive' as const };
    }

    if (coverage.percentage < 50) {
      return { label: `${coverage.percentage.toFixed(0)}% Coverage`, variant: 'secondary' as const };
    }

    const letterGrade = percentToLetter(average, { scale: gpaScale, ranges: [] });
    return { label: `${letterGrade} (${average.toFixed(1)}%)`, variant: 'default' as const };
  };

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground">Manage your courses and grades</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Courses Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add your first course to start tracking grades and calculating your GPA.
            </p>
            <Button size="lg" onClick={() => setDialogOpen(true)} disabled={previewMode}>
              {previewMode && <Lock className="mr-2 h-4 w-4" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </CardContent>
        </Card>

        <CourseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          courseId={editingCourse}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={previewMode}>
          {previewMode && <Lock className="mr-2 h-4 w-4" />}
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={previewMode}
          />
        </div>
        <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={previewMode}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
          disabled={previewMode}
        >
          <Archive className="mr-2 h-4 w-4" />
          {showArchived ? 'Hide' : 'Show'} Archived
        </Button>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => {
            const status = getCourseStatus(course.id);
            const average = calculateCourseAverage(course, gpaScale);
            const coverage = calculateWeightCoverage(course);
            const semester = semesters.find((s) => s.id === course.semesterId);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/app/courses/${course.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: course.color }}
                        >
                          {course.code.substring(0, 2)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" disabled={previewMode}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(course.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {!course.finalGradeConfirmed && average !== null && (
                              <DropdownMenuItem onClick={() => handleConfirmGrade(course.id)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirm Final Grade
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleArchive(course.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              {course.archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(course.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="font-bold text-lg mb-1">{course.code}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {course.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">{semester?.name}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credits</span>
                          <span className="font-medium">{course.credits}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Average</span>
                          <span className="font-medium">
                            {average !== null ? `${average.toFixed(1)}%` : '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Coverage</span>
                          <span className="font-medium">{coverage.percentage.toFixed(0)}%</span>
                        </div>
                      </div>

                      {status && (
                        <Badge variant={status.variant} className="mt-4 w-full justify-center">
                          {course.finalGradeConfirmed && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {status.label}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Course</th>
                    <th className="text-left p-4 font-medium">Semester</th>
                    <th className="text-left p-4 font-medium">Credits</th>
                    <th className="text-left p-4 font-medium">Average</th>
                    <th className="text-left p-4 font-medium">Coverage</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const status = getCourseStatus(course.id);
                    const average = calculateCourseAverage(course, gpaScale);
                    const coverage = calculateWeightCoverage(course);
                    const semester = semesters.find((s) => s.id === course.semesterId);

                    return (
                      <tr key={course.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Link to={`/app/courses/${course.id}`}>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: course.color }}
                              >
                                {course.code.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium">{course.code}</p>
                                <p className="text-sm text-muted-foreground">{course.name}</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4 text-sm">{semester?.name}</td>
                        <td className="p-4">{course.credits}</td>
                        <td className="p-4">
                          {average !== null ? `${average.toFixed(1)}%` : '--'}
                        </td>
                        <td className="p-4">{coverage.percentage.toFixed(0)}%</td>
                        <td className="p-4">
                          {status && (
                            <Badge variant={status.variant}>
                              {course.finalGradeConfirmed && <CheckCircle2 className="mr-1 h-3 w-3" />}
                              {status.label}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={previewMode}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(course.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {!course.finalGradeConfirmed && average !== null && (
                                <DropdownMenuItem onClick={() => handleConfirmGrade(course.id)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Confirm Final Grade
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleArchive(course.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                {course.archived ? 'Unarchive' : 'Archive'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(course.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CourseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}
        courseId={editingCourse}
      />
    </div>
  );
}