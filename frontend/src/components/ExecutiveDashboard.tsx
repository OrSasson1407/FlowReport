import React, { useState } from 'react';
import { TrendingUp, AlertOctagon, Download, Lock, ShieldAlert, Mail, Layers, ExternalLink, Calendar, Users, BarChart3, Clock } from 'lucide-react';
import { DepartmentMetrics, EscalatedBlocker } from '../types';

interface ExecutiveDashboardProps {
  departmentMetrics: DepartmentMetrics[];
  escalatedBlockers: EscalatedBlocker[];
  onLockWindow: () => void;
  isLocked: boolean;
}

export default function ExecutiveDashboard({
  departmentMetrics,
  escalatedBlockers,
  onLockWindow,
  isLocked,
}: ExecutiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'blockers' | 'compliance'>('overview');
  const [forceReminderSent, setForceReminderSent] = useState<string | null>(null);


  // Overall calculations
  const totalDepartments = departmentMetrics.length;
  const avgCompliance = Math.round(
    totalDepartments > 0 ? departmentMetrics.reduce((acc, curr) => acc + curr.complianceRate, 0) / totalDepartments : 0
  );
  const totalActiveBlockers = departmentMetrics.reduce((acc, curr) => acc + curr.activeBlockerCount, 0);

  const handleSendReminder = (deptName: string) => {
    setForceReminderSent(deptName);
    setTimeout(() => {
      setForceReminderSent(null);
    }, 5000);
  };

  return (
    <div id="executive-dashboard-viewport" className="flex-1 flex flex-col overflow-y-auto p-6 bg-[#f8fafc]">
      
      {/* Top Force Reminder Alert (Simulated Toast) */}
      {forceReminderSent && (
        <div className="mb-6 bg-slate-900 text-white rounded-lg px-4 py-3 shadow-md flex items-center justify-between border border-slate-800 animate-slide-in">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-400">REMINDER FORCED:</span>
            <span>Slack Application Block Kit payload dispatched to manager of <strong>{forceReminderSent}</strong>.</span>
          </div>
          <button
            onClick={() => setForceReminderSent(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: High-level KPI Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KPI 1: Overall Company Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall compliance (Week 26)</span>
            <span className="text-3xl font-black text-[#1e3a8a] tracking-tight">{avgCompliance}%</span>
            <span className="text-[11px] text-slate-500 font-medium">94% Target reached</span>
          </div>
          {/* Radial progress ring or bar chart */}
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" className="stroke-slate-100 fill-none" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-[#1e3a8a] fill-none"
                strokeWidth="5"
                strokeDasharray={163.3}
                strokeDashoffset={163.3 - (163.3 * avgCompliance) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-600">{avgCompliance}%</span>
          </div>
        </div>

        {/* KPI 2: Critical Escalated Blockers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalated Blockers</span>
            <span className="text-3xl font-black text-red-600 tracking-tight">{escalatedBlockers.length}</span>
            <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Immediate action recommended
            </span>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shrink-0">
            <AlertOctagon className="w-6 h-6 stroke-2" />
          </div>
        </div>

        {/* KPI 3: Company Health Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active reporting window</span>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              {isLocked ? 'REPORTING WINDOW LOCKED' : 'ACCEPTING SUBMISSIONS'}
            </span>
            <span className="text-[11px] text-slate-500">
              {isLocked ? 'Closed automatically on Friday 17:00' : 'Closes on Friday at 5:00 PM PST'}
            </span>
          </div>
          <button
            onClick={onLockWindow}
            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isLocked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-5 h-5 stroke-2" />
          </button>
        </div>

      </div>

      {/* Grid: Main metrics tables and Escalated Blockers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3): Department Metrics & Comparison Vectors */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Department breakdown card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Departmental status breakdown</h3>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">Week 26 Compliance List</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="py-2.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="py-2.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporting Manager</th>
                    <th className="py-2.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance</th>
                    <th className="py-2.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Blockers</th>
                    <th className="py-2.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {departmentMetrics.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/40">
                      
                      {/* Department Name */}
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {dept.name}
                      </td>

                      {/* Manager Name */}
                      <td className="py-3.5 px-5 text-slate-600">
                        {dept.managerName}
                      </td>

                      {/* Compliance Rate Bar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dept.complianceRate >= 90 ? 'bg-emerald-500' :
                                dept.complianceRate >= 75 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${dept.complianceRate}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{dept.complianceRate}%</span>
                        </div>
                      </td>

                      {/* Blockers indicator */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          dept.activeBlockerCount === 0 
                            ? 'bg-slate-100 text-slate-500' 
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {dept.activeBlockerCount} {dept.activeBlockerCount === 1 ? 'Blocker' : 'Blockers'}
                        </span>
                      </td>

                      {/* Review synthesis or force reminder */}
                      <td className="py-3.5 px-5 text-right">
                        {dept.complianceRate < 80 ? (
                          <button
                            onClick={() => handleSendReminder(dept.name)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                          >
                            Send Force Reminder
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Compliant</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departmental trend comparison vectors (Interactive Chart Simulation) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trend analysis: Compliance by department</h3>
              <span className="text-[10px] text-slate-400">Quarter-over-Quarter comparison</span>
            </div>

            <div className="space-y-4">
              {departmentMetrics.map(dept => (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dept.name}</span>
                    <span className="text-slate-500 font-mono">Current: {dept.complianceRate}% / Previous: 85%</span>
                  </div>
                  <div className="h-6 w-full relative flex items-center">
                    {/* Previous Quarter Bar */}
                    <div className="absolute top-0 bottom-0 left-0 bg-slate-100 rounded h-2.5 w-full max-w-[85%] mt-1.5 opacity-60" title="Previous Quarter: 85%" />
                    {/* Current Quarter Bar */}
                    <div className={`absolute top-0 bottom-0 left-0 rounded h-2.5 mt-1.5 transition-all duration-500 ${
                      dept.complianceRate >= 90 ? 'bg-[#1e3a8a]' : 'bg-[#3b82f6]'
                    }`} style={{ width: `${dept.complianceRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1/3): Escalated Critical Blockers Matrix & Export Utilities */}
        <div className="flex flex-col gap-6">
          
          {/* Critical escalated blockers Matrix */}
          <div className="bg-white rounded-xl border border-[#cbd5e1] p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-red-600 animate-pulse" />
              <span className="text-red-700">CRITICAL ESCALATED BLOCKERS</span>
            </h3>

            <div className="flex flex-col gap-4">
              {escalatedBlockers.map((blocker) => (
                <div key={blocker.id} className="p-3.5 bg-red-50/30 border border-red-100 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                      {blocker.department}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Active {blocker.daysActive} days
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{blocker.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">{blocker.description}</p>
                  <div className="flex justify-between items-center mt-1 border-t border-red-500/10 pt-2 text-[10px] text-slate-500">
                    <span>Owner: <strong>{blocker.owner}</strong></span>
                    <span className="text-red-600 font-bold uppercase tracking-wider">Critical</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export utilities card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-2.5">
              Data portability & Exports
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-normal">
              FlowReport supports structured CSS Paged Media exports and analytical Excel templates containing conditional color rules for stakeholders.
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <button
                disabled
                title="Export is not implemented yet"
                className="w-full bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Global Company Report (PDF)</span>
                <span className="text-[9px] uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Coming soon</span>
              </button>

              <button
                disabled
                title="Export is not implemented yet"
                className="w-full bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel Metric Database (XLSX)</span>
                <span className="text-[9px] uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Coming soon</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

