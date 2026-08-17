// app/manager/team-leaves/page.tsx
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
  doc,
  getDoc,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  Mail,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  CalendarDays,
  Loader2,
  RefreshCw,
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
  hrApprovedByName?: string;
  approvedByName?: string;
  updatedAt?: any;  // ✅ Added optional updatedAt
}

export default function TeamLeavesPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user has Manager access
  const isManager = currentUser?.role === "manager" || currentUser?.role === "MANAGER";

  // Fetch team members
  useEffect(() => {
    if (!currentUser || !isManager) return;

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

  // Fetch leave requests
  useEffect(() => {
    if (!currentUser || !isManager) return;

    const unsubscribe = onSnapshot(
      query(collection(db, "leaveRequests"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const requests: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include requests from team members
          if (teamMembers.some((m) => m.id === data.employeeId)) {
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
              hrApprovedByName: data.hrApprovedByName,
              approvedByName: data.approvedByName,
              updatedAt: data.updatedAt,  // ✅ Added updatedAt
            });
          }
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
  }, [currentUser, isManager, teamMembers]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests;

    if (selectedEmployee !== "all") {
      filtered = filtered.filter((r) => r.employeeId === selectedEmployee);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }

    return filtered;
  }, [leaveRequests, selectedEmployee, selectedStatus]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Get leaves for a specific day
  const getLeavesForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return filteredRequests.filter((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const checkDate = new Date(dateStr);
      return start <= checkDate && end >= checkDate;
    });
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

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

  // Get status color for calendar
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
      case "hr_rejected":
        return "bg-red-500";
      case "pending_manager":
        return "bg-yellow-500";
      case "pending_hr":
        return "bg-blue-400";
      default:
        return "bg-gray-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
      case "hr_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending_manager":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "pending_hr":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  // Get relative time
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date.toISOString());
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
              <Calendar className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have manager permissions to view team leaves.
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
                  <CalendarDays className="h-8 w-8 text-primary" />
                  Team Leaves
                </h1>
                <p className="text-muted-foreground">
                  View your team's leave calendar and requests
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.refresh();
                  }}
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/manager/dashboard")}
                >
                  Back
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Team Members</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="pending_manager">Pending Manager</option>
                  <option value="pending_hr">Pending HR</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {(selectedEmployee !== "all" || selectedStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee("all");
                    setSelectedStatus("all");
                  }}
                  className="gap-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold">{getMonthName(currentMonth)}</span>
                      <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={goToToday}>
                        Today
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span>Approved</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span>Rejected</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({
                      length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
                    }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-24 border rounded-lg bg-muted/20" />
                    ))}
                    {Array.from({
                      length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
                    }).map((_, i) => {
                      const day = i + 1;
                      const dayLeaves = getLeavesForDay(day);
                      const isToday =
                        new Date().getDate() === day &&
                        new Date().getMonth() === currentMonth.getMonth() &&
                        new Date().getFullYear() === currentMonth.getFullYear();

                      return (
                        <div
                          key={day}
                          className={`h-24 border rounded-lg p-1 hover:shadow-md transition-shadow ${
                            isToday ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <div className="text-right text-sm font-medium p-1">{day}</div>
                          <div className="space-y-0.5 overflow-y-auto max-h-16">
                            {dayLeaves.map((leave) => (
                              <div
                                key={leave.id}
                                className={`text-xs p-1 rounded truncate cursor-pointer ${getStatusColor(
                                  leave.status
                                )} text-white hover:opacity-80`}
                                onClick={() => {
                                  setSelectedRequest(leave);
                                  setShowDetails(true);
                                }}
                              >
                                {leave.employeeName} ({leave.leaveType})
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Team Leave Requests</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredRequests.length} requests
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
                      <p className="text-muted-foreground">
                        {leaveRequests.length === 0
                          ? "Your team has no leave requests yet."
                          : "No requests match your filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRequests.map((request) => {
                        const employee = teamMembers.find((e) => e.id === request.employeeId);
                        return (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{request.employeeName}</p>
                                <Badge variant="outline">{request.leaveType}</Badge>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(request.startDate)} → {formatDate(request.endDate)}
                                  <span className="ml-1 font-medium">
                                    ({request.daysRequested} days)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {request.employeeEmail}
                                </div>
                                {request.hrApprovedByName && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    HR: {request.hrApprovedByName}
                                  </div>
                                )}
                                {request.approvedByName && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Manager: {request.approvedByName}
                                  </div>
                                )}
                              </div>
                              {request.reason && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                  Reason: {request.reason}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setShowDetails(true);
                              }}
                              className="ml-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Leave Request Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedRequest(null);
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-semibold">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedRequest.employeeEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leave Type</p>
                  <p className="font-semibold">{selectedRequest.leaveType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{formatDate(selectedRequest.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">{formatDate(selectedRequest.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Requested</p>
                  <p className="font-semibold">{selectedRequest.daysRequested} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-semibold">
                    {selectedRequest.createdAt
                      ? formatDate(
                          selectedRequest.createdAt.toDate
                            ? selectedRequest.createdAt.toDate().toISOString()
                            : selectedRequest.createdAt
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    <p>{selectedRequest.reason}</p>
                  </div>
                </div>
              )}

              {selectedRequest.hrApprovedByName && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    HR Approved by: {selectedRequest.hrApprovedByName}
                  </p>
                </div>
              )}

              {selectedRequest.approvedByName && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Manager Approved by: {selectedRequest.approvedByName}
                  </p>
                </div>
              )}

              {selectedRequest.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    <p>{selectedRequest.comments}</p>
                  </div>
                </div>
              )}

              {selectedRequest.updatedAt && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {getRelativeTime(selectedRequest.updatedAt)}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedRequest(null);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}