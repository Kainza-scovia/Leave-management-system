// app/employee/leave-history/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

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

export default function LeaveHistoryPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Real-time listener for leave requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("employeeId", "==", currentUser.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
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
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching leave requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    if (filterStatus === "all") return leaveRequests;
    return leaveRequests.filter((r) => r.status === filterStatus);
  }, [leaveRequests, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, currentPage, itemsPerPage]);

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

  // Get filter count
  const getFilterCount = (status: string) => {
    if (status === "all") return leaveRequests.length;
    return leaveRequests.filter((r) => r.status === status).length;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const approved = leaveRequests.filter((r) => r.status === "approved").length;
    const pending = leaveRequests.filter((r) => r.status === "pending").length;
    const rejected = leaveRequests.filter((r) => r.status === "rejected").length;
    return { total, approved, pending, rejected };
  }, [leaveRequests]);

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
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Leave History</h1>
                <p className="text-muted-foreground">
                  View all your leave requests and their status
                </p>
              </div>
              <Link href="/employee/apply-leave">
                <Button className="bg-primary hover:bg-primary/90">
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply for Leave
                </Button>
              </Link>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approved</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                All ({getFilterCount("all")})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
                className="gap-2 bg-yellow-500/10 hover:bg-yellow-500/20"
              >
                <Clock className="h-3 w-3" />
                Pending ({getFilterCount("pending")})
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("approved")}
                className="gap-2 bg-green-500/10 hover:bg-green-500/20"
              >
                <CheckCircle className="h-3 w-3" />
                Approved ({getFilterCount("approved")})
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("rejected")}
                className="gap-2 bg-red-500/10 hover:bg-red-500/20"
              >
                <XCircle className="h-3 w-3" />
                Rejected ({getFilterCount("rejected")})
              </Button>
            </div>

            {/* Leave History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Leave Requests</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
                    <p className="text-muted-foreground mb-4">
                      {filterStatus === "all"
                        ? "You haven't submitted any leave requests yet."
                        : `You don't have any ${filterStatus} requests.`}
                    </p>
                    <Link href="/employee/apply-leave">
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Apply for Leave
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* ✅ SIMPLE HTML TABLE - No shadcn table dependency */}
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Leave Type</th>
                            <th className="px-4 py-3 text-left font-medium">Start Date</th>
                            <th className="px-4 py-3 text-left font-medium">End Date</th>
                            <th className="px-4 py-3 text-left font-medium">Days</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRequests.map((request, index) => (
                            <tr 
                              key={request.id} 
                              className={`border-t hover:bg-muted/50 ${
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                              }`}
                            >
                              <td className="px-4 py-3 font-medium">{request.leaveType}</td>
                              <td className="px-4 py-3">{formatDate(request.startDate)}</td>
                              <td className="px-4 py-3">{formatDate(request.endDate)}</td>
                              <td className="px-4 py-3">{request.daysRequested || 0}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(request.status)}
                                  {getStatusBadge(request.status)}
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-[200px] truncate" title={request.reason}>
                                {request.reason || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}