// app/hr/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/cards/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  TrendingUp,
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
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

export default function HRDashboard() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch employees
        const employeesSnap = await getDocs(collection(db, "employees"));
        const employeesData: Employee[] = [];
        employeesSnap.forEach((doc) => {
          employeesData.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(employeesData);

        // Fetch leave requests
        const requestsSnap = await getDocs(collection(db, "leaveRequests"));
        const requestsData: LeaveRequest[] = [];
        requestsSnap.forEach((doc) => {
          const data = doc.data();
          requestsData.push({
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
          });
        });
        setLeaveRequests(requestsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time listener for leave requests
    const unsubscribe = onSnapshot(
      collection(db, "leaveRequests"),
      (snapshot) => {
        const requestsData: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          requestsData.push({
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
          });
        });
        setLeaveRequests(requestsData);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeEmployees = isClient 
      ? employees.filter((e) => e.status !== "INACTIVE").length 
      : 0;
    
    const totalRequests = isClient ? leaveRequests.length : 0;
    const pendingRequests = isClient 
      ? leaveRequests.filter((r) => r.status === "pending").length 
      : 0;
    
    const onLeaveToday = isClient 
      ? employees.filter((emp) => {
          const today = new Date().toISOString().split("T")[0];
          return leaveRequests.some(
            (r) =>
              r.employeeId === emp.id &&
              r.status === "approved" &&
              r.startDate <= today &&
              r.endDate >= today
          );
        }).length
      : 0;

    // Additional stats
    const approvedRequests = isClient 
      ? leaveRequests.filter((r) => r.status === "approved").length 
      : 0;
    
    const rejectedRequests = isClient 
      ? leaveRequests.filter((r) => r.status === "rejected").length 
      : 0;

    const departments = isClient 
      ? new Set(employees.map((e) => e.department).filter(Boolean)).size 
      : 0;

    return {
      activeEmployees,
      totalRequests,
      pendingRequests,
      onLeaveToday,
      approvedRequests,
      rejectedRequests,
      departments,
      totalEmployees: employees.length,
    };
  }, [employees, leaveRequests, isClient]);

  // Recent requests (last 5)
  const recentRequests = isClient 
    ? leaveRequests.slice(0, 5) 
    : [];

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
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Navigation helper
  const navigateTo = (path: string) => {
    router.push(path);
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
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">HR Administration</h1>
              <p className="text-muted-foreground">
                Manage leave policies and employee records
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Active Employees"
                value={isClient ? stats.activeEmployees : "..."}
                description="Total staff members"
                icon={Users}
              />
              <StatsCard
                title="Total Requests"
                value={isClient ? stats.totalRequests : "..."}
                description="All leave requests"
                icon={FileText}
              />
              <StatsCard
                title="Pending Approval"
                value={isClient ? stats.pendingRequests : "..."}
                description="Awaiting manager approval"
                icon={AlertCircle}
              />
              <StatsCard
                title="On Leave Today"
                value={isClient ? stats.onLeaveToday : "..."}
                description="Currently absent"
                icon={CheckCircle}
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold text-green-600" suppressHydrationWarning>
                        {isClient ? stats.approvedRequests : "..."}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600" suppressHydrationWarning>
                        {isClient ? stats.rejectedRequests : "..."}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Departments</p>
                      <p className="text-2xl font-bold text-purple-600" suppressHydrationWarning>
                        {isClient ? stats.departments : "..."}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                className="w-full bg-primary gap-2"
                onClick={() => navigateTo("/hr/employees")}
              >
                <Users className="h-4 w-4" />
                Manage Employees
              </Button>
              <Button 
                className="w-full gap-2"
                variant="outline"
                onClick={() => navigateTo("/hr/approvals")}
              >
                <Clock className="h-4 w-4" />
                Pending Approvals
                {stats.pendingRequests > 0 && (
                  <Badge className="bg-red-500 text-white ml-1">
                    {stats.pendingRequests}
                  </Badge>
                )}
              </Button>
              <Button 
                className="w-full gap-2"
                variant="outline"
                onClick={() => navigateTo("/hr/reports")}
              >
                <FileText className="h-4 w-4" />
                View Reports
              </Button>
            </div>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Leave Requests</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateTo("/hr/approvals")}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isClient ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No leave requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigateTo("/hr/approvals")}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{request.employeeName}</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.leaveType} • {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            <span className="ml-2">
                              ({request.daysRequested} days)
                            </span>
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo("/hr/approvals");
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold" suppressHydrationWarning>
                    {isClient ? stats.totalEmployees : "..."}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leave Requests</p>
                  <p className="text-2xl font-bold" suppressHydrationWarning>
                    {isClient ? stats.totalRequests : "..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}