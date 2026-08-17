// app/manager/dashboard/page.tsx
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
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/cards/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Users,
  AlertCircle,
  Calendar,
  UserCheck,
  FileText,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// Types
interface Employee {
  id: string;
  name: string;
  email: string;
  employeeCode?: string;
  department?: string;
  role?: string;
  managerId?: string;
  status?: string;
  totalLeaveDays?: number;
  usedLeaveDays?: number;
  remainingLeaveDays?: number;
}

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
  status: "pending_hr" | "pending_manager" | "approved" | "rejected" | "hr_rejected";
  createdAt: any;
  comments?: string;
  hrApprovedBy?: string;
  hrApprovedByName?: string;
  hrApprovedAt?: any;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: any;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user has Manager access
  const isManager = currentUser?.role === "manager" || currentUser?.role === "MANAGER";

  // Fetch team members (employees under this manager)
  useEffect(() => {
    if (!currentUser || !isManager) return;

    // Get all employees where managerId matches current user
    const fetchTeam = async () => {
      try {
        const employeesSnap = await getDocs(
          query(collection(db, "employees"), where("managerId", "==", currentUser.id))
        );
        const team: Employee[] = [];
        employeesSnap.forEach((doc) => {
          team.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setTeamMembers(team);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team:", error);
        setLoading(false);
      }
    };

    fetchTeam();

    // Real-time listener for team members
    const unsubscribe = onSnapshot(
      query(collection(db, "employees"), where("managerId", "==", currentUser.id)),
      (snapshot) => {
        const team: Employee[] = [];
        snapshot.forEach((doc) => {
          team.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setTeamMembers(team);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isManager]);

  // Fetch all leave requests (real-time)
  useEffect(() => {
    if (!currentUser || !isManager) return;

    const unsubscribe = onSnapshot(
      query(collection(db, "leaveRequests"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const requests: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
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
            comments: data.comments || "",
            hrApprovedBy: data.hrApprovedBy,
            hrApprovedByName: data.hrApprovedByName,
            hrApprovedAt: data.hrApprovedAt,
            approvedBy: data.approvedBy,
            approvedByName: data.approvedByName,
            approvedAt: data.approvedAt,
          });
        });
        setLeaveRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching leave requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isManager]);

  // Calculate stats - only for team members
  const stats = useMemo(() => {
    if (!currentUser || teamMembers.length === 0) {
      return { pending: 0, approved: 0, teamCount: 0, onLeave: 0, pendingManager: 0, pendingHr: 0 };
    }

    const teamIds = new Set(teamMembers.map((m) => m.id));
    const teamRequests = leaveRequests.filter((r) => teamIds.has(r.employeeId));

    const pendingManager = teamRequests.filter((r) => r.status === "pending_manager").length;
    const pendingHr = teamRequests.filter((r) => r.status === "pending_hr").length;
    const approved = teamRequests.filter((r) => r.status === "approved").length;
    const rejected = teamRequests.filter((r) => r.status === "rejected" || r.status === "hr_rejected").length;

    // Count team members on leave today
    const today = new Date().toISOString().split("T")[0];
    const onLeave = teamMembers.filter((emp) =>
      teamRequests.some(
        (r) =>
          r.employeeId === emp.id &&
          r.status === "approved" &&
          r.startDate <= today &&
          r.endDate >= today
      )
    ).length;

    return {
      pending: pendingManager + pendingHr,
      pendingManager,
      pendingHr,
      approved,
      rejected,
      teamCount: teamMembers.length,
      onLeave,
      totalRequests: teamRequests.length,
    };
  }, [teamMembers, leaveRequests, currentUser]);

  // Get pending requests for the team (for the list)
  const pendingRequests = useMemo(() => {
    if (!currentUser || teamMembers.length === 0) return [];

    const teamIds = new Set(teamMembers.map((m) => m.id));
    return leaveRequests
      .filter(
        (r) =>
          (r.status === "pending_manager" || r.status === "pending_hr") &&
          teamIds.has(r.employeeId)
      )
      .slice(0, 5);
  }, [teamMembers, leaveRequests, currentUser]);

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">✅ Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">❌ Rejected</Badge>;
      case "hr_rejected":
        return <Badge className="bg-red-400 hover:bg-red-500">⛔ HR Rejected</Badge>;
      case "pending_manager":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏳ Pending Manager</Badge>;
      case "pending_hr":
        return <Badge className="bg-blue-400 hover:bg-blue-500">⏳ Pending HR</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  if (!isManager) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have manager permissions to view this dashboard.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Manager Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your team's leave requests and approvals
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Pending Approvals"
                value={isClient ? stats.pending : "..."}
                description="Awaiting your review"
                icon={AlertCircle}
              />
              <StatsCard
                title="Approved"
                value={isClient ? stats.approved : "..."}
                description="Total approved requests"
                icon={CheckCircle}
              />
              <StatsCard
                title="Team Members"
                value={isClient ? stats.teamCount : "..."}
                description="Total in your team"
                icon={Users}
              />
              <StatsCard
                title="On Leave Today"
                value={isClient ? stats.onLeave : "..."}
                description="Currently on leave"
                icon={Clock}
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Manager</p>
                      <p className="text-2xl font-bold text-yellow-600" suppressHydrationWarning>
                        {isClient ? stats.pendingManager : "..."}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending HR</p>
                      <p className="text-2xl font-bold text-blue-600" suppressHydrationWarning>
                        {isClient ? stats.pendingHr : "..."}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold text-purple-600" suppressHydrationWarning>
                        {isClient ? stats.totalRequests : "..."}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/manager/approvals">
                <Button className="bg-primary gap-2">
                  <Clock className="h-4 w-4" />
                  Review Requests
                  {stats.pendingManager > 0 && (
                    <Badge className="bg-red-500 text-white ml-1">
                      {stats.pendingManager}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/manager/team-leaves">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Team Calendar
                </Button>
              </Link>
              <Link href="/manager/reports">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </div>

            {/* Pending Requests List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Leave Requests</span>
                  <Link href="/manager/approvals">
                    <Button variant="outline" size="sm" className="gap-2">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!isClient ? (
                    <p className="text-muted-foreground text-center py-6">Loading...</p>
                  ) : pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => {
                      const employee = teamMembers.find((e) => e.id === request.employeeId);
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{request.employeeName}</p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.leaveType} • {request.daysRequested} days
                              <span className="ml-2">
                                {formatDate(request.startDate)} - {formatDate(request.endDate)}
                              </span>
                            </p>
                            {request.hrApprovedByName && (
                              <p className="text-xs text-green-600">
                                ✅ HR Approved by: {request.hrApprovedByName}
                              </p>
                            )}
                          </div>
                          <Link href="/manager/approvals">
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="text-muted-foreground">🎉 No pending requests from your team!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Team Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold" suppressHydrationWarning>
                      {isClient ? teamMembers.length : "..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-2xl font-bold" suppressHydrationWarning>
                      {isClient ? new Set(teamMembers.map((e) => e.department).filter(Boolean)).size : "..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600" suppressHydrationWarning>
                      {isClient ? stats.pending : "..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Requests</p>
                    <p className="text-2xl font-bold text-green-600" suppressHydrationWarning>
                      {isClient ? stats.approved : "..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}