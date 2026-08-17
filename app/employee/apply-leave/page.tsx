// app/employee/apply-leave/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Calendar, Send, User, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ApplyLeavePage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  
  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("Annual");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [remainingDays, setRemainingDays] = useState(20);

  // Check if user is logged in
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    }
    // Get remaining leave days from user data
    if (currentUser?.remainingLeaveDays !== undefined) {
      setRemainingDays(currentUser.remainingLeaveDays);
    }
  }, [currentUser, isLoading, router]);

  // Calculate number of days requested
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    // Validation
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      setSubmitting(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      setSubmitting(false);
      return;
    }

    const daysRequested = calculateDays();
    if (daysRequested > remainingDays) {
      setError(`You only have ${remainingDays} days remaining. You requested ${daysRequested} days.`);
      setSubmitting(false);
      return;
    }

    try {
      // 🔥 Save leave request to Firestore
      const leaveData = {
        employeeId: currentUser?.id,
        employeeEmail: currentUser?.email,
        employeeName: currentUser?.name || currentUser?.email,
        employeeCode: currentUser?.employeeCode || "",
        department: currentUser?.department || "",
        startDate: startDate,
        endDate: endDate,
        daysRequested: daysRequested,
        leaveType: leaveType,
        reason: reason,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        comments: "",
      };

      await addDoc(collection(db, "leaveRequests"), leaveData);

      setSuccess(true);
      
      // Reset form
      setStartDate("");
      setEndDate("");
      setLeaveType("Annual");
      setReason("");
      setRemainingDays(prev => prev - daysRequested);

      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/employee/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setError("Failed to submit leave request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="container mx-auto max-w-3xl">
            {/* Back Button */}
            <button
              onClick={() => router.push("/employee/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Apply for Leave</h1>
                <p className="text-muted-foreground">
                  Submit your leave request for approval
                </p>
              </div>
            </div>

            {/* Remaining Days Card */}
            <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Your Remaining Leave Days
                    </p>
                    <p className="text-2xl font-bold">{remainingDays} days</p>
                  </div>
                </div>
                {remainingDays < 5 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Low balance!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form */}
            <div className="rounded-lg border bg-card p-6">
              {success ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <h3 className="font-semibold text-lg">✅ Leave Request Submitted!</h3>
                  <p className="text-sm mt-2">
                    Your request has been sent to your manager for approval.
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    You will be notified once it's reviewed.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => router.push("/employee/dashboard")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Employee Info (read-only) */}
                  <div className="bg-muted p-4 rounded-lg space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Employee:</span>{" "}
                      {currentUser?.name || currentUser?.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Department:</span>{" "}
                      {currentUser?.department || "Not specified"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Employee Code:</span>{" "}
                      {currentUser?.employeeCode || "Not assigned"}
                    </p>
                  </div>

                  {/* Leave Type */}
                  <div className="space-y-2">
                    <label htmlFor="leaveType" className="text-sm font-medium">
                      Leave Type *
                    </label>
                    <select
                      id="leaveType"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      required
                    >
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Personal">Personal Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                      <option value="Study">Study Leave</option>
                      <option value="Emergency">Emergency Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="startDate" className="text-sm font-medium">
                        Start Date *
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endDate" className="text-sm font-medium">
                        End Date *
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                  </div>

                  {/* Days Count */}
                  {startDate && endDate && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">Total days requested:</span>{" "}
                        {calculateDays()} day{calculateDays() > 1 ? "s" : ""}
                      </p>
                      {calculateDays() > remainingDays && (
                        <p className="text-sm text-red-500 mt-1">
                          ⚠️ This exceeds your remaining balance ({remainingDays} days)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <label htmlFor="reason" className="text-sm font-medium">
                      Reason *
                    </label>
                    <textarea
                      id="reason"
                      placeholder="Please explain the reason for your leave request..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md bg-background resize-y"
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => router.push("/employee/dashboard")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={submitting || calculateDays() > remainingDays}
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}