import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Course } from '@/types';
import { toast } from 'sonner';

const courseSchema = z.object({
  semesterId: z.string().min(1, 'Semester is required'),
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.coerce.number().min(0.5).max(10),
  instructor: z.string().optional(),
  color: z.string(),
});

type CourseForm = z.infer<typeof courseSchema>;

const COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#14B8A6',
];

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
}

export function CourseDialog({ open, onOpenChange, courseId }: CourseDialogProps) {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const semesters = useWorkspaceStore((state) => state.getSemesters());
  const currentSemester = useWorkspaceStore((state) => state.getCurrentSemester());
  const addCourse = useWorkspaceStore((state) => state.addCourse);
  const updateCourse = useWorkspaceStore((state) => state.updateCourse);

  const course = courseId ? courses.find((c) => c.id === courseId) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      semesterId: currentSemester?.id || '',
      code: '',
      name: '',
      credits: 3,
      instructor: '',
      color: COLORS[0],
    },
  });

  const selectedColor = watch('color');
  const selectedSemester = watch('semesterId');

  useEffect(() => {
    if (course) {
      reset({
        semesterId: course.semesterId,
        code: course.code,
        name: course.name,
        credits: course.credits,
        instructor: course.instructor || '',
        color: course.color,
      });
    } else {
      reset({
        semesterId: currentSemester?.id || '',
        code: '',
        name: '',
        credits: 3,
        instructor: '',
        color: COLORS[0],
      });
    }
  }, [course, currentSemester, reset]);

  const onSubmit = (data: CourseForm) => {
    if (course) {
      updateCourse(course.id, data);
      toast.success('Course updated successfully');
    } else {
      const newCourse: Course = {
        id: crypto.randomUUID(),
        ...data,
        archived: false,
        weights: [],
        grades: [],
        finalGradeConfirmed: false,
      };
      addCourse(newCourse);
      toast.success('Course added successfully');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semesterId">Semester *</Label>
            <Select
              value={selectedSemester}
              onValueChange={(value) => setValue('semesterId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name} {semester.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.semesterId && (
              <p className="text-sm text-destructive">{errors.semesterId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Course Code *</Label>
            <Input id="code" placeholder="CS 101" {...register('code')} />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name *</Label>
            <Input
              id="name"
              placeholder="Introduction to Computer Science"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Credits *</Label>
            <Input
              id="credits"
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              {...register('credits')}
            />
            {errors.credits && (
              <p className="text-sm text-destructive">{errors.credits.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor (Optional)</Label>
            <Input id="instructor" placeholder="Dr. Smith" {...register('instructor')} />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className="h-10 w-10 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#000' : 'transparent',
                    transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{course ? 'Update' : 'Add'} Course</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}