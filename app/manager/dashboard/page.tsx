'use client';

import React, { useMemo } from 'react';
import { useAppContext } from '@/app/providers';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployees, getLeaveRequests } from '@/lib/mock-data';
import { LEAVE_TYPES } from '@/lib/constants';
import { Clock, CheckCircle, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ManagerDashboard() {
  const { currentUser } = useAppContext();
  const employees = getEmployees();
  const requests = getLeaveRequests();

  const stats = useMemo(() => {
    if (!currentUser) return { pending: 0, approved: 0, teamCount: 0, onLeave: 0 };

    const teamMembers = employees.filter((e) => e.managerId === currentUser.id);
    const teamRequests = requests.filter(
      (r) => teamMembers.some((tm) => tm.id === r.employeeId)
    );

    return {
      pending: teamRequests.filter((r) => r.status === 'PENDING').length,
      approved: teamRequests.filter((r) => r.status === 'APPROVED').length,
      teamCount: teamMembers.length,
      onLeave: teamMembers.filter((emp) => {
        const today = new Date();
        return teamRequests.some(
          (r) =>
            r.employeeId === emp.id &&
            r.status === 'APPROVED' &&
            new Date(r.startDate) <= today &&
            new Date(r.endDate) >= today
        );
      }).length,
    };
  }, [currentUser, employees, requests]);

  const pendingRequests = useMemo(() => {
    if (!currentUser) return [];
    const teamMembers = employees.filter((e) => e.managerId === currentUser.id);
    return requests
      .filter(
        (r) => r.status === 'PENDING' && teamMembers.some((tm) => tm.id === r.employeeId)
      )
      .slice(0, 5);
  }, [currentUser, employees, requests]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Manager Dashboard</h1>
              <p className="text-muted-foreground">Manage your team's leave requests</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Pending Approvals"
                value={stats.pending}
                description="Awaiting your review"
                icon={AlertCircle}
              />
              <StatsCard
                title="Approved This Month"
                value={stats.approved}
                description="Total approved requests"
                icon={CheckCircle}
              />
              <StatsCard
                title="Team Members"
                value={stats.teamCount}
                description="Total in your team"
                icon={Users}
              />
              <StatsCard
                title="On Leave Today"
                value={stats.onLeave}
                description="Currently on leave"
                icon={Clock}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link href="/manager/approvals">
                <Button className="bg-primary">Review Requests</Button>
              </Link>
              <Link href="/manager/team-leaves">
                <Button variant="outline">Team Calendar</Button>
              </Link>
            </div>

            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => {
                      const leaveType = LEAVE_TYPES.find(
                        (lt) => lt.id === request.leaveTypeId
                      );
                      const employee = employees.find((e) => e.id === request.employeeId);

                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {leaveType?.name} • {request.numberOfDays} days
                            </p>
                          </div>
                          <Link href="/manager/approvals">
                            <Button size="sm" variant="outline">Review</Button>
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      No pending requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
