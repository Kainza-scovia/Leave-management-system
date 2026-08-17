// lib/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  employeeCode?: string;
  role?: string;
  department?: string;
  avatar?: string;
  totalLeaveDays?: number;
  usedLeaveDays?: number;
  remainingLeaveDays?: number;
  [key: string]: any; // This allows additional fields for flexibility
}