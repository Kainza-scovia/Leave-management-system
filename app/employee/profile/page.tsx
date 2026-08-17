// app/employee/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Edit,
  Save,
  X,
  Lock,
  CheckCircle,
  AlertCircle,
  Key,
  Shield,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, isLoading } = useAppContext();
  
  // Profile data
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    employeeCode: "",
    department: "",
    role: "",
    totalLeaveDays: 20,
    usedLeaveDays: 0,
    remainingLeaveDays: 20,
  });
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    department: "",
  });
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch user data
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "employees", currentUser.id));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            name: data.name || currentUser.name || currentUser.email || "",
            email: currentUser.email || "",
            employeeCode: data.employeeCode || "",
            department: data.department || "",
            role: data.role || "employee",
            totalLeaveDays: data.totalLeaveDays || 20,
            usedLeaveDays: data.usedLeaveDays || 0,
            remainingLeaveDays: data.remainingLeaveDays || 20,
          });
          
          setEditForm({
            name: data.name || currentUser.name || currentUser.email || "",
            department: data.department || "",
          });
        } else {
          // If no Firestore doc, create one
          const newUserData = {
            name: currentUser.name || currentUser.email || "",
            email: currentUser.email || "",
            employeeCode: "",
            department: "",
            role: "employee",
            totalLeaveDays: 20,
            usedLeaveDays: 0,
            remainingLeaveDays: 20,
            createdAt: new Date(),
          };
          
          await setDoc(doc(db, "employees", currentUser.id), newUserData);
          
          setProfile({
            ...newUserData,
            email: currentUser.email || "",
          });
          setEditForm({
            name: newUserData.name,
            department: newUserData.department,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, isLoading, router]);

  // Handle edit mode
  const handleEdit = () => {
    setEditForm({
      name: profile.name,
      department: profile.department,
    });
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "employees", currentUser.id), {
        name: editForm.name,
        department: editForm.department,
        updatedAt: new Date(),
      });

      // Update local state
      setProfile((prev) => ({
        ...prev,
        name: editForm.name,
        department: editForm.department,
      }));

      // Update context
      setCurrentUser({
        ...currentUser,
        name: editForm.name,
        department: editForm.department,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!auth.currentUser) return;

    setPasswordSaving(true);
    setError("");
    setSuccess("");

    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setPasswordSaving(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);
      
      setSuccess("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log in again to change your password.");
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setPasswordSaving(false);
    }
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
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">My Profile</h1>
                  <p className="text-muted-foreground">
                    View and manage your personal information
                  </p>
                </div>
                {!isEditing && (
                  <Button onClick={handleEdit} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                    {isEditing && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Editing mode)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar / Profile Picture */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{profile.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                    </div>
                  </div>

                  {/* Profile Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="font-medium">{profile.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </label>
                      <p className="font-medium">{profile.email}</p>
                    </div>

                    {/* Employee Code */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> Employee Code
                      </label>
                      <p className="font-medium">{profile.employeeCode || "Not assigned"}</p>
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Department
                      </label>
                      {isEditing ? (
                        <Input
                          value={editForm.department}
                          onChange={(e) =>
                            setEditForm({ ...editForm, department: e.target.value })
                          }
                          placeholder="Your department"
                        />
                      ) : (
                        <p className="font-medium">{profile.department || "Not specified"}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Role
                      </label>
                      <p className="font-medium capitalize">{profile.role}</p>
                    </div>
                  </div>

                  {/* Leave Balance */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4" />
                      Leave Balance
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{profile.totalLeaveDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Used</p>
                        <p className="text-2xl font-bold text-yellow-600">{profile.usedLeaveDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold text-green-600">{profile.remainingLeaveDays}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Change Password Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your current password and choose a new one.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handlePasswordChange}
                disabled={passwordSaving}
                className="flex-1"
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setError("");
                  setSuccess("");
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