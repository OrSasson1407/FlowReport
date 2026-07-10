import { User, Report, ReportCycle, DepartmentMetrics, EscalatedBlocker, AppNotification } from './types';

export const CURRENT_CYCLE: ReportCycle = {
  id: 'cycle-w26',
  year: 2026,
  weekNumber: 26,
  startDate: '2026-06-22',
  endDate: '2026-06-26',
  submissionDeadline: '2026-06-26T17:00:00-07:00', // Friday at 5:00 PM
  isLocked: false,
};

export const USERS: Record<string, User> = {
  'or-sasson': {
    id: 'or-sasson',
    email: 'or.sasson@flowreport.com',
    firstName: 'Or',
    lastName: 'Sasson',
    role: 'EMPLOYEE',
    title: 'Senior Engineer',
    department: 'Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    managerId: 'elena-rostova',
  },
  'alice-smith': {
    id: 'alice-smith',
    email: 'alice.smith@flowreport.com',
    firstName: 'Alice',
    lastName: 'Smith',
    role: 'EMPLOYEE',
    title: 'Backend Engineer',
    department: 'Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    managerId: 'elena-rostova',
  },
  'bob-jones': {
    id: 'bob-jones',
    email: 'bob.jones@flowreport.com',
    firstName: 'Bob',
    lastName: 'Jones',
    role: 'EMPLOYEE',
    title: 'Security Lead',
    department: 'Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    managerId: 'elena-rostova',
  },
  'charlie-d': {
    id: 'charlie-d',
    email: 'charlie.d@flowreport.com',
    firstName: 'Charlie',
    lastName: 'D.',
    role: 'EMPLOYEE',
    title: 'QA Engineer',
    department: 'Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    managerId: 'elena-rostova',
  },
  'elena-rostova': {
    id: 'elena-rostova',
    email: 'elena.rostova@flowreport.com',
    firstName: 'Elena',
    lastName: 'Rostova',
    role: 'MANAGER',
    title: 'Engineering Director',
    department: 'Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    managerId: 'sarah-jenkins',
  },
  'sarah-jenkins': {
    id: 'sarah-jenkins',
    email: 'ceo@flowreport.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    role: 'CEO',
    title: 'Chief Executive Officer',
    department: 'Executive',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80',
  },
};

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-or-sasson',
    userId: 'or-sasson',
    cycleId: 'cycle-w26',
    status: 'DRAFT',
    completedContent: `> [PR-402] Implemented JWT authorization middleware in Go gateway.
> Resolved Redis caching race condition under heavy load tests.`,
    workingOnContent: `> Connecting Hierarchy Engine to Postgres row-level security policy checks.`,
    blockersContent: `> [CRITICAL] Waiting for DevOps to provision testing instances for WeasyPrint.`,
    plansContent: `> Complete integration testing for Excel/PDF export worker nodes.`,
    version: 1,
    updatedAt: '2026-06-26T10:00:00-07:00',
    jiraReferences: ['PR-402', 'SEC-91'],
    attachments: ['gateway-perf-report.pdf'],
  },
  {
    id: 'rep-alice-smith',
    userId: 'alice-smith',
    cycleId: 'cycle-w26',
    status: 'APPROVED',
    completedContent: `* Refactored multi-parent containment checking routines to run in O(log N) average-time.
* Added cycle prevention logic to block circular organizational loops before writing database transactions.`,
    workingOnContent: `* Running performance diagnostics for the Postgres DFS CTE query used in Org Tree loading.`,
    blockersContent: ``,
    plansContent: `* Prepare DB migration script for the new audit ledger table.`,
    version: 2,
    submittedAt: '2026-06-25T15:30:00-07:00',
    updatedAt: '2026-06-25T16:00:00-07:00',
    jiraReferences: ['REQ-4.1.1', 'DB-92'],
    attachments: [],
    comments: 'Excellent work Alice, the cycle detection algorithm is extremely robust.',
  },
  {
    id: 'rep-bob-jones',
    userId: 'bob-jones',
    cycleId: 'cycle-w26',
    status: 'SUBMITTED',
    completedContent: `* Drafted SAML 2.0 and OIDC single sign-on integration flow parameters.
* Setup automated token expiration check ensuring full re-authentication runs every 12 hours.`,
    workingOnContent: `* Coordinating with IT Identity provider team for test SAML assertions.`,
    blockersContent: `* SSO sandbox credentials delayed by SecOps audit process.`,
    plansContent: `* Implement backend SAML assertion validation handler once credentials land.`,
    version: 1,
    submittedAt: '2026-06-26T11:45:00-07:00',
    updatedAt: '2026-06-26T11:45:00-07:00',
    jiraReferences: ['SEC-88', 'REQ-11.1'],
    attachments: ['sso_handshake_flow.png'],
  },
  // Charlie D has no report -> Status: MISSING (Simulated by absence of report or custom check)
];

export const DEPARTMENT_METRICS: DepartmentMetrics[] = [
  {
    id: 'dept-eng',
    name: 'Engineering',
    complianceRate: 92,
    activeBlockerCount: 3,
    managerName: 'Elena Rostova',
    status: 'WARNING',
  },
  {
    id: 'dept-prod',
    name: 'Product',
    complianceRate: 100,
    activeBlockerCount: 0,
    managerName: 'Marcus Aurelius',
    status: 'OPTIMAL',
  },
  {
    id: 'dept-sales',
    name: 'Sales',
    complianceRate: 64,
    activeBlockerCount: 1,
    managerName: 'Diana Prince',
    status: 'CRITICAL',
  },
  {
    id: 'dept-ops',
    name: 'Operations',
    complianceRate: 80,
    activeBlockerCount: 5,
    managerName: 'Thomas Shelby',
    status: 'WARNING',
  },
];

export const ESCALATED_BLOCKERS: EscalatedBlocker[] = [
  {
    id: 'blk-1',
    department: 'Infrastructure',
    title: 'DevOps provisioning delays',
    description: 'DevOps provisioning delays are slowing downstream consumer application drops. Blocked on testing instance spin-up for WeasyPrint PDF compiler.',
    owner: 'Infrastructure Team',
    daysActive: 6,
    isCritical: true,
  },
  {
    id: 'blk-2',
    department: 'Talent Acquisition',
    title: 'Engineering backfills delayed',
    description: 'Engineering backfills are delayed due to compensation structure adjustments in Q3.',
    owner: 'HR Board',
    daysActive: 14,
    isCritical: false,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'SUCCESS',
    title: 'Report Approved',
    message: "Elena Rostova approved Alice Smith's report for Week 26.",
    timestamp: '2026-06-25T16:00:00-07:00',
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'WARNING',
    title: 'Revision Requested',
    message: 'Elena Rostova requested revision from Or Sasson: "Please provide more details on WeasyPrint..."',
    timestamp: '2026-06-26T08:30:00-07:00',
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'INFO',
    title: 'Cycle Week 26 Active',
    message: 'The reporting window for Week 26 is open and accepting drafts.',
    timestamp: '2026-06-22T08:00:00-07:00',
    isRead: true,
  }
];

