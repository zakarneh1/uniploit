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
import { Checkbox } from '@/components/ui/checkbox';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Semester } from '@/types';
import { toast } from 'sonner';

const semesterSchema = z.object({
  name: z.string().min(1, 'Semester name is required'),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean(),
});

type SemesterForm = z.infer<typeof semesterSchema>;

interface SemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId?: string | null;
}

export function SemesterDialog({ open, onOpenChange, semesterId }: SemesterDialogProps) {
  const semesters = useWorkspaceStore((state) => state.getSemesters());
  const addSemester = useWorkspaceStore((state) => state.addSemester);
  const updateSemester = useWorkspaceStore((state) => state.updateSemester);

  const semester = semesterId ? semesters.find((s) => s.id === semesterId) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SemesterForm>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    },
  });

  const isCurrent = watch('isCurrent');

  useEffect(() => {
    if (semester) {
      reset({
        name: semester.name,
        startDate: new Date(semester.startDate).toISOString().split('T')[0],
        endDate: new Date(semester.endDate).toISOString().split('T')[0],
        isCurrent: semester.isCurrent,
      });
    } else {
      reset({
        name: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
      });
    }
  }, [semester, reset]);

  const onSubmit = (data: SemesterForm) => {
    if (semester) {
      updateSemester(semester.id, {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      toast.success('Semester updated');
    } else {
      const newSemester: Semester = {
        id: crypto.randomUUID(),
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      addSemester(newSemester);
      toast.success('Semester added');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{semester ? 'Edit Semester' : 'Add Semester'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Semester Name *</Label>
            <Input id="name" placeholder="Fall 2024" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrent"
              checked={isCurrent}
              onCheckedChange={(checked) => setValue('isCurrent', checked as boolean)}
            />
            <Label htmlFor="isCurrent" className="cursor-pointer">
              Set as current semester
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{semester ? 'Update' : 'Add'} Semester</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}