import { LeaveType, Department, Holiday, LeavePolicy } from './types';

export const LEAVE_TYPES: LeaveType[] = [
  {
    id: '1',
    name: 'Annual Leave',
    description: 'Paid annual vacation days',
    entitlementDays: 20,
    requiresApproval: true,
    paid: true,
  },
  {
    id: '2',
    name: 'Sick Leave',
    description: 'For medical/health reasons',
    entitlementDays: 10,
    requiresApproval: true,
    paid: true,
  },
  {
    id: '3',
    name: 'Casual Leave',
    description: 'General casual absence',
    entitlementDays: 8,
    requiresApproval: true,
    paid: true,
  },
  {
    id: '4',
    name: 'Maternity Leave',
    description: 'For female employees',
    entitlementDays: 90,
    requiresApproval: true,
    paid: true,
  },
  {
    id: '5',
    name: 'Paternity Leave',
    description: 'For male employees',
    entitlementDays: 15,
    requiresApproval: true,
    paid: true,
  },
  {
    id: '6',
    name: 'Compassionate Leave',
    description: 'For emergency family matters',
    entitlementDays: 5,
    requiresApproval: false,
    paid: true,
  },
  {
    id: '7',
    name: 'Study Leave',
    description: 'For educational purposes',
    entitlementDays: 5,
    requiresApproval: true,
    paid: false,
  },
];

export const DEPARTMENTS: Department[] = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development team',
    headCount: 25,
  },
  {
    id: '2',
    name: 'Human Resources',
    description: 'HR and recruitment team',
    headCount: 8,
  },
  {
    id: '3',
    name: 'Sales',
    description: 'Sales and account management',
    headCount: 15,
  },
  {
    id: '4',
    name: 'Finance',
    description: 'Finance and accounting team',
    headCount: 10,
  },
  {
    id: '5',
    name: 'Operations',
    description: 'Operations and support',
    headCount: 12,
  },
];

export const DESIGNATIONS = [
  'Software Engineer',
  'Senior Engineer',
  'Engineering Manager',
  'Product Manager',
  'Designer',
  'HR Manager',
  'HR Executive',
  'Sales Executive',
  'Sales Manager',
  'Finance Manager',
  'Accountant',
  'Operations Manager',
  'Analyst',
  'Coordinator',
];

export const DEFAULT_LEAVE_POLICY: LeavePolicy = {
  id: '1',
  name: 'Standard Leave Policy',
  workingDaysPerWeek: [1, 2, 3, 4, 5], // Monday to Friday
  carryForwardLimit: 5,
  maxConsecutiveDays: 20,
  minNoticeRequired: 3,
  companyName: 'TechCorp Inc.',
  description: 'Standard company leave policy',
};

// Updated to Mozambican holidays
export const HOLIDAYS_2024: Holiday[] = [
  { id: '1', name: 'New Year\'s Day', date: '2024-01-01', description: '', recurring: true, year: 2024 },
  { id: '2', name: 'Heroes Day', date: '2024-02-03', description: 'Mozambique Heroes Day', recurring: true, year: 2024 },
  { id: '3', name: 'Mozambican Women\'s Day', date: '2024-04-07', description: '', recurring: true, year: 2024 },
  { id: '4', name: 'Good Friday', date: '2024-03-29', description: '', recurring: false, year: 2024 },
  { id: '5', name: 'Easter Sunday', date: '2024-03-31', description: '', recurring: false, year: 2024 },
  { id: '6', name: 'Workers\' Day', date: '2024-05-01', description: '', recurring: true, year: 2024 },
  { id: '7', name: 'Independence Day', date: '2024-06-25', description: 'Mozambique Independence Day', recurring: true, year: 2024 },
  { id: '8', name: 'Lusaka Agreement Day', date: '2024-09-07', description: '', recurring: true, year: 2024 },
  { id: '9', name: 'Armed Forces Day', date: '2024-09-25', description: '', recurring: true, year: 2024 },
  { id: '10', name: 'Peace and Reconciliation Day', date: '2024-10-04', description: '', recurring: true, year: 2024 },
  { id: '11', name: 'Family Day', date: '2024-12-25', description: 'Christmas Day', recurring: true, year: 2024 },
];

