// app/employee/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/cards/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Types
interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  leaveType: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  approvedBy?: string;
  approvedAt?: any;
  rejectedBy?: string;
  rejectedAt?: any;
  comments?: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingDays, setRemainingDays] = useState(20);

  // Fetch leave requests from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchLeaveRequests = async () => {
      try {
        // Get user data for remaining days
        const userDoc = await getDoc(doc(db, "employees", currentUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRemainingDays(data.remainingLeaveDays || 20);
        }

        // ✅ SIMPLE QUERY - NO orderBy (no index needed!)
        const q = query(
          collection(db, "leaveRequests"),
          where("employeeId", "==", currentUser.id)
        );

        const querySnapshot = await getDocs(q);
        const requests: LeaveRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          requests.push({
            id: doc.id,
            employeeId: data.employeeId,
            employeeName: data.employeeName || data.employeeEmail,
            employeeEmail: data.employeeEmail,
            startDate: data.startDate,
            endDate: data.endDate,
            daysRequested: data.daysRequested || 0,
            leaveType: data.leaveType,
            reason: data.reason,
            status: data.status,
            createdAt: data.createdAt,
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt,
            rejectedBy: data.rejectedBy,
            rejectedAt: data.rejectedAt,
            comments: data.comments,
          });
        });

        // Sort on client side (newest first)
        requests.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });

        setLeaveRequests(requests);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [currentUser]);

  // Listen for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    // ✅ SIMPLE QUERY - NO orderBy (no index needed!)
    const q = query(
      collection(db, "leaveRequests"),
      where("employeeId", "==", currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests: LeaveRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName || data.employeeEmail,
          employeeEmail: data.employeeEmail,
          startDate: data.startDate,
          endDate: data.endDate,
          daysRequested: data.daysRequested || 0,
          leaveType: data.leaveType,
          reason: data.reason,
          status: data.status,
          createdAt: data.createdAt,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          rejectedBy: data.rejectedBy,
          rejectedAt: data.rejectedAt,
          comments: data.comments,
        });
      });

      // Sort on client side (newest first)
      requests.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setLeaveRequests(requests);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!currentUser || leaveRequests.length === 0) {
      return { approved: 0, pending: 0, rejected: 0, remaining: remainingDays };
    }

    const approved = leaveRequests.filter((r) => r.status === "approved").length;
    const pending = leaveRequests.filter((r) => r.status === "pending").length;
    const rejected = leaveRequests.filter((r) => r.status === "rejected").length;

    return {
      approved,
      pending,
      rejected,
      remaining: remainingDays,
    };
  }, [leaveRequests, remainingDays, currentUser]);

  // Get recent requests (last 5)
  const recentRequests = useMemo(() => {
    if (!currentUser || leaveRequests.length === 0) return [];
    return leaveRequests.slice(0, 5);
  }, [leaveRequests, currentUser]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "rejected":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push("/login");
    return null;
  }

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
                Welcome back, {currentUser?.name || currentUser?.email}! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {currentUser?.department && (
                <p className="text-sm text-muted-foreground mt-2">
                  Department: {currentUser.department}
                </p>
              )}
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
            <div className="flex flex-wrap gap-3">
              <Link href="/employee/apply-leave">
                <Button className="bg-primary hover:bg-primary/90">
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply for Leave
                </Button>
              </Link>
              <Link href="/employee/leave-history">
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </Link>
            </div>

            {/* Recent Requests */}
            <Card className="border-primary/10 shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                <CardTitle className="text-primary flex items-center justify-between">
                  <span>Recent Leave Requests</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {leaveRequests.length} total
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentRequests.length > 0 ? (
                    recentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md"
                      >
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {request.leaveType}
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(
                                request.status
                              )}`}
                            >
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            <span className="ml-2 font-medium">
                              ({request.daysRequested || 0} days)
                            </span>
                          </p>
                          {request.reason && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {request.reason}
                            </p>
                          )}
                          {request.status === "approved" && request.comments && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              ✅ {request.comments}
                            </p>
                          )}
                          {request.status === "rejected" && request.comments && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              ❌ {request.comments}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No leave requests yet.
                      </p>
                      <Link href="/employee/apply-leave">
                        <Button variant="link" className="mt-2">
                          Apply for your first leave!
                        </Button>
                      </Link>
                    </div>
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