// app/hr/policies/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
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
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Building2,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Globe,
  Shield,
  Sparkles,
  Loader2,
} from "lucide-react";

// Types
interface Policy {
  id: string;
  name: string;
  description: string;
  type: "annual" | "sick" | "personal" | "maternity" | "paternity" | "study" | "other";
  daysPerYear: number;
  maxDaysPerRequest?: number;
  requiresApproval: boolean;
  appliesTo: "all" | "fulltime" | "parttime" | "contract" | "specific";
  carryOver?: boolean;
  carryOverDays?: number;
  minDaysNotice?: number;
  isActive: boolean;
  department?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Policy type labels
const POLICY_TYPES: Record<string, { label: string; color: string; icon: any }> = {
  annual: { label: "Annual Leave", color: "bg-blue-500", icon: Calendar },
  sick: { label: "Sick Leave", color: "bg-red-500", icon: AlertCircle },
  personal: { label: "Personal Leave", color: "bg-purple-500", icon: Users },
  maternity: { label: "Maternity Leave", color: "bg-pink-500", icon: Shield },
  paternity: { label: "Paternity Leave", color: "bg-orange-500", icon: Shield },
  study: { label: "Study Leave", color: "bg-teal-500", icon: FileText },
  other: { label: "Other Leave", color: "bg-gray-500", icon: Building2 },
};

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "All Employees",
  fulltime: "Full Time",
  parttime: "Part Time",
  contract: "Contract",
  specific: "Specific Departments",
};

