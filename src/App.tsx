import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import Dashboard from '@/pages/app/Dashboard';
import Courses from '@/pages/app/Courses';
import CourseDetail from '@/pages/app/CourseDetail';
import Planner from '@/pages/app/Planner';
import Analytics from '@/pages/app/Analytics';
import Transcript from '@/pages/app/Transcript';
import Semesters from '@/pages/app/Semesters';
import Settings from '@/pages/app/Settings';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const { setPreviewMode, theme } = useUIStore();

  useEffect(() => {
    setPreviewMode(!isAuthenticated);
  }, [isAuthenticated, setPreviewMode]);

  // Apply theme on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="planner" element={<Planner />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="transcript" element={<Transcript />} />
        <Route path="semesters" element={<Semesters />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;