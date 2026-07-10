import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import AuditLogViewer from "./components/AuditLogViewer";
import LoginPage from "./pages/LoginPage";
import { authApi } from "./api/auth";
import { usersApi, BackendUser } from "./api/users";
import { reportsApi } from "./api/reports";
import { metricsApi, DepartmentMetric } from "./api/metrics";
import { notificationsApi, BackendNotification } from "./api/notifications";
import { cyclesApi, ReportCycle } from "./api/cycles";
import { useReport } from "./hooks/useReport";
import { ESCALATED_BLOCKERS } from "./data";
import type { User, Report, DepartmentMetrics, EscalatedBlocker, AppNotification, ReportCycle as FrontendCycle } from "./types";

function backendUserToFrontend(u: BackendUser): User {
  return {
    id: u.id, email: u.email,
    firstName: u.first_name, lastName: u.last_name,
    role: u.role as User["role"],
    title: u.title, department: u.department, managerId: u.manager_id,
  };
}

function backendMetricToFrontend(m: DepartmentMetric): DepartmentMetrics {
  return {
    id: m.id, name: m.name, managerName: m.manager_name,
    complianceRate: m.compliance_rate,
    activeBlockerCount: m.active_blocker_count,
    status: m.status,
  };
}

function backendNotifToFrontend(n: BackendNotification): AppNotification {
  return {
    id: n.id, type: n.type as AppNotification["type"],
    title: n.title, message: n.message,
    timestamp: n.created_at, isRead: !!n.read_at,
  };
}

