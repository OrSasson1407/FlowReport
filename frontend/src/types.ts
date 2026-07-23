export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'CEO' | 'ADMIN';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  title: string;
  department: string;
  avatarUrl?: string;
  managerId?: string;
}

export interface ReportCycle {
  id: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  isLocked: boolean;
}

export interface Report {
  id: string;
  userId: string;
  user?: User;
  cycleId: string;
  status: ReportStatus;
  completedContent: string;
  workingOnContent: string;
  blockersContent: string;
  plansContent: string;
  version: number;
  submittedAt?: string;
  updatedAt: string;
  comments?: string;
  attachments?: string[];
  jiraReferences?: string[];
}

export interface DepartmentMetrics {
  id: string;
  name: string;
  complianceRate: number;
  activeBlockerCount: number;
  managerName: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface EscalatedBlocker {
  id: string;
  department: string;
  title: string;
  description: string;
  owner: string;
  daysActive: number;
  isCritical: boolean;
}

export interface AppNotification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
