import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Grade, GradeEntryType } from '@/types';
import { toast } from 'sonner';
import { getAvailableLetters, getGradeScale, letterToPercent } from '@/lib/gradeScale';

const gradeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  assessmentType: z.string().min(1, 'Assessment type is required'),
  entryType: z.enum(['letter', 'numeric']),
  // For numeric
  score: z.coerce.number().optional(),
  maxScore: z.coerce.number().optional(),
  // For letter
  letterGrade: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
});

type GradeForm = z.infer<typeof gradeSchema>;

interface GradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  gradeId?: string | null;
}

export function GradeDialog({ open, onOpenChange, courseId, gradeId }: GradeDialogProps) {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const user = useWorkspaceStore((state) => state.getUser());
  const updateCourse = useWorkspaceStore((state) => state.updateCourse);

  const course = courses.find((c) => c.id === courseId);
  const grade = gradeId ? course?.grades.find((g) => g.id === gradeId) : null;

  const gpaScale = user?.gpaScale || 4.0;
  const gradeScale = getGradeScale(gpaScale);
  const availableLetters = getAvailableLetters(gradeScale);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<GradeForm>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: '',
      assessmentType: '',
      entryType: 'numeric',
      score: 0,
      maxScore: 100,
      letterGrade: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedType = watch('assessmentType');
  const entryType = watch('entryType');
  const selectedLetter = watch('letterGrade');

  useEffect(() => {
    if (grade) {
      reset({
        name: grade.name,
        assessmentType: grade.assessmentType,
        entryType: grade.entryType,
        score: grade.score,
        maxScore: grade.maxScore,
        letterGrade: grade.letterGrade || '',
        date: new Date(grade.date).toISOString().split('T')[0],
        notes: grade.notes || '',
      });
    } else {
      reset({
        name: '',
        assessmentType: '',
        entryType: 'numeric',
        score: 0,
        maxScore: 100,
        letterGrade: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [grade, reset]);

  const onSubmit = (data: GradeForm) => {
    if (!course) return;

    const weight = course.weights.find((w) => w.name === data.assessmentType)?.weight || 0;

    // Calculate percent based on entry type
    let percent = 0;
    if (data.entryType === 'letter' && data.letterGrade) {
      percent = letterToPercent(data.letterGrade, gradeScale);
    } else if (data.entryType === 'numeric' && data.score !== undefined && data.maxScore) {
      percent = (data.score / data.maxScore) * 100;
    }

    if (grade) {
      const updatedGrades = course.grades.map((g) =>
        g.id === grade.id
          ? {
              ...g,
              ...data,
              weight,
              percent,
              date: new Date(data.date),
            }
          : g
      );
      updateCourse(courseId, { grades: updatedGrades });
      toast.success('Grade updated');
    } else {
      const newGrade: Grade = {
        id: crypto.randomUUID(),
        courseId,
        ...data,
        weight,
        percent,
        date: new Date(data.date),
        entryType: data.entryType as GradeEntryType,
      };
      updateCourse(courseId, { grades: [...course.grades, newGrade] });
      toast.success('Grade added');
    }

    onOpenChange(false);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{grade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assignment Name *</Label>
            <Input id="name" placeholder="Midterm Exam" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessmentType">Assessment Type *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('assessmentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {course.weights.map((weight) => (
                  <SelectItem key={weight.id} value={weight.name}>
                    {weight.name} ({weight.weight}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assessmentType && (
              <p className="text-sm text-destructive">{errors.assessmentType.message}</p>
            )}
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label>Grade Entry Type *</Label>
            <RadioGroup
              value={entryType}
              onValueChange={(value) => setValue('entryType', value as GradeEntryType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numeric" id="numeric" />
                <Label htmlFor="numeric" className="cursor-pointer font-normal">
                  Enter as Score
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="letter" id="letter" />
                <Label htmlFor="letter" className="cursor-pointer font-normal">
                  Enter as Letter Grade
                </Label>
              </div>
            </RadioGroup>

            {entryType === 'numeric' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="score">Score *</Label>
                  <Input
                    id="score"
                    type="number"
                    step="0.1"
                    placeholder="85"
                    {...register('score')}
                  />
                  {errors.score && (
                    <p className="text-sm text-destructive">{errors.score.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    step="0.1"
                    placeholder="100"
                    {...register('maxScore')}
                  />
                  {errors.maxScore && (
                    <p className="text-sm text-destructive">{errors.maxScore.message}</p>
                  )}
                </div>
              </div>
            )}

            {entryType === 'letter' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="letterGrade">Letter Grade *</Label>
                <Select
                  value={selectedLetter}
                  onValueChange={(value) => setValue('letterGrade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select letter grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLetters.map((letter) => (
                      <SelectItem key={letter} value={letter}>
                        {letter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.letterGrade && (
                  <p className="text-sm text-destructive">{errors.letterGrade.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Letter grades are converted to percentages for calculation
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{grade ? 'Update' : 'Add'} Grade</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}