function backendCycleToFrontend(c: ReportCycle): FrontendCycle {
  return {
    id: c.id, year: c.year, weekNumber: c.week_num,
    startDate: c.starts_at, endDate: c.ends_at,
    submissionDeadline: c.deadline,
    isLocked: c.status === 'LOCKED',
  };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [activePersona, setActivePersona] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"employee" | "manager" | "executive" | "audit">("employee");
  const [deptMetrics, setDeptMetrics] = useState<DepartmentMetrics[]>([]);
  const [blockersList] = useState<EscalatedBlocker[]>(ESCALATED_BLOCKERS);
  const [currentCycle, setCurrentCycle] = useState<FrontendCycle | null>(null);
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("All changes synced");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [managerReports, setManagerReports] = useState<Report[]>([]);

  const { report, loading: reportLoading, save: saveReport, submit: submitReport } = useReport(
    currentView === "employee" ? activePersona?.id : undefined
  );

  useEffect(() => {
    if (authApi.isAuthenticated()) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    usersApi.list().then((res) => {
      const map: Record<string, User> = {};
      res.data.forEach((u) => { map[u.id] = backendUserToFrontend(u); });
      setUsersMap(map);
      const currentUser = authApi.getCurrentUser();
      const persona = currentUser ? map[currentUser.sub] : Object.values(map)[0];
      if (persona) {
        setActivePersona(persona);
        if (persona.role === "EMPLOYEE") setCurrentView("employee");
        else if (persona.role === "MANAGER") setCurrentView("manager");
        else if (persona.role === "CEO") setCurrentView("executive");
      }
    }).catch(console.error);

    notificationsApi.list().then((res) => {
      setNotifications(res.data.map(backendNotifToFrontend));
    }).catch(console.error);

    cyclesApi.current().then((cycle) => {
      setCurrentCycle(backendCycleToFrontend(cycle));
      setCurrentCycleId(cycle.id);
    }).catch(() => {
      setCurrentCycle({ id: 'fallback', year: 2026, weekNumber: 26, startDate: '', endDate: '', submissionDeadline: '', isLocked: false });
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || currentView !== "manager") return;
    reportsApi.list().then((res) => {
      const reports: Report[] = res.data.map((r) => ({
        id: r.id, userId: r.user_id, cycleId: r.cycle_id,
        status: r.status as Report["status"],
        completedContent: r.completed_content,
        workingOnContent: r.working_on_content,
        blockersContent: r.blockers_content,
        plansContent: r.plans_content,
        comments: r.comments, submittedAt: r.submitted_at,
        version: 1, updatedAt: r.updated_at,
      }));
      setManagerReports(reports);
    }).catch(console.error);
  }, [isAuthenticated, currentView]);

  useEffect(() => {
    if (!isAuthenticated || currentView !== "executive") return;
    metricsApi.departments().then((res) => {
      setDeptMetrics(res.data.map(backendMetricToFrontend));
    }).catch(console.error);
  }, [isAuthenticated, currentView]);

  const addNotification = useCallback(async (
    type: "INFO" | "SUCCESS" | "WARNING" | "ALERT",
    title: string, message: string
  ) => {
    try {
      const created = await notificationsApi.create(type, title, message);
      setNotifications((prev) => [backendNotifToFrontend(created), ...prev]);
    } catch {
      setNotifications((prev) => [{
        id: `local-${Date.now()}`, type, title, message,
        timestamp: new Date().toISOString(), isRead: false,
      }, ...prev]);
    }
  }, []);

  const handleLoginSuccess = () => setIsAuthenticated(true);

  const handlePersonaChange = (userId: string) => {
    const selected = usersMap[userId];
    if (!selected) return;
    setActivePersona(selected);
    if (selected.role === "EMPLOYEE") setCurrentView("employee");
    else if (selected.role === "MANAGER") setCurrentView("manager");
    else if (selected.role === "CEO") setCurrentView("executive");
  };

  const handleSaveReport = async (updatedReport: Report) => {
    setSaveStatus("Saving...");
    try {
      await saveReport({
        completed_content: updatedReport.completedContent,
        working_on_content: updatedReport.workingOnContent,
        blockers_content: updatedReport.blockersContent,
        plans_content: updatedReport.plansContent,
      });
      setSaveStatus("All changes synced");
    } catch { setSaveStatus("Save failed"); }
  };

  const handleSubmitReport = async () => {
    try {
      await submitReport();
      await addNotification("SUCCESS", "Report Submitted", "Your weekly report has been submitted.");
      setSaveStatus("Report submitted");
    } catch (e: any) {
      await addNotification("ALERT", "Submit Failed", e.message);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await reportsApi.approve(reportId);
      setManagerReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "APPROVED" as const } : r));
      await addNotification("SUCCESS", "Report Approved", "Report has been approved.");
    } catch (e: any) {
      await addNotification("ALERT", "Approve Failed", e.message);
    }
  };

  const handleRequestRevision = async (reportId: string, comments: string) => {
    try {
      await reportsApi.update(reportId, { comments });
      setManagerReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "REVISION_REQUESTED" as const, comments } : r));
      await addNotification("WARNING", "Revision Requested", "Revision requested.");
    } catch (e: any) {
      await addNotification("ALERT", "Failed", e.message);
    }
  };

  const handleLockWindow = async () => {
    if (!currentCycleId || !currentCycle) return;
    try {
      if (currentCycle.isLocked) {
        const updated = await cyclesApi.unlock(currentCycleId);
        setCurrentCycle(backendCycleToFrontend(updated));
        await addNotification("INFO", "Window Unlocked", "Reporting window is now open.");
      } else {
        const updated = await cyclesApi.lock(currentCycleId);
        setCurrentCycle(backendCycleToFrontend(updated));
        await addNotification("ALERT", "Window Locked", "Reporting window is now locked.");
      }
    } catch (e: any) {
      await addNotification("ALERT", "Failed", e.message);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try { await notificationsApi.markRead(id); } catch {}
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    try { await notificationsApi.markAllRead(); } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = async () => {
    try { await notificationsApi.clear(); } catch {}
    setNotifications([]);
  };

  const getFrontendReport = (): Report | null => {
    if (!report || !activePersona) return null;
    return {
      id: report.id, userId: report.user_id, cycleId: report.cycle_id,
      status: report.status as Report["status"],
      completedContent: report.completed_content,
      workingOnContent: report.working_on_content,
      blockersContent: report.blockers_content,
      plansContent: report.plans_content,
      comments: report.comments, submittedAt: report.submitted_at,
      version: 1, updatedAt: report.updated_at,
    };
  };

  const displayCycle = currentCycle ?? {
    id: '', year: 2026, weekNumber: 26,
    startDate: '', endDate: '', submissionDeadline: '', isLocked: false,
  };

  if (!isAuthenticated) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (!activePersona) return <div className="flex h-screen items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased overflow-hidden select-none">
      <Sidebar
        currentView={currentView as any}
        onViewChange={(v) => setCurrentView(v as any)}
        activePersona={activePersona}
        onPersonaChange={handlePersonaChange}
        allPersonas={usersMap}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          currentView={currentView as any}
          activePersona={activePersona}
          currentCycle={displayCycle}
          saveStatus={saveStatus}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === "employee" && (
            reportLoading
              ? <div className="flex h-full items-center justify-center text-slate-400">Loading report...</div>
              : <EmployeeDashboard
                  report={getFrontendReport()!}
                  onSaveReport={handleSaveReport}
                  onSubmitReport={handleSubmitReport}
                  activePersona={activePersona}
                  manager={usersMap[activePersona.managerId || ""]}
                />
          )}
          {currentView === "manager" && (
            <ManagerDashboard
              reports={managerReports}
              allPersonas={usersMap}
              onApproveReport={handleApproveReport}
              onRequestRevision={handleRequestRevision}
            />
          )}
          {currentView === "executive" && (
            <ExecutiveDashboard
              departmentMetrics={deptMetrics}
              escalatedBlockers={blockersList}
              onLockWindow={handleLockWindow}
              isLocked={displayCycle.isLocked}
            />
          )}
          {currentView === "audit" && <AuditLogViewer />}
        </main>
      </div>
    </div>
  );
}