export const HOLIDAYS_2025: Holiday[] = [
  { id: '1', name: 'New Year\'s Day', date: '2025-01-01', description: '', recurring: true, year: 2025 },
  { id: '2', name: 'Heroes Day', date: '2025-02-03', description: 'Mozambique Heroes Day', recurring: true, year: 2025 },
  { id: '3', name: 'Mozambican Women\'s Day', date: '2025-04-07', description: '', recurring: true, year: 2025 },
  { id: '4', name: 'Good Friday', date: '2025-04-18', description: '', recurring: false, year: 2025 },
  { id: '5', name: 'Easter Sunday', date: '2025-04-20', description: '', recurring: false, year: 2025 },
  { id: '6', name: 'Workers\' Day', date: '2025-05-01', description: '', recurring: true, year: 2025 },
  { id: '7', name: 'Independence Day', date: '2025-06-25', description: 'Mozambique Independence Day', recurring: true, year: 2025 },
  { id: '8', name: 'Lusaka Agreement Day', date: '2025-09-07', description: '', recurring: true, year: 2025 },
  { id: '9', name: 'Armed Forces Day', date: '2025-09-25', description: '', recurring: true, year: 2025 },
  { id: '10', name: 'Peace and Reconciliation Day', date: '2025-10-04', description: '', recurring: true, year: 2025 },
  { id: '11', name: 'Family Day', date: '2025-12-25', description: 'Christmas Day', recurring: true, year: 2025 },
];

export const ALL_HOLIDAYS = [...HOLIDAYS_2024, ...HOLIDAYS_2025];

// Updated to Mozambican names only
export const EMPLOYEE_NAMES = [
  'Amâncio José Macuácua',
  'Maria Isabel Langa',
  'João Carlos Tembe',
  'Sónia Felicidade Cuna',
  'Armando Emílio Mandlate',
  'Esperança Gil da Conceição',
  'Lúcio António Muianga',
  'Dina Maria Chambule',
  'Bernardo Feliciano Nhampossa',
  'Albertina Cândida Matsinhe',
  'Carlos Alberto Mondlane',
  'Helena Augusta Massinga',
  'Feliciano João Munguambe',
  'Lídia Esperança Muchanga',
  'Francisco Simão Muianga',
  'Isabel Cristina Machava',
  'António Paulo Nhassengo',
  'Rosa Felizarda Matusse',
  'Manuel José Macamo',
  'Celeste Maria Zimba',
  'Eduardo Valério Sumbane',
  'Olga Marta Mavanga',
  'Raimundo Carlos Macuácua',
  'Lurdes Cândida Mahumane',
  'Hermenegildo André Nhassengo',
  'Graça Isabel Muthisse',
  'Joaquim Fernando Massingue',
  'Gilda Maria Zandamela',
  'Arnaldo João Muianga',
  'Berta Luzia Guambe',
  'Énio Alexandre Macome',
  'Zélia Augusta Mucavele',
  'Raúl Augusto Nhamirre',
  'Dulce Marina Mungoi',
  'Tomás Joaquim Mabilana',
  'Lina Emília Nhancale',
  'Elias Mateus Zimba',
  'Rute Lídia Mabila',
  'Dinis José Mondlane',
  'Sofia Amélia Sitoi',
  'Anselmo Bernardo Manhiça',
  'Tânia Carla Muthemba',
  'Amílcar Dinis Machava',
  'Fernanda Albertina Zitha',
  'Gustavo Ernesto Machai',
  'Lúcia Vânia Macuiana',
  'Humberto Filipe Massavane',
  'Eugénia Marisa Nhampossa',
  'Valdemar João Macaringue',
  'Alda Helena Sumbane',
];

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
};