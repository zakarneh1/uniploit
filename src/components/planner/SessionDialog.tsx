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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { StudySession } from '@/types';
import { toast } from 'sonner';

const sessionSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  topic: z.string().optional(),
  duration: z.coerce.number().min(15).max(480),
  priority: z.enum(['low', 'medium', 'high']),
  date: z.string(),
  notes: z.string().optional(),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string | null;
}

export function SessionDialog({ open, onOpenChange, sessionId }: SessionDialogProps) {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const sessions = useWorkspaceStore((state) => state.getSessions());
  const addSession = useWorkspaceStore((state) => state.addSession);
  const updateSession = useWorkspaceStore((state) => state.updateSession);

  const session = sessionId ? sessions.find((s) => s.id === sessionId) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      courseId: '',
      title: '',
      topic: '',
      duration: 60,
      priority: 'medium',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedCourse = watch('courseId');
  const selectedPriority = watch('priority');

  useEffect(() => {
    if (session) {
      reset({
        courseId: session.courseId,
        title: session.title,
        topic: session.topic || '',
        duration: session.duration,
        priority: session.priority,
        date: new Date(session.date).toISOString().split('T')[0],
        notes: session.notes || '',
      });
    } else {
      reset({
        courseId: '',
        title: '',
        topic: '',
        duration: 60,
        priority: 'medium',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [session, reset]);

  const onSubmit = (data: SessionForm) => {
    if (session) {
      updateSession(session.id, {
        ...data,
        date: new Date(data.date),
      });
      toast.success('Session updated');
    } else {
      const newSession: StudySession = {
        id: crypto.randomUUID(),
        ...data,
        completed: false,
        date: new Date(data.date),
      };
      addSession(newSession);
      toast.success('Session created');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'Create Study Session'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course *</Label>
            <Select value={selectedCourse} onValueChange={(value) => setValue('courseId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter((c) => !c.archived)
                  .map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-sm text-destructive">{errors.courseId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input id="title" placeholder="Review Chapter 5" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input id="topic" placeholder="Derivatives and integrals" {...register('topic')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                step="15"
                {...register('duration')}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Textarea id="notes" placeholder="Additional notes..." {...register('notes')} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{session ? 'Update' : 'Create'} Session</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}