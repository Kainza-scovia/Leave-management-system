'use client';

import React, { useMemo } from 'react';
import { useAppContext } from '@/app/providers';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployees, getLeaveRequests, getLeaveBalances } from '@/lib/mock-data';
import { LEAVE_TYPES } from '@/lib/constants';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmployeeDashboard() {
  const { currentUser } = useAppContext();
  const requests = getLeaveRequests();
  const balances = getLeaveBalances();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    if (!currentUser) return { approved: 0, pending: 0, rejected: 0, remaining: 0 };

    const userRequests = requests.filter(
      (r) => r.employeeId === currentUser.id && r.status !== 'CANCELLED'
    );
    const userBalances = balances.filter(
      (b) => b.employeeId === currentUser.id && b.year === currentYear
    );

    return {
      approved: userRequests.filter((r) => r.status === 'APPROVED').length,
      pending: userRequests.filter((r) => r.status === 'PENDING').length,
      rejected: userRequests.filter((r) => r.status === 'REJECTED').length,
      remaining: userBalances.reduce((sum, b) => sum + (b.totalDays - b.usedDays), 0),
    };
  }, [currentUser, requests, balances]);

  const recentRequests = useMemo(() => {
    if (!currentUser) return [];
    return requests
      .filter((r) => r.employeeId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [currentUser, requests]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* Welcome Header */}
            <div className="rounded-xl border border-border bg-secondary p-5 shadow-sm">
              <h1 className="mb-2 text-3xl font-bold text-primary md:text-4xl">
                Welcome back, {currentUser?.name}! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Remaining Leave"
                value={stats.remaining}
                description="Days available this year"
                icon={Calendar}
              />
              <StatsCard
                title="Approved"
                value={stats.approved}
                description="Total approved requests"
                icon={CheckCircle}
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                description="Awaiting approval"
                icon={AlertCircle}
              />
              <StatsCard
                title="Rejected"
                value={stats.rejected}
                description="Total rejected requests"
                icon={XCircle}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link href="/employee/apply-leave">
                <Button className="bg-primary">Apply for Leave</Button>
              </Link>
              <Link href="/employee/leave-history">
                <Button variant="outline">View History</Button>
              </Link>
            </div>

            {/* Recent Requests */}
            <Card className="border-primary/10 shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                <CardTitle className="text-primary">Recent Leave Requests</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentRequests.length > 0 ? (
                    recentRequests.map((request) => {
                      const leaveType = LEAVE_TYPES.find(
                        (lt) => lt.id === request.leaveTypeId
                      );
                      const statusConfig = {
                        PENDING: {
                          bg: 'bg-accent/10',
                          border: 'border-accent/30',
                          badge: 'bg-accent/20 text-accent/80 font-semibold'
                        },
                        APPROVED: {
                          bg: 'bg-secondary/10',
                          border: 'border-secondary/30',
                          badge: 'bg-secondary/20 text-secondary/80 font-semibold'
                        },
                        REJECTED: {
                          bg: 'bg-destructive/10',
                          border: 'border-destructive/30',
                          badge: 'bg-destructive/20 text-destructive/80 font-semibold'
                        },
                        CANCELLED: {
                          bg: 'bg-muted/10',
                          border: 'border-muted/30',
                          badge: 'bg-muted/20 text-muted-foreground font-semibold'
                        },
                      };
                      const config = statusConfig[request.status];

                      return (
                        <div
                          key={request.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${config.bg} ${config.border}`}
                        >
                          <div>
                            <p className="font-semibold text-foreground">{leaveType?.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(request.startDate).toLocaleDateString()} -{' '}
                              {new Date(request.endDate).toLocaleDateString()} 
                              <span className="ml-2 font-medium">({request.numberOfDays} days)</span>
                            </p>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-full text-xs ${config.badge}`}
                          >
                            {request.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No leave requests yet. Start by applying for leave!
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
