import { Holiday } from './types';
import { DEFAULT_LEAVE_POLICY } from './constants';

/**
 * Calculate working days between two dates, excluding weekends and holidays
 */
export function calculateWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  holidays: Holiday[] = []
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Normalize to midnight UTC to avoid timezone issues
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const holidayDates = new Set(
    holidays.map((h) => new Date(h.date).toDateString())
  );

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    const dateString = current.toDateString();

    // Check if it's a weekend (Saturday = 6, Sunday = 0) or holiday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.has(dateString);

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
}

/**
 * Check if a date range overlaps with existing leave requests
 */
export function hasOverlappingLeave(
  startDate: string,
  endDate: string,
  employeeId: string,
  existingRequests: any[],
  excludeId?: string
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return existingRequests.some((req) => {
    if (req.employeeId !== employeeId) return false;
    if (
      req.status === 'REJECTED' ||
      req.status === 'CANCELLED'
    )
      return false;
    if (excludeId && req.id === excludeId) return false;

    const reqStart = new Date(req.startDate);
    const reqEnd = new Date(req.endDate);

    // Check for overlap
    return start <= reqEnd && end >= reqStart;
  });
}

/**
 * Validate leave request against policy
 */
export function validateLeaveRequest(
  startDate: string,
  endDate: string,
  totalDays: number,
  availableDays: number,
  existingRequests: any[],
  employeeId: string,
  holidays: Holiday[] = []
): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if start date is not in the past
  if (start < new Date()) {
    // Allow same day
    const today = new Date();
    if (start.toDateString() !== today.toDateString()) {
      return { valid: false, error: 'Start date cannot be in the past' };
    }
  }

  // Check if end date is after start date
  if (end < start) {
    return { valid: false, error: 'End date must be after start date' };
  }

  // Check for overlapping leaves
  if (
    hasOverlappingLeave(startDate, endDate, employeeId, existingRequests)
  ) {
    return { valid: false, error: 'You already have leave during this period' };
  }

  // Check available balance
  if (totalDays > availableDays) {
    return {
      valid: false,
      error: `Insufficient leave balance. Available: ${availableDays} days, Requested: ${totalDays} days`,
    };
  }

  // Check against policy
  if (totalDays > DEFAULT_LEAVE_POLICY.maxConsecutiveDays) {
    return {
      valid: false,
      error: `Cannot apply for more than ${DEFAULT_LEAVE_POLICY.maxConsecutiveDays} consecutive days`,
    };
  }

  return { valid: true };
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: string,
  endDate: string,
  format: 'short' | 'long' = 'short'
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (format === 'short') {
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }

  return `${start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} to ${end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/**
 * Get leave type name by ID
 */
export function getLeaveTypeName(leaveTypeId: string, leaveTypes: any[]): string {
  return leaveTypes.find((lt) => lt.id === leaveTypeId)?.name || 'Leave';
}

/**
 * Check if manager can approve (not their own leave)
 */
export function canApproveRequest(
  managerId: string,
  requestApplierId: string,
  requestManagerId?: string
): boolean {
  // Manager can approve if they are the assigned manager
  if (requestManagerId && requestManagerId === managerId) {
    return true;
  }
  // Manager cannot approve their own leave
  if (requestApplierId === managerId) {
    return false;
  }
  return true;
}
