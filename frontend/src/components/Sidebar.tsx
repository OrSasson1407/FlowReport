import { FileText, ClipboardList, TrendingUp, UserCheck, Shield, History } from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  currentView: 'employee' | 'manager' | 'executive' | 'audit' | 'history';
  onViewChange: (view: 'employee' | 'manager' | 'executive' | 'audit' | 'history') => void;
  activePersona: User;
  onPersonaChange: (userId: string) => void;
  allPersonas: Record<string, User>;
}

export default function Sidebar({
  currentView, onViewChange, activePersona, onPersonaChange, allPersonas,
}: SidebarProps) {

  const tabs = [
    { id: 'employee' as const, label: 'Employee Dashboard', description: 'Drafting & Submission', icon: FileText, roles: ['EMPLOYEE', 'MANAGER', 'CEO'] },
    { id: 'manager' as const, label: 'Manager Review Queue', description: 'Team Synthesis & Revisions', icon: ClipboardList, roles: ['MANAGER', 'CEO'] },
    { id: 'executive' as const, label: 'Executive Command Center', description: 'Macro Heatmaps & Compliance', icon: TrendingUp, roles: ['CEO', 'MANAGER'] },
    { id: 'audit' as const, label: 'Audit Log', description: 'System Activity Feed', icon: Shield, roles: ['CEO', 'ADMIN'] },
    { id: 'history' as const, label: 'Cycle History', description: 'Multi-week Compliance', icon: History, roles: ['CEO', 'ADMIN'] },
  ];

  const visibleTabs = tabs.filter((t) => t.roles.includes(activePersona.role));

  const roleLabel = (role: string) => {
    if (role === 'CEO') return 'Executive';
    if (role === 'MANAGER') return 'Manager';
    return 'Employee';
  };

  return (
    <aside id="flowreport-sidebar" className="w-68 bg-white border-r border-slate-200 flex flex-col justify-between h-full shrink-0">
      <div className="p-5 flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white font-bold text-lg tracking-wider">F</div>
          <div>
            <h1 className="text-base font-semibold text-[#0f172a] tracking-tight flex items-center gap-1.5">
              FlowReport
              <span className="text-[10px] bg-blue-50 text-[#1e3a8a] px-1.5 py-0.5 rounded font-medium border border-blue-100">BETA</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Hierarchical Distillation</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase px-2 mb-1">Core Modules</p>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = currentView === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => onViewChange(tab.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 relative ${
                  isSelected ? 'bg-blue-50/50 text-[#1e3a8a]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]'
                }`}
              >
                {isSelected && <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#1e3a8a]" />}
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#1e3a8a]' : 'text-slate-400'}`} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold tracking-tight">{tab.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal leading-normal mt-0.5">{tab.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase px-2 mb-1">Team Members</p>
          {Object.values(allPersonas).map((user) => {
            const isActive = user.id === activePersona.id;
            return (
              <button
                key={user.id}
                onClick={() => onPersonaChange(user.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                  isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                  user.role === 'CEO' ? 'bg-purple-500' : user.role === 'MANAGER' ? 'bg-blue-500' : 'bg-slate-400'
                }`}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate leading-none mb-0.5">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">{roleLabel(user.role)}</span>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/75 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 px-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>ACTIVE ACCOUNT</span>
        </div>
        <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
            activePersona.role === 'CEO' ? 'bg-purple-500' : activePersona.role === 'MANAGER' ? 'bg-blue-500' : 'bg-slate-400'
          }`}>
            {activePersona.firstName[0]}{activePersona.lastName[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-800 truncate leading-none mb-1">
              {activePersona.firstName} {activePersona.lastName}
            </span>
            <span className="text-[10px] text-[#1e3a8a] font-medium leading-none truncate uppercase tracking-wider">
              {activePersona.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

