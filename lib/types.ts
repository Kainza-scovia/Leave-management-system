// Role and Status Enums
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type NotificationType = 'LEAVE_APPLIED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_CANCELLED' | 'NEW_REQUEST';

// Core Models
export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  managerId?: string;
  profilePicture?: string;
  emergencyContact?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headCount: number;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string;
  entitlementDays: number;
  requiresApproval: boolean;
  paid: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  leaveTypeId: string;
  totalDays: number;
  usedDays: number;
  carryForward: number;
  lastUpdated: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  managerId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  attachmentUrl?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  emergencyContact?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string;
  recurring: boolean;
  year?: number;
}

export interface LeavePolicy {
  id: string;
  name: string;
  workingDaysPerWeek: number[];
  carryForwardLimit: number;
  maxConsecutiveDays: number;
  minNoticeRequired: number;
  companyName: string;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes: Record<string, any>;
  timestamp: string;
}

// User Session
export interface User extends Employee {
  role: UserRole;
}
