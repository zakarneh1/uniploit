import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Lock, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { AssessmentWeight } from '@/types';
import { validateWeights } from '@/lib/courseMath';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WeightEditorProps {
  courseId: string;
}

// Common assessment type presets
const ASSESSMENT_PRESETS = {
  standard: [
    { name: 'Assignments', weight: 30 },
    { name: 'Quizzes', weight: 20 },
    { name: 'Midterm', weight: 20 },
    { name: 'Final', weight: 30 },
  ],
  projectBased: [
    { name: 'Assignments', weight: 20 },
    { name: 'Quizzes', weight: 15 },
    { name: 'Midterm', weight: 20 },
    { name: 'Projects', weight: 25 },
    { name: 'Final', weight: 20 },
  ],
  examHeavy: [
    { name: 'Assignments', weight: 20 },
    { name: 'Quizzes', weight: 10 },
    { name: 'Midterm', weight: 30 },
    { name: 'Final', weight: 40 },
  ],
  balanced: [
    { name: 'Assignments', weight: 25 },
    { name: 'Quizzes', weight: 15 },
    { name: 'Midterm', weight: 25 },
    { name: 'Projects', weight: 15 },
    { name: 'Final', weight: 20 },
  ],
};

export function WeightEditor({ courseId }: WeightEditorProps) {
  const courses = useWorkspaceStore((state) => state.getCourses());
  const updateCourse = useWorkspaceStore((state) => state.updateCourse);
  const { previewMode } = useUIStore();
  const course = courses.find((c) => c.id === courseId);

  const [weights, setWeights] = useState<AssessmentWeight[]>(course?.weights || []);
  const [newWeightName, setNewWeightName] = useState('');
  const [newWeightValue, setNewWeightValue] = useState('');
  const [showPresets, setShowPresets] = useState(weights.length === 0);

  if (!course) return null;

  const validation = validateWeights(weights);

  const handleApplyPreset = (presetKey: keyof typeof ASSESSMENT_PRESETS) => {
    if (previewMode) return;
    
    const preset = ASSESSMENT_PRESETS[presetKey];
    const newWeights: AssessmentWeight[] = preset.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      weight: p.weight,
    }));

    setWeights(newWeights);
    updateCourse(courseId, { weights: newWeights });
    setShowPresets(false);
    toast.success('Assessment weights configured');
  };

  const handleAddWeight = () => {
    if (previewMode) return;
    if (!newWeightName.trim() || !newWeightValue) {
      toast.error('Please enter both name and weight');
      return;
    }

    const weight = parseFloat(newWeightValue);
    if (isNaN(weight) || weight <= 0 || weight > 100) {
      toast.error('Weight must be between 0 and 100');
      return;
    }

    const newWeight: AssessmentWeight = {
      id: crypto.randomUUID(),
      name: newWeightName.trim(),
      weight,
    };

    const updatedWeights = [...weights, newWeight];
    setWeights(updatedWeights);
    updateCourse(courseId, { weights: updatedWeights });
    setNewWeightName('');
    setNewWeightValue('');
    toast.success('Weight added');
  };

  const handleUpdateWeight = (id: string, field: 'name' | 'weight', value: string | number) => {
    if (previewMode) return;
    const updatedWeights = weights.map((w) =>
      w.id === id ? { ...w, [field]: field === 'weight' ? parseFloat(value as string) : value } : w
    );
    setWeights(updatedWeights);
    updateCourse(courseId, { weights: updatedWeights });
  };

  const handleDeleteWeight = (id: string) => {
    if (previewMode) return;
    const updatedWeights = weights.filter((w) => w.id !== id);
    setWeights(updatedWeights);
    updateCourse(courseId, { weights: updatedWeights });
    toast.success('Weight removed');
  };

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-muted-foreground">Total Weight: </span>
          <span className={`font-bold ${validation.isValid ? 'text-green-600' : 'text-destructive'}`}>
            {validation.total.toFixed(1)}%
          </span>
        </div>
        {validation.isValid ? (
          <Badge variant="default">✓ Valid</Badge>
        ) : (
          <Badge variant="destructive">{validation.message}</Badge>
        )}
      </div>

      {/* Quick Setup Presets */}
      {showPresets && weights.length === 0 && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Quick Setup</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a preset to quickly configure your grading weights:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3"
              onClick={() => handleApplyPreset('standard')}
              disabled={previewMode}
            >
              <span className="font-semibold">Standard</span>
              <span className="text-xs text-muted-foreground">
                Assignments 30%, Quizzes 20%, Midterm 20%, Final 30%
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3"
              onClick={() => handleApplyPreset('projectBased')}
              disabled={previewMode}
            >
              <span className="font-semibold">Project-Based</span>
              <span className="text-xs text-muted-foreground">
                Assignments 20%, Quizzes 15%, Midterm 20%, Projects 25%, Final 20%
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3"
              onClick={() => handleApplyPreset('examHeavy')}
              disabled={previewMode}
            >
              <span className="font-semibold">Exam-Heavy</span>
              <span className="text-xs text-muted-foreground">
                Assignments 20%, Quizzes 10%, Midterm 30%, Final 40%
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3"
              onClick={() => handleApplyPreset('balanced')}
              disabled={previewMode}
            >
              <span className="font-semibold">Balanced</span>
              <span className="text-xs text-muted-foreground">
                Assignments 25%, Quizzes 15%, Midterm 25%, Projects 15%, Final 20%
              </span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowPresets(false)}
          >
            Or create custom weights
          </Button>
        </div>
      )}

      {/* Existing Weights */}
      {weights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Assessment Types & Weights</Label>
            {weights.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
                disabled={previewMode}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {showPresets ? 'Hide' : 'Show'} Presets
              </Button>
            )}
          </div>
          {weights.map((weight) => (
            <div key={weight.id} className="flex items-center gap-2">
              <Input
                value={weight.name}
                onChange={(e) => handleUpdateWeight(weight.id, 'name', e.target.value)}
                className="flex-1"
                placeholder="Assessment Type"
                disabled={previewMode}
              />
              <Input
                type="number"
                value={weight.weight}
                onChange={(e) => handleUpdateWeight(weight.id, 'weight', e.target.value)}
                className="w-24"
                min="0"
                max="100"
                step="0.1"
                disabled={previewMode}
              />
              <span className="text-sm text-muted-foreground w-4">%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteWeight(weight.id)}
                disabled={previewMode}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Weight */}
      <div className="flex items-end gap-2 pt-4 border-t">
        <div className="flex-1 space-y-2">
          <Label>Assessment Type</Label>
          <Input
            placeholder="e.g., Assignments, Midterm, Final"
            value={newWeightName}
            onChange={(e) => setNewWeightName(e.target.value)}
            disabled={previewMode}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddWeight();
              }
            }}
          />
        </div>
        <div className="w-32 space-y-2">
          <Label>Weight %</Label>
          <Input
            type="number"
            placeholder="30"
            min="0"
            max="100"
            step="0.1"
            value={newWeightValue}
            onChange={(e) => setNewWeightValue(e.target.value)}
            disabled={previewMode}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddWeight();
              }
            }}
          />
        </div>
        <Button onClick={handleAddWeight} disabled={previewMode}>
          {previewMode && <Lock className="mr-2 h-4 w-4" />}
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        💡 Tip: Each assessment type can have multiple grades. For example, you can add multiple
        "Assignments" or "Quizzes" and they'll be averaged together for that category.
      </p>
    </div>
  );
}