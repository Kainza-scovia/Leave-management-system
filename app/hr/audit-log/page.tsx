// app/hr/dashboard/page.tsx - KEEP THIS (DON'T CHANGE)
// This is the page with the 3 buttons: Manage Employees, Pending Approvals, View Reports

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/cards/StatsCard";
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function HRDashboard() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeEmployees = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setEmployees(data);
      }
    );

    const unsubscribeRequests = onSnapshot(
      collection(db, "leaveRequests"),
      (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setLeaveRequests(data);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEmployees();
      unsubscribeRequests();
    };
  }, [currentUser]);

  const stats = {
    activeEmployees: employees.filter((e) => e.status !== "INACTIVE").length,
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter((r) => r.status === "pending").length,
    onLeaveToday: leaveRequests.filter((r) => {
      const today = new Date().toISOString().split("T")[0];
      return r.status === "approved" && r.startDate <= today && r.endDate >= today;
    }).length,
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">HR Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage employees, leave requests, and reports
                </p>
              </div>
              <Badge className="text-lg px-4 py-2 bg-primary">
                {stats.activeEmployees} Active Employees
              </Badge>
            </div>

            {/* ✅ YOUR QUICK ACTION BUTTONS - KEEP THESE! */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <Link href="/hr/employees">
                <Button className="w-full bg-primary hover:bg-primary/90 gap-2 h-12 text-base">
                  <Users className="h-5 w-5" />
                  Manage Employees
                  <Badge className="bg-white/20 text-white ml-1">
                    {stats.activeEmployees}
                  </Badge>
                </Button>
              </Link>
              <Link href="/hr/approvals">
                <Button className="w-full gap-2 h-12 text-base" variant="outline">
                  <Clock className="h-5 w-5" />
                  Pending Approvals
                  {stats.pendingRequests > 0 && (
                    <Badge className="bg-red-500 text-white ml-1">
                      {stats.pendingRequests}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/hr/reports">
                <Button className="w-full gap-2 h-12 text-base" variant="outline">
                  <BarChart3 className="h-5 w-5" />
                  View Reports
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                description="Awaiting review"
                icon={AlertCircle}
              />
              <StatsCard
                title="On Leave Today"
                value={stats.onLeaveToday}
                description="Currently absent"
                icon={CheckCircle}
              />
            </div>

            {/* System Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{employees.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{leaveRequests.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {leaveRequests.length > 0
                        ? Math.round(
                            (leaveRequests.filter((r) => r.status === "approved").length /
                              leaveRequests.length) *
                              100
                          )
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-2xl font-bold">
                      {new Set(employees.map((e) => e.department).filter(Boolean)).size}
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