export default function PoliciesPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "annual",
    daysPerYear: 20,
    maxDaysPerRequest: 10,
    requiresApproval: true,
    appliesTo: "all",
    carryOver: false,
    carryOverDays: 5,
    minDaysNotice: 3,
    isActive: true,
    department: "",
  });
  const [saving, setSaving] = useState(false);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch policies from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchPolicies = async () => {
      try {
        const policiesSnap = await getDocs(
          query(collection(db, "policies"), orderBy("name", "asc"))
        );
        const policiesData: Policy[] = [];
        policiesSnap.forEach((doc) => {
          policiesData.push({ id: doc.id, ...doc.data() } as Policy);
        });
        setPolicies(policiesData);
      } catch (error) {
        console.error("Error fetching policies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();

    // Real-time listener
    const unsubscribe = onSnapshot(
      query(collection(db, "policies"), orderBy("name", "asc")),
      (snapshot) => {
        const policiesData: Policy[] = [];
        snapshot.forEach((doc) => {
          policiesData.push({ id: doc.id, ...doc.data() } as Policy);
        });
        setPolicies(policiesData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    let filtered = policies;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.type.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // Active filter
    if (filterActive !== "all") {
      filtered = filtered.filter((p) => p.isActive === (filterActive === "active"));
    }

    return filtered;
  }, [policies, searchTerm, filterType, filterActive]);

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique types for filter
  const types = useMemo(() => {
    const typeSet = new Set(policies.map((p) => p.type).filter(Boolean));
    return ["all", ...Array.from(typeSet)];
  }, [policies]);

  // Stats
  const stats = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.isActive).length;
    const inactive = policies.filter((p) => !p.isActive).length;
    const annual = policies.filter((p) => p.type === "annual").length;
    const sick = policies.filter((p) => p.type === "sick").length;
    return { total, active, inactive, annual, sick };
  }, [policies]);

  // Get policy type badge
  const getTypeBadge = (type: string) => {
    const policyType = POLICY_TYPES[type] || POLICY_TYPES.other;
    return (
      <Badge className={`${policyType.color} hover:${policyType.color}`}>
        {policyType.label}
      </Badge>
    );
  };

  // Get policy type icon
  const getTypeIcon = (type: string) => {
    const policyType = POLICY_TYPES[type] || POLICY_TYPES.other;
    const Icon = policyType.icon;
    return <Icon className="h-4 w-4" />;
  };

  // Get applies to label
  const getAppliesToLabel = (appliesTo: string) => {
    return APPLIES_TO_LABELS[appliesTo] || appliesTo;
  };

  // Handle add policy
  const handleAddPolicy = async () => {
    setSaving(true);
    try {
      const newPolicy = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        daysPerYear: Number(formData.daysPerYear),
        maxDaysPerRequest: Number(formData.maxDaysPerRequest) || null,
        requiresApproval: formData.requiresApproval,
        appliesTo: formData.appliesTo,
        carryOver: formData.carryOver || false,
        carryOverDays: formData.carryOver ? Number(formData.carryOverDays) : null,
        minDaysNotice: Number(formData.minDaysNotice) || null,
        isActive: formData.isActive,
        department: formData.department || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = doc(collection(db, "policies"));
      await setDoc(docRef, newPolicy);

      setShowAddModal(false);
      resetForm();
      alert("Policy added successfully!");
    } catch (error) {
      console.error("Error adding policy:", error);
      alert("Failed to add policy. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit policy
  const handleEditPolicy = async () => {
    if (!selectedPolicy) return;
    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        daysPerYear: Number(formData.daysPerYear),
        maxDaysPerRequest: Number(formData.maxDaysPerRequest) || null,
        requiresApproval: formData.requiresApproval,
        appliesTo: formData.appliesTo,
        carryOver: formData.carryOver || false,
        carryOverDays: formData.carryOver ? Number(formData.carryOverDays) : null,
        minDaysNotice: Number(formData.minDaysNotice) || null,
        isActive: formData.isActive,
        department: formData.department || "",
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "policies", selectedPolicy.id), updates);

      setShowEditModal(false);
      setSelectedPolicy(null);
      resetForm();
      alert("Policy updated successfully!");
    } catch (error) {
      console.error("Error updating policy:", error);
      alert("Failed to update policy. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete policy
  const handleDeletePolicy = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "policies", id));
      alert("Policy deleted successfully!");
    } catch (error) {
      console.error("Error deleting policy:", error);
      alert("Failed to delete policy. Please try again.");
    }
  };

  // Toggle active status
  const togglePolicyStatus = async (policy: Policy) => {
    try {
      await updateDoc(doc(db, "policies", policy.id), {
        isActive: !policy.isActive,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error toggling policy status:", error);
      alert("Failed to update policy status.");
    }
  };

  // Open edit modal
  const openEditModal = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name || "",
      description: policy.description || "",
      type: policy.type || "annual",
      daysPerYear: policy.daysPerYear || 20,
      maxDaysPerRequest: policy.maxDaysPerRequest || 10,
      requiresApproval: policy.requiresApproval !== undefined ? policy.requiresApproval : true,
      appliesTo: policy.appliesTo || "all",
      carryOver: policy.carryOver || false,
      carryOverDays: policy.carryOverDays || 5,
      minDaysNotice: policy.minDaysNotice || 3,
      isActive: policy.isActive !== undefined ? policy.isActive : true,
      department: policy.department || "",
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "annual",
      daysPerYear: 20,
      maxDaysPerRequest: 10,
      requiresApproval: true,
      appliesTo: "all",
      carryOver: false,
      carryOverDays: 5,
      minDaysNotice: 3,
      isActive: true,
      department: "",
    });
  };

  // Check if user has HR access
  const isHRAccess = currentUser?.role === "hr_admin" || currentUser?.role === "HR_ADMIN";

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

  if (!isHRAccess) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to manage leave policies.
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
                  <FileText className="h-8 w-8 text-primary" />
                  Leave Policies
                </h1>
                <p className="text-muted-foreground">
                  Manage company leave policies and rules
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2 bg-primary"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Policy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/hr/dashboard")}
                >
                  Back
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Policies</p>
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
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                      <p className="text-sm text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Annual</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.annual}</p>
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
                      <p className="text-sm text-muted-foreground">Sick</p>
                      <p className="text-2xl font-bold text-red-600">{stats.sick}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
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
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Types</option>
                  {types.filter(t => t !== "all").map((type) => (
                    <option key={type} value={type}>
                      {POLICY_TYPES[type]?.label || type}
                    </option>
                  ))}
                </select>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {(searchTerm || filterType !== "all" || filterActive !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setFilterActive("all");
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Policy Cards Grid */}
            {filteredPolicies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No policies found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterActive !== "all"
                      ? "Try adjusting your filters"
                      : "Click 'Add Policy' to create your first leave policy"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPolicies.map((policy) => {
                    const TypeIcon = POLICY_TYPES[policy.type]?.icon || Building2;
                    return (
                      <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-5">
                          <div className="flex flex-col gap-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${POLICY_TYPES[policy.type]?.color || 'bg-gray-500'} bg-opacity-10`}>
                                  <TypeIcon className={`h-4 w-4 ${POLICY_TYPES[policy.type]?.color || 'text-gray-500'}`} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base">{policy.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getTypeBadge(policy.type)}
                                    <Badge variant={policy.isActive ? "default" : "outline"}>
                                      {policy.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => togglePolicyStatus(policy)}
                                  className="h-8 w-8 p-0"
                                  title={policy.isActive ? "Deactivate" : "Activate"}
                                >
                                  {policy.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(policy)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePolicy(policy.id, policy.name)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Description */}
                            {policy.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {policy.description}
                              </p>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                              <div>
                                <p className="text-muted-foreground">Days Per Year</p>
                                <p className="font-medium">{policy.daysPerYear} days</p>
                              </div>
                              {policy.maxDaysPerRequest && (
                                <div>
                                  <p className="text-muted-foreground">Max Per Request</p>
                                  <p className="font-medium">{policy.maxDaysPerRequest} days</p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground">Applies To</p>
                                <p className="font-medium text-xs">{getAppliesToLabel(policy.appliesTo)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Carry Over</p>
                                <p className="font-medium">
                                  {policy.carryOver ? `Yes (${policy.carryOverDays} days)` : "No"}
                                </p>
                              </div>
                              {policy.minDaysNotice && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Min Days Notice</p>
                                  <p className="font-medium">{policy.minDaysNotice} days</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredPolicies.length)} of{" "}
                      {filteredPolicies.length} policies
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
          </div>
        </main>
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Add Leave Policy</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Policy Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Annual Leave Policy"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Policy Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="study">Study Leave</option>
                  <option value="other">Other Leave</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the policy"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Days Per Year *</label>
                <Input
                  type="number"
                  value={formData.daysPerYear}
                  onChange={(e) => setFormData({ ...formData, daysPerYear: Number(e.target.value) })}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Days Per Request</label>
                <Input
                  type="number"
                  value={formData.maxDaysPerRequest}
                  onChange={(e) => setFormData({ ...formData, maxDaysPerRequest: Number(e.target.value) })}
                  min={0}
                  placeholder="Leave blank for no limit"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Applies To</label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Employees</option>
                  <option value="fulltime">Full Time</option>
                  <option value="parttime">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="specific">Specific Departments</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Min Days Notice</label>
                <Input
                  type="number"
                  value={formData.minDaysNotice}
                  onChange={(e) => setFormData({ ...formData, minDaysNotice: Number(e.target.value) })}
                  min={0}
                  placeholder="Days required in advance"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Specific department (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Carry Over Days</label>
                <Input
                  type="number"
                  value={formData.carryOverDays}
                  onChange={(e) => setFormData({ ...formData, carryOverDays: Number(e.target.value) })}
                  min={0}
                  placeholder="Max days to carry over"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Requires Manager Approval
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.carryOver}
                    onChange={(e) => setFormData({ ...formData, carryOver: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Allow Carry Over
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Active Policy
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleAddPolicy}
                disabled={saving || !formData.name || !formData.daysPerYear}
                className="flex-1"
              >
                {saving ? "Adding..." : "Add Policy"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Edit Policy</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPolicy(null);
                  resetForm();
                }}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Policy Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Annual Leave Policy"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Policy Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="study">Study Leave</option>
                  <option value="other">Other Leave</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the policy"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Days Per Year *</label>
                <Input
                  type="number"
                  value={formData.daysPerYear}
                  onChange={(e) => setFormData({ ...formData, daysPerYear: Number(e.target.value) })}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Days Per Request</label>
                <Input
                  type="number"
                  value={formData.maxDaysPerRequest}
                  onChange={(e) => setFormData({ ...formData, maxDaysPerRequest: Number(e.target.value) })}
                  min={0}
                  placeholder="Leave blank for no limit"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Applies To</label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Employees</option>
                  <option value="fulltime">Full Time</option>
                  <option value="parttime">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="specific">Specific Departments</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Min Days Notice</label>
                <Input
                  type="number"
                  value={formData.minDaysNotice}
                  onChange={(e) => setFormData({ ...formData, minDaysNotice: Number(e.target.value) })}
                  min={0}
                  placeholder="Days required in advance"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Specific department (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Carry Over Days</label>
                <Input
                  type="number"
                  value={formData.carryOverDays}
                  onChange={(e) => setFormData({ ...formData, carryOverDays: Number(e.target.value) })}
                  min={0}
                  placeholder="Max days to carry over"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Requires Manager Approval
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.carryOver}
                    onChange={(e) => setFormData({ ...formData, carryOver: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Allow Carry Over
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Active Policy
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleEditPolicy}
                disabled={saving || !formData.name || !formData.daysPerYear}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPolicy(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}