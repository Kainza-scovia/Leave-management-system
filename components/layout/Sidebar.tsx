// components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/app/providers';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  LayoutDashboard,
  FileText,
  Clock,
  User,
  ClipboardList,
  Calendar,
  BarChart3,
  Users,
  Settings,
  LogOut,
  AlertCircle,
} from 'lucide-react';

type Route = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ROLE_ROUTES: Record<string, Route[]> = {
  EMPLOYEE: [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/apply-leave', label: 'Apply Leave', icon: FileText },
    { href: '/employee/leave-history', label: 'Leave History', icon: Clock },
    { href: '/employee/profile', label: 'Profile', icon: User },
  ],
  MANAGER: [
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/approvals', label: 'Approvals', icon: ClipboardList },
    { href: '/manager/team-leaves', label: 'Team Leaves', icon: Calendar },
    { href: '/manager/reports', label: 'Reports', icon: BarChart3 },
  ],
  HR_ADMIN: [
    { href: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/hr/employees', label: 'Employees', icon: Users },
    { href: '/hr/policies', label: 'Policies', icon: Settings },
    { href: '/hr/holidays', label: 'Holidays', icon: Calendar },
    { href: '/hr/reports', label: 'Reports', icon: BarChart3 },
    { href: '/hr/audit-log', label: 'Audit Log', icon: AlertCircle },
  ],
};

const DEFAULT_ROUTES: Route[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

// ✅ MAKE SURE THIS IS EXPORTED PROPERLY
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppContext();

  if (!currentUser) return null;

  const userRole = currentUser.role || 'EMPLOYEE';
  const routes = ROLE_ROUTES[userRole] || DEFAULT_ROUTES;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null as any);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 bg-sidebar shadow-lg md:flex md:flex-col">
      {/* Sidebar Header - Logo Area */}
      <div className="px-6 py-8 border-b border-primary-foreground/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-primary">
            L
          </div>
          <div>
            <h1 className="font-bold text-primary-foreground text-sm">Leave Manager</h1>
            <p className="text-xs text-primary-foreground/70">HR System</p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href;

          return (
            <Link
              key={route.href}
              href={route.href}
              prefetch={true}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-primary shadow-md'
                  : 'text-primary-foreground hover:bg-primary-foreground/10'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer - Sticky Bottom with Logout */}
      <div className="px-4 py-4 border-t border-primary-foreground/10 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

// ✅ ALSO ADD THIS - Default export as fallback
export default Sidebar;