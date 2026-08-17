// app/hr/reports/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
} from "lucide-react";

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

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeCode?: string;
  department?: string;
  role?: string;
  status?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ NAVIGATION IN useEffect - FIXES THE ERROR!
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, isLoading, router]);

  // Fetch employees
  useEffect(() => {
    if (!currentUser) return;

    const fetchEmployees = async () => {
      try {
        const employeesSnap = await getDocs(collection(db, "employees"));
        const employeesData: Employee[] = [];
        employeesSnap.forEach((doc) => {
          employeesData.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();

    const unsubscribe = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const employeesData: Employee[] = [];
        snapshot.forEach((doc) => {
          employeesData.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(employeesData);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch leave requests
  useEffect(() => {
    if (!currentUser) return;

    const fetchRequests = async () => {
      try {
        const requestsSnap = await getDocs(
          query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"))
        );
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
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt,
            rejectedBy: data.rejectedBy,
            rejectedAt: data.rejectedAt,
            comments: data.comments,
          });
        });
        setLeaveRequests(requestsData);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

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
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt,
            rejectedBy: data.rejectedBy,
            rejectedAt: data.rejectedAt,
            comments: data.comments,
          });
        });
        setLeaveRequests(requestsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests;

    if (year) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.startDate);
        return date.getFullYear() === year;
      });
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.leaveType === filterType);
    }

    if (selectedEmployee !== "all") {
      filtered = filtered.filter((r) => r.employeeId === selectedEmployee);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(term) ||
          r.employeeEmail.toLowerCase().includes(term) ||
          r.leaveType.toLowerCase().includes(term) ||
          r.reason?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [leaveRequests, year, filterStatus, filterType, selectedEmployee, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const approved = filteredRequests.filter((r) => r.status === "approved").length;
    const pending = filteredRequests.filter((r) => r.status === "pending").length;
    const rejected = filteredRequests.filter((r) => r.status === "rejected").length;
    const totalDays = filteredRequests.reduce((sum, r) => sum + (r.daysRequested || 0), 0);
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const typeBreakdown: Record<string, number> = {};
    filteredRequests.forEach((r) => {
      typeBreakdown[r.leaveType] = (typeBreakdown[r.leaveType] || 0) + 1;
    });

    const topEmployees: Record<string, { name: string; count: number }> = {};
    filteredRequests.forEach((r) => {
      if (!topEmployees[r.employeeId]) {
        topEmployees[r.employeeId] = { name: r.employeeName, count: 0 };
      }
      topEmployees[r.employeeId].count++;
    });

    const sortedTopEmployees = Object.entries(topEmployees)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    const monthlyBreakdown: Record<string, { approved: number; pending: number; rejected: number }> = {};
    filteredRequests.forEach((r) => {
      const month = new Date(r.startDate).toLocaleString("en-US", { month: "short" });
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { approved: 0, pending: 0, rejected: 0 };
      }
      monthlyBreakdown[month][r.status as keyof typeof monthlyBreakdown[string]]++;
    });

    return {
      total,
      approved,
      pending,
      rejected,
      totalDays,
      approvalRate,
      typeBreakdown,
      topEmployees: sortedTopEmployees,
      monthlyBreakdown,
    };
  }, [filteredRequests]);

  // Get unique leave types
  const leaveTypes = useMemo(() => {
    const types = new Set(leaveRequests.map((r) => r.leaveType).filter(Boolean));
    return ["all", ...Array.from(types)];
  }, [leaveRequests]);

  // Get unique employees for filter
  const employeeOptions = useMemo(() => {
    const unique = new Map();
    leaveRequests.forEach((r) => {
      if (!unique.has(r.employeeId)) {
        unique.set(r.employeeId, { id: r.employeeId, name: r.employeeName });
      }
    });
    return [{ id: "all", name: "All Employees" }, ...Array.from(unique.values())];
  }, [leaveRequests]);

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Employee", "Email", "Leave Type", "Start Date", "End Date", "Days", "Status", "Reason"];
    const rows = filteredRequests.map((r) => [
      r.employeeName,
      r.employeeEmail,
      r.leaveType,
      formatDate(r.startDate),
      formatDate(r.endDate),
      r.daysRequested,
      r.status,
      r.reason || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-report-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Check if user has HR access
  const isHRAccess = currentUser?.role === "hr_admin" || currentUser?.role === "HR_ADMIN";

  // ✅ Check loading state
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

  // ✅ If no currentUser, return null (useEffect handles redirect)
  if (!currentUser) {
    return null;
  }

  if (!isHRAccess) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to view reports.
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
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  Reports & Analytics
                </h1>
                <p className="text-muted-foreground">
                  View leave statistics and generate reports
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={exportToCSV}
                  disabled={filteredRequests.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/hr/dashboard")}
                >
                  Back
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
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
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
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
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approval Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.approvalRate}%</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee, type, or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg bg-background"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="all">All Types</option>
                    {leaveTypes.filter(t => t !== "all").map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="all">All Employees</option>
                    {employeeOptions.filter(e => e.id !== "all").map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  {(searchTerm || filterStatus !== "all" || filterType !== "all" || selectedEmployee !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                        setFilterType("all");
                        setSelectedEmployee("all");
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Request List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leave Requests</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredRequests.length} requests
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterStatus !== "all" || filterType !== "all" || selectedEmployee !== "all"
                        ? "Try adjusting your filters"
                        : "No leave requests for the selected period"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Employee</th>
                          <th className="px-4 py-3 text-left font-medium">Type</th>
                          <th className="px-4 py-3 text-left font-medium">Start</th>
                          <th className="px-4 py-3 text-left font-medium">End</th>
                          <th className="px-4 py-3 text-left font-medium">Days</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.slice(0, 20).map((request, index) => (
                          <tr
                            key={request.id}
                            className={`border-t hover:bg-muted/50 ${
                              index % 2 === 0 ? "bg-background" : "bg-muted/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{request.employeeName}</p>
                                <p className="text-xs text-muted-foreground">{request.employeeEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">{request.leaveType}</td>
                            <td className="px-4 py-3">{formatDate(request.startDate)}</td>
                            <td className="px-4 py-3">{formatDate(request.endDate)}</td>
                            <td className="px-4 py-3">{request.daysRequested}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                {getStatusBadge(request.status)}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[150px] truncate" title={request.reason}>
                              {request.reason || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRequests.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing first 20 results. Use filters to narrow down.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Leave Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Leave Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(stats.typeBreakdown).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(stats.typeBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm">{type}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${(count / stats.total) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Employees */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Top Requesting Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topEmployees.map(([id, data]) => (
                        <div key={id} className="flex items-center justify-between">
                          <span className="text-sm">{data.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{
                                  width: `${(data.count / (stats.topEmployees[0]?.[1]?.count || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">{data.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}