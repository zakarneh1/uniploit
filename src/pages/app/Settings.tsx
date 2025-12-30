import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Lock, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const user = useWorkspaceStore((state) => state.getUser());
  const updateUser = useWorkspaceStore((state) => state.updateUser);
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);
  const { logout } = useAuthStore();
  const { theme, setTheme, previewMode } = useUIStore();
  const navigate = useNavigate();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [semesterStart, setSemesterStart] = useState(user?.semesterStart || '');
  const [semesterEnd, setSemesterEnd] = useState(user?.semesterEnd || '');

  const handleSaveSemester = () => {
    if (previewMode) return;
    updateUser({
      semesterStart,
      semesterEnd,
    });
    toast.success('Semester dates updated');
  };

  const handleGPAScaleChange = (scale: string) => {
    if (previewMode) return;
    updateUser({
      gpaScale: parseFloat(scale) as 4.0 | 4.3,
    });
    toast.success('GPA scale updated');
  };

  const handleResetWorkspace = () => {
    if (previewMode) return;
    resetWorkspace();
    setResetDialogOpen(false);
    toast.success('Workspace reset successfully');
    navigate('/app');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Semester Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Semester Dates</CardTitle>
          <CardDescription>Set your current semester start and end dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semesterStart">Semester Start</Label>
              <Input
                id="semesterStart"
                type="date"
                value={semesterStart}
                onChange={(e) => setSemesterStart(e.target.value)}
                disabled={previewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semesterEnd">Semester End</Label>
              <Input
                id="semesterEnd"
                type="date"
                value={semesterEnd}
                onChange={(e) => setSemesterEnd(e.target.value)}
                disabled={previewMode}
              />
            </div>
          </div>
          <Button onClick={handleSaveSemester} disabled={previewMode}>
            {previewMode && <Lock className="mr-2 h-4 w-4" />}
            Save Dates
          </Button>
        </CardContent>
      </Card>

      {/* GPA Scale */}
      <Card>
        <CardHeader>
          <CardTitle>GPA Scale</CardTitle>
          <CardDescription>Choose your institution's GPA scale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>GPA Scale</Label>
            <Select
              value={user?.gpaScale?.toString() || '4.0'}
              onValueChange={handleGPAScaleChange}
              disabled={previewMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.0">4.0 Scale (A = 4.0)</SelectItem>
                <SelectItem value="4.3">4.3 Scale (A+ = 4.3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Current scale: {user?.gpaScale || 4.0} - This affects how letter grades are converted
            to grade points
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how UniPilot looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset Workspace</p>
              <p className="text-sm text-muted-foreground">
                Delete all courses, grades, and study sessions
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
              disabled={previewMode}
            >
              {previewMode && <Lock className="mr-2 h-4 w-4" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your courses, grades,
              and study sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetWorkspace} className="bg-destructive">
              Reset Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}