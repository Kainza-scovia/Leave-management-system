// app/hr/employees/page.tsx
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
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Save,
  UserPlus,
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
  avatar?: string;
  phone?: string;
  joinDate?: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeCode: "",
    department: "",
    role: "employee",
    status: "ACTIVE",
    totalLeaveDays: 20,
    usedLeaveDays: 0,
    remainingLeaveDays: 20,
    phone: "",
    joinDate: "",
  });
  const [saving, setSaving] = useState(false);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch employees from Firebase
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
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();

    // Real-time listener
    const unsubscribe = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const employeesData: Employee[] = [];
        snapshot.forEach((doc) => {
          employeesData.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(employeesData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          emp.employeeCode?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((emp) => emp.role === filterRole);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((emp) => emp.status === filterStatus);
    }

    return filtered;
  }, [employees, searchTerm, filterRole, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique roles for filter
  const roles = useMemo(() => {
    const roleSet = new Set(employees.map((emp) => emp.role).filter(Boolean));
    return ["all", ...Array.from(roleSet)];
  }, [employees]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE" || status === "active" || status === "Active") {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    } else if (status === "INACTIVE" || status === "inactive" || status === "Inactive") {
      return <Badge className="bg-red-500 hover:bg-red-600">Inactive</Badge>;
    } else {
      return <Badge variant="outline">{status || "Active"}</Badge>;
    }
  };

  // Handle add employee
  const handleAddEmployee = async () => {
    setSaving(true);
    try {
      const newEmployee = {
        name: formData.name,
        email: formData.email,
        employeeCode: formData.employeeCode || `EMP${Date.now().toString().slice(-6)}`,
        department: formData.department || "",
        role: formData.role || "employee",
        status: formData.status || "ACTIVE",
        totalLeaveDays: Number(formData.totalLeaveDays) || 20,
        usedLeaveDays: Number(formData.usedLeaveDays) || 0,
        remainingLeaveDays: Number(formData.totalLeaveDays) - Number(formData.usedLeaveDays) || 20,
        phone: formData.phone || "",
        joinDate: formData.joinDate || new Date().toISOString().split("T")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = doc(collection(db, "employees"));
      await setDoc(docRef, newEmployee);

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit employee
  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        totalLeaveDays: Number(formData.totalLeaveDays),
        usedLeaveDays: Number(formData.usedLeaveDays),
        remainingLeaveDays: Number(formData.totalLeaveDays) - Number(formData.usedLeaveDays),
        phone: formData.phone,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "employees", selectedEmployee.id), updates);

      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "employees", id));
      alert("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
    }
  };

  // Open edit modal
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      employeeCode: employee.employeeCode || "",
      department: employee.department || "",
      role: employee.role || "employee",
      status: employee.status || "ACTIVE",
      totalLeaveDays: employee.totalLeaveDays || 20,
      usedLeaveDays: employee.usedLeaveDays || 0,
      remainingLeaveDays: employee.remainingLeaveDays || 20,
      phone: employee.phone || "",
      joinDate: employee.joinDate || "",
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      employeeCode: "",
      department: "",
      role: "employee",
      status: "ACTIVE",
      totalLeaveDays: 20,
      usedLeaveDays: 0,
      remainingLeaveDays: 20,
      phone: "",
      joinDate: "",
    });
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

  // Check if user has HR access
  const isHRAccess = currentUser?.role === "hr_admin" || currentUser?.role === "HR_ADMIN";

  if (!isHRAccess) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to view employee management.
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
                  <Users className="h-8 w-8 text-primary" />
                  Employee Management
                </h1>
                <p className="text-muted-foreground">
                  Manage all employees and their leave balances
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="gap-2 bg-primary"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/hr/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold">{employees.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {employees.filter(e => e.status === "ACTIVE" || e.status === "active").length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold text-red-600">
                        {employees.filter(e => e.status === "INACTIVE" || e.status === "inactive").length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Departments</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {new Set(employees.map(e => e.department).filter(Boolean)).size}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-500" />
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
                    placeholder="Search by name, email, code, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Roles</option>
                  {roles.filter(r => r !== "all").map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {(searchTerm || filterRole !== "all" || filterStatus !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterRole("all");
                      setFilterStatus("all");
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Employee Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Employees</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredEmployees.length} employees
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterRole !== "all" || filterStatus !== "all"
                        ? "Try adjusting your filters"
                        : "Start by adding your first employee"}
                    </p>
                    {!searchTerm && filterRole === "all" && filterStatus === "all" && (
                      <Button 
                        className="mt-4 gap-2"
                        onClick={() => {
                          resetForm();
                          setShowAddModal(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Employee
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Employee</th>
                            <th className="px-4 py-3 text-left font-medium">Code</th>
                            <th className="px-4 py-3 text-left font-medium">Department</th>
                            <th className="px-4 py-3 text-left font-medium">Role</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Leave Balance</th>
                            <th className="px-4 py-3 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedEmployees.map((employee, index) => (
                            <tr
                              key={employee.id}
                              className={`border-t hover:bg-muted/50 ${
                                index % 2 === 0 ? "bg-background" : "bg-muted/30"
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {employee.employeeCode || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                {employee.department || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="capitalize">
                                  {employee.role || "employee"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {getStatusBadge(employee.status || "ACTIVE")}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <span className="font-medium">{employee.remainingLeaveDays || 0}</span>
                                  <span className="text-muted-foreground text-xs"> / {employee.totalLeaveDays || 20}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(employee)}
                                    className="gap-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                                    className="gap-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
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
                          {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of{" "}
                          {filteredEmployees.length} employees
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Add Employee</h2>
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
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Employee Code</label>
                <Input
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  placeholder="EMP1001"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr_admin">HR Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Total Leave Days</label>
                <Input
                  type="number"
                  value={formData.totalLeaveDays}
                  onChange={(e) => setFormData({ ...formData, totalLeaveDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Used Leave Days</label>
                <Input
                  type="number"
                  value={formData.usedLeaveDays}
                  onChange={(e) => {
                    const used = Number(e.target.value);
                    setFormData({ 
                      ...formData, 
                      usedLeaveDays: used,
                      remainingLeaveDays: formData.totalLeaveDays - used 
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Join Date</label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleAddEmployee}
                disabled={saving || !formData.name || !formData.email}
                className="flex-1"
              >
                {saving ? "Adding..." : "Add Employee"}
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

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Edit Employee</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  resetForm();
                }}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr_admin">HR Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total Leave Days</label>
                <Input
                  type="number"
                  value={formData.totalLeaveDays}
                  onChange={(e) => setFormData({ ...formData, totalLeaveDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Used Leave Days</label>
                <Input
                  type="number"
                  value={formData.usedLeaveDays}
                  onChange={(e) => {
                    const used = Number(e.target.value);
                    setFormData({ 
                      ...formData, 
                      usedLeaveDays: used,
                      remainingLeaveDays: formData.totalLeaveDays - used 
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleEditEmployee}
                disabled={saving || !formData.name || !formData.email}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
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