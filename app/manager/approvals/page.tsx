// app/manager/approvals/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  User,
  Mail,
  Briefcase,
  Check,
  X,
  Loader2,
  RefreshCw,
  UserCheck,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// Types
interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeCode?: string;
  department?: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  leaveType: string;
  reason: string;
  status: "pending_hr" | "pending_manager" | "approved" | "rejected" | "hr_rejected";
  createdAt: any;
  comments?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: any;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: any;
  hrApprovedBy?: string;
  hrApprovedByName?: string;
  hrApprovedAt?: any;
}

export default function ManagerApprovalsPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [stats, setStats] = useState({
    pendingManager: 0,
    pendingHr: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    teamSize: 0,
  });
  const itemsPerPage = 5;

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
        const teamIds = employeesSnap.docs.map((doc) => doc.id);
        setStats((prev) => ({ ...prev, teamSize: teamIds.length }));
      } catch (error) {
        console.error("Error fetching team:", error);
      }
    };

    fetchTeam();
  }, [currentUser, isManager]);

  // Real-time listener for requests
  useEffect(() => {
    if (!currentUser || !isManager) return;

    // Listen for requests that are pending manager approval (HR already approved)
    const pendingQuery = query(
      collection(db, "leaveRequests"),
      where("status", "==", "pending_manager"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        const requests: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          requests.push({
            id: doc.id,
            employeeId: data.employeeId,
            employeeName: data.employeeName || data.employeeEmail,
            employeeEmail: data.employeeEmail,
            employeeCode: data.employeeCode || "",
            department: data.department || "",
            startDate: data.startDate,
            endDate: data.endDate,
            daysRequested: data.daysRequested || 0,
            leaveType: data.leaveType,
            reason: data.reason,
            status: data.status,
            createdAt: data.createdAt,
            comments: data.comments || "",
            approvedBy: data.approvedBy,
            approvedByName: data.approvedByName,
            approvedAt: data.approvedAt,
            rejectedBy: data.rejectedBy,
            rejectedByName: data.rejectedByName,
            rejectedAt: data.rejectedAt,
            hrApprovedBy: data.hrApprovedBy,
            hrApprovedByName: data.hrApprovedByName,
            hrApprovedAt: data.hrApprovedAt,
          });
        });
        setPendingRequests(requests);
        setStats((prev) => ({ ...prev, pendingManager: requests.length }));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching pending requests:", error);
        setLoading(false);
      }
    );

    // Listen for all requests for stats
    const allQuery = query(
      collection(db, "leaveRequests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeAll = onSnapshot(
      allQuery,
      (snapshot) => {
        const requests: LeaveRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          requests.push({
            id: doc.id,
            employeeId: data.employeeId,
            employeeName: data.employeeName || data.employeeEmail,
            employeeEmail: data.employeeEmail,
            employeeCode: data.employeeCode || "",
            department: data.department || "",
            startDate: data.startDate,
            endDate: data.endDate,
            daysRequested: data.daysRequested || 0,
            leaveType: data.leaveType,
            reason: data.reason,
            status: data.status,
            createdAt: data.createdAt,
            comments: data.comments || "",
            approvedBy: data.approvedBy,
            approvedByName: data.approvedByName,
            approvedAt: data.approvedAt,
            rejectedBy: data.rejectedBy,
            rejectedByName: data.rejectedByName,
            rejectedAt: data.rejectedAt,
            hrApprovedBy: data.hrApprovedBy,
            hrApprovedByName: data.hrApprovedByName,
            hrApprovedAt: data.hrApprovedAt,
          });
        });
        setAllRequests(requests);
        setStats((prev) => ({
          ...prev,
          total: requests.length,
          pendingHr: requests.filter((r) => r.status === "pending_hr").length,
          approved: requests.filter((r) => r.status === "approved").length,
          rejected: requests.filter((r) => r.status === "rejected" || r.status === "hr_rejected").length,
        }));
      },
      (error) => {
        console.error("Error fetching all requests:", error);
      }
    );

    return () => {
      unsubscribePending();
      unsubscribeAll();
    };
  }, [currentUser, isManager]);

  // Filter and search
  const filteredRequests = useMemo(() => {
    const requests = showAll ? allRequests : pendingRequests;
    let filtered = requests;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(term) ||
          r.employeeEmail.toLowerCase().includes(term) ||
          r.leaveType.toLowerCase().includes(term) ||
          r.reason?.toLowerCase().includes(term) ||
          r.employeeCode?.toLowerCase().includes(term)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.leaveType === filterType);
    }

    return filtered;
  }, [pendingRequests, allRequests, showAll, searchTerm, filterType]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique leave types
  const leaveTypes = useMemo(() => {
    const types = new Set(pendingRequests.map((r) => r.leaveType));
    return ["all", ...Array.from(types)];
  }, [pendingRequests]);

  // Handle manager approve (final approval)
  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;
    setActionLoading(requestId);

    try {
      const request = pendingRequests.find((r) => r.id === requestId);
      if (!request) {
        alert("Request not found");
        setActionLoading(null);
        return;
      }

      // Update request status to fully approved
      await updateDoc(doc(db, "leaveRequests", requestId), {
        status: "approved",
        approvedBy: currentUser.id,
        approvedByEmail: currentUser.email,
        approvedByName: currentUser.name || currentUser.email,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        comments: `Final approval by Manager: ${currentUser.name || currentUser.email}`,
      });

      // Update employee leave balance
      const employeeRef = doc(db, "employees", request.employeeId);
      const employeeSnap = await getDoc(employeeRef);
      if (employeeSnap.exists()) {
        const data = employeeSnap.data();
        const usedLeaveDays = (data.usedLeaveDays || 0) + (request.daysRequested || 0);
        const remainingLeaveDays = (data.totalLeaveDays || 20) - usedLeaveDays;
        await updateDoc(employeeRef, {
          usedLeaveDays,
          remainingLeaveDays,
          updatedAt: serverTimestamp(),
        });
      }

      alert(`✅ Leave request for ${request.employeeName} has been fully approved!`);
      setShowDetails(false);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle manager reject (final reject)
  const handleReject = async (requestId: string) => {
    if (!currentUser) return;

    const reason = prompt("Please provide a reason for rejecting this request:");
    if (reason === null) return;

    setActionLoading(requestId);
    try {
      const request = pendingRequests.find((r) => r.id === requestId);
      if (!request) {
        alert("Request not found");
        setActionLoading(null);
        return;
      }

      await updateDoc(doc(db, "leaveRequests", requestId), {
        status: "rejected",
        rejectedBy: currentUser.id,
        rejectedByEmail: currentUser.email,
        rejectedByName: currentUser.name || currentUser.email,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        comments: `Rejected by Manager: ${reason}`,
      });

      alert(`❌ Leave request for ${request.employeeName} has been rejected.`);
      setShowDetails(false);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setActionLoading(null);
    }
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

  // Format relative time
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
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
                You don't have manager permissions to view approvals.
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
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  Manager Approvals
                </h1>
                <p className="text-muted-foreground">
                  Review and approve leave requests that HR has already approved
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="text-lg px-4 py-2 bg-yellow-500">
                  {stats.pendingManager} Pending Manager
                </Badge>
                <Badge className="text-lg px-4 py-2 bg-blue-400">
                  {stats.pendingHr} Pending HR
                </Badge>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  {showAll ? "Show Pending" : "Show All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.refresh()}
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

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Manager</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingManager}</p>
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
                      <p className="text-2xl font-bold text-blue-600">{stats.pendingHr}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
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
                      <p className="text-sm text-muted-foreground">Team Size</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.teamSize}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee name, email, or leave type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="gap-2"
                >
                  <Filter className="h-3 w-3" />
                  All
                </Button>
                {leaveTypes
                  .filter((type) => type !== "all")
                  .map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                    >
                      {type}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Pending Requests List */}
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {showAll ? "No Requests Found" : "No Pending Requests"}
                  </h3>
                  <p className="text-muted-foreground">
                    {showAll
                      ? "There are no leave requests from your team."
                      : "🎉 All team requests have been reviewed! Nothing pending for you."}
                  </p>
                  <div className="flex justify-center gap-4 mt-4">
                    {(searchTerm || filterType !== "all") && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterType("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    {pendingRequests.length === 0 && !showAll && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/manager/dashboard")}
                      >
                        Return to Dashboard
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paginatedRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Left: Request Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{request.employeeName}</h3>
                            <Badge variant="outline">{request.leaveType}</Badge>
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(request.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
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
                            {request.department && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                {request.department}
                              </div>
                            )}
                            {request.employeeCode && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Code: {request.employeeCode}
                              </div>
                            )}
                          </div>

                          {/* Show HR Approval Status */}
                          {request.hrApprovedByName && (
                            <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                              <p className="text-sm text-green-700 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                HR Approved by: {request.hrApprovedByName}
                                <span className="text-xs text-green-500 ml-2">
                                  ({getRelativeTime(request.hrApprovedAt)})
                                </span>
                              </p>
                            </div>
                          )}

                          {request.reason && (
                            <div className="mt-3 bg-muted p-3 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Reason:</span> {request.reason}
                              </p>
                            </div>
                          )}
                          {request.comments && request.status !== "pending_manager" && request.status !== "pending_hr" && (
                            <div className="mt-2 p-2 rounded-lg bg-muted/50">
                              <p className="text-sm">
                                <span className="font-medium">Comment:</span> {request.comments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right: Action Buttons */}
                        {!showAll && request.status === "pending_manager" ? (
                          <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetails(true);
                              }}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="default"
                              className="bg-green-600 hover:bg-green-700 gap-2"
                              onClick={() => handleApprove(request.id)}
                              disabled={actionLoading === request.id}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              {actionLoading === request.id ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              className="gap-2"
                              onClick={() => handleReject(request.id)}
                              disabled={actionLoading === request.id}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetails(true);
                              }}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{" "}
                      {filteredRequests.length} results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
                onClick={() => setShowDetails(false)}
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
                {selectedRequest.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{selectedRequest.department}</p>
                  </div>
                )}
                {selectedRequest.employeeCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Code</p>
                    <p className="font-semibold">{selectedRequest.employeeCode}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-semibold">{getRelativeTime(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Show HR Approval Status */}
              {selectedRequest.hrApprovedByName && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">HR Approved by:</span>
                    {selectedRequest.hrApprovedByName}
                    <span className="text-xs text-green-500 ml-2">
                      ({getRelativeTime(selectedRequest.hrApprovedAt)})
                    </span>
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <div className="bg-muted p-3 rounded-lg mt-1">
                  <p>{selectedRequest.reason || "No reason provided"}</p>
                </div>
              </div>

              {selectedRequest.comments && selectedRequest.status !== "pending_manager" && selectedRequest.status !== "pending_hr" && (
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <div className="bg-muted/50 p-3 rounded-lg mt-1">
                    <p>{selectedRequest.comments}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending_manager" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    {actionLoading === selectedRequest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {actionLoading === selectedRequest.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    {actionLoading === selectedRequest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
              )}

              {selectedRequest.status !== "pending_manager" && (
                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowDetails(false)} className="w-full">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}