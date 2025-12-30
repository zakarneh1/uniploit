import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Courses', href: '/app/courses', icon: BookOpen },
  { name: 'Planner', href: '/app/planner', icon: Calendar },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Transcript', href: '/app/transcript', icon: GraduationCap },
  { name: 'Semesters', href: '/app/semesters', icon: CalendarDays },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card shadow-sm">
      <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <Link to="/app" className="flex items-center gap-2 group">
          <div className="relative">
            <GraduationCap className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">UniPilot</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 border border-primary/20">
          <p className="text-xs font-semibold text-primary mb-1">🎓 Pro Tip</p>
          <p className="text-xs text-muted-foreground">Track your study sessions daily to maintain your streak!</p>
        </div>
      </div>
    </div>
  );
}