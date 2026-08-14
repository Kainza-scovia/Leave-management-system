'use client';

import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  Notification,
  AuditLog,
  User,
} from './types';
import {
  LEAVE_TYPES,
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYEE_NAMES,
  ALL_HOLIDAYS,
  DEFAULT_LEAVE_POLICY,
} from './constants';

// Initialize localStorage keys
const STORAGE_KEYS = {
  EMPLOYEES: 'leave_system_employees',
  LEAVE_REQUESTS: 'leave_system_requests',
  LEAVE_BALANCES: 'leave_system_balances',
  NOTIFICATIONS: 'leave_system_notifications',
  AUDIT_LOG: 'leave_system_audit_log',
  CURRENT_USER: 'leave_system_current_user',
};

// Generate mock employees with Mozambican names
function generateMockEmployees(): Employee[] {
  const employees: Employee[] = [];
  const currentYear = new Date().getFullYear();

  EMPLOYEE_NAMES.forEach((name, index) => {
    const deptIndex = index % DEPARTMENTS.length;
    const department = DEPARTMENTS[deptIndex];
    const designation =
      DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)];
    const managerId = index > 0 ? `emp_${Math.floor(index / 5) * 5}` : undefined;

    employees.push({
      id: `emp_${index}`,
      employeeCode: `EMP${String(1000 + index).slice(-4)}`,
      name: name, // Now using Mozambican names from EMPLOYEE_NAMES
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@techcorp.co.mz`, // Changed to .co.mz for Mozambique
      phone: `+258 ${String(800000000 + index).slice(-9)}`, // Changed to Mozambique country code
      department: department.name,
      designation,
      joiningDate: new Date(
        currentYear - Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )
        .toISOString()
        .split('T')[0],
      status: 'ACTIVE',
      managerId,
      profilePicture: undefined,
      emergencyContact: `+258 ${String(800000000 + index).slice(-9)}`,
    });
  });

  return employees;
}

// Generate leave balances for employees
function generateMockBalances(employees: Employee[]): LeaveBalance[] {
  const balances: LeaveBalance[] = [];
  const currentYear = new Date().getFullYear();

  employees.forEach((emp, empIndex) => {
    LEAVE_TYPES.forEach((leaveType) => {
      balances.push({
        id: `balance_${empIndex}_${leaveType.id}`,
        employeeId: emp.id,
        year: currentYear,
        leaveTypeId: leaveType.id,
        totalDays: leaveType.entitlementDays,
        usedDays: Math.floor(Math.random() * (leaveType.entitlementDays / 2)),
        carryForward: Math.floor(Math.random() * 3),
        lastUpdated: new Date().toISOString(),
      });
    });
  });

  return balances;
}

// Generate mock leave requests
function generateMockLeaveRequests(employees: Employee[]): LeaveRequest[] {
  const requests: LeaveRequest[] = [];
  const currentYear = new Date().getFullYear();
  const today = new Date();

  employees.slice(0, 20).forEach((emp, index) => {
    // Generate 2-4 requests per employee
    const numRequests = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numRequests; i++) {
      const startDate = new Date(
        currentYear,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 20) + 1
      );
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

      const statuses: ('PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED')[] = [
        'PENDING',
        'APPROVED',
        'REJECTED',
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const leaveType = LEAVE_TYPES[Math.floor(Math.random() * LEAVE_TYPES.length)];
      const manager = employees.find(
        (e) => e.id !== emp.id && Math.random() > 0.7
      );

      requests.push({
        id: `req_${index}_${i}`,
        employeeId: emp.id,
        managerId: manager?.id,
        leaveTypeId: leaveType.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        numberOfDays: Math.floor(Math.random() * 5) + 1,
        reason: ['Vacation', 'Health checkup', 'Family event', 'Personal work'][
          Math.floor(Math.random() * 4)
        ],
        status,
        attachmentUrl: undefined,
        createdAt: new Date(
          today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        approvedAt:
          status !== 'PENDING'
            ? new Date().toISOString()
            : undefined,
        approvedBy:
          status === 'APPROVED'
            ? manager?.id
            : undefined,
        rejectionReason:
          status === 'REJECTED'
            ? 'Leave policy violation'
            : undefined,
        emergencyContact: emp.emergencyContact,
      });
    }
  });

  return requests;
}

// Reset mock data with Mozambican names
export function resetMockData() {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear all existing data
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.LEAVE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.LEAVE_BALANCES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    // Generate new data with Mozambican names
    const employees = generateMockEmployees();
    const balances = generateMockBalances(employees);
    const requests = generateMockLeaveRequests(employees);
    
    // Save the new data
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(balances));
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
    
    console.log('[v0] Mock data reset with Mozambican names!');
  } catch (error) {
    console.error('[v0] Failed to reset mock data:', error);
  }
}

// Set a specific employee as current user
export function setCurrentUserByIndex(index: number = 0) {
  if (typeof window === 'undefined') return;
  
  try {
    const employees = getEmployees();
    if (employees.length > 0) {
      const employee = employees[index];
      const user: User = {
        ...employee,
        role: 'EMPLOYEE' as const,
      };
      setCurrentUser(user);
      console.log(`[v0] Current user set to: ${employee.name}`);
    }
  } catch (error) {
    console.error('[v0] Error setting current user:', error);
  }
}

// Get or initialize data
export function initializeMockData() {
  if (typeof window === 'undefined') return;

  try {
    // Check if data already exists
    if (
      !localStorage.getItem(STORAGE_KEYS.EMPLOYEES) ||
      !localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES)
    ) {
      const employees = generateMockEmployees();
      const balances = generateMockBalances(employees);
      const requests = generateMockLeaveRequests(employees);

      localStorage.setItem(
        STORAGE_KEYS.EMPLOYEES,
        JSON.stringify(employees)
      );
      localStorage.setItem(
        STORAGE_KEYS.LEAVE_BALANCES,
        JSON.stringify(balances)
      );
      localStorage.setItem(
        STORAGE_KEYS.LEAVE_REQUESTS,
        JSON.stringify(requests)
      );
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
      
      console.log('[v0] Initialized mock data with Mozambican names!');
    }
  } catch (error) {
    console.error('[v0] Failed to initialize mock data:', error);
  }
}

// Retrieve data from localStorage
export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[v0] Error retrieving employees:', error);
    return [];
  }
}

export function getLeaveRequests(): LeaveRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[v0] Error retrieving leave requests:', error);
    return [];
  }
}

export function getLeaveBalances(): LeaveBalance[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[v0] Error retrieving leave balances:', error);
    return [];
  }
}

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export function getAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

// Save data to localStorage
export function saveEmployees(employees: Employee[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.EMPLOYEES,
      JSON.stringify(employees)
    );
  } catch (error) {
    console.error('[v0] Error saving employees:', error);
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.LEAVE_REQUESTS,
      JSON.stringify(requests)
    );
  } catch (error) {
    console.error('[v0] Error saving leave requests:', error);
  }
}

export function saveLeaveBalances(balances: LeaveBalance[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.LEAVE_BALANCES,
      JSON.stringify(balances)
    );
  } catch (error) {
    console.error('[v0] Error saving leave balances:', error);
  }
}

export function saveNotifications(notifications: Notification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  } catch (error) {
    console.error('[v0] Error saving notifications:', error);
  }
}

export function saveAuditLogs(logs: AuditLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
  } catch (error) {
    console.error('[v0] Error saving audit logs:', error);
  }
}

// Get current logged-in user
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error('[v0] Error saving current user:', error);
  }
}

// Get default mock users for switching
export function getMockUsers(employees: Employee[]): User[] {
  // Use the first employee with Mozambican name as default
  const employee = employees[0]
    ? { ...employees[0], role: 'EMPLOYEE' as const }
    : null;
  const manager = employees[5]
    ? { ...employees[5], role: 'MANAGER' as const }
    : null;
  const hrAdmin = employees[1]
    ? { ...employees[1], role: 'HR_ADMIN' as const }
    : null;

  return [employee, manager, hrAdmin].filter(Boolean) as User[];
}