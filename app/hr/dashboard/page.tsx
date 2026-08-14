'use client';

import React, { useMemo } from 'react';
import { useAppContext } from '@/app/providers';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployees, getLeaveRequests } from '@/lib/mock-data';
import { Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HRDashboard() {
  const { currentUser } = useAppContext();
  const employees = getEmployees();
  const requests = getLeaveRequests();

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
    const onLeaveToday = employees.filter((emp) => {
      const today = new Date();
      return requests.some(
        (r) =>
          r.employeeId === emp.id &&
          r.status === 'APPROVED' &&
          new Date(r.startDate) <= today &&
          new Date(r.endDate) >= today
      );
    }).length;

    return {
      activeEmployees,
      totalRequests,
      pendingRequests,
      onLeaveToday,
    };
  }, [employees, requests]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">HR Administration</h1>
              <p className="text-muted-foreground">Manage leave policies and employee records</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Active Employees"
                value={stats.activeEmployees}
                description="Total staff members"
                icon={Users}
              />
              <StatsCard
                title="Total Requests"
                value={stats.totalRequests}
                description="All leave requests"
                icon={FileText}
              />
              <StatsCard
                title="Pending Approval"
                value={stats.pendingRequests}
                description="Awaiting manager approval"
                icon={AlertCircle}
              />
              <StatsCard
                title="On Leave Today"
                value={stats.onLeaveToday}
                description="Currently absent"
                icon={CheckCircle}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/hr/employees">
                <Button className="w-full bg-primary">Manage Employees</Button>
              </Link>
              <Link href="/hr/holidays">
                <Button className="w-full" variant="outline">Manage Holidays</Button>
              </Link>
              <Link href="/hr/reports">
                <Button className="w-full" variant="outline">View Reports</Button>
              </Link>
            </div>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leave Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
