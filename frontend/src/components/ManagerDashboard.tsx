import { useState } from 'react';
import { Users, Check, AlertCircle, ArrowRight, Eye, Send, Sparkles } from 'lucide-react';
import type { Report, User, ReportStatus } from '../types';

interface ManagerDashboardProps {
  reports: Report[];
  allPersonas: Record<string, User>;
  onApproveReport: (reportId: string) => void;
  onRequestRevision: (reportId: string, comments: string) => void;
}

export default function ManagerDashboard({
  reports,
  allPersonas,
  onApproveReport,
  onRequestRevision,
}: ManagerDashboardProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [managerSummary, setManagerSummary] = useState('');
  const [isSummarySubmitted, setIsSummarySubmitted] = useState(false);

  // Use real allPersonas — filter to employees and managers only (not CEO)
  const teamMembers = Object.values(allPersonas).filter(
    (u) => u.role === 'EMPLOYEE' || u.role === 'MANAGER'
  );

  // Match each team member to their report
  const teamReports = teamMembers.map((user) => {
    const report = reports.find((r) => r.userId === user.id);
    return { userId: user.id, user, report };
  });

  const totalCount = teamReports.length;
  const submittedCount = teamReports.filter(
    (tr) => tr.report && (tr.report.status === 'SUBMITTED' || tr.report.status === 'APPROVED')
  ).length;
  const compliancePercentage = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  const selectedReportObj = teamReports.find((tr) => tr.report?.id === selectedReportId);

  const handleApprove = (reportId: string) => {
    onApproveReport(reportId);
    setShowRevisionForm(false);
    setRevisionComment('');
  };

  const handleReject = (e: React.FormEvent, reportId: string) => {
    e.preventDefault();
    if (!revisionComment.trim()) return;
    onRequestRevision(reportId, revisionComment);
    setShowRevisionForm(false);
    setRevisionComment('');
  };

  const handleAutoSynthesize = () => {
    const blockers = teamReports
      .filter((tr) => tr.report?.blockersContent?.trim())
      .map((tr) => `* [${tr.user.firstName} ${tr.user.lastName}]: ${tr.report?.blockersContent?.trim()}`)
      .join('\n');
    setManagerSummary(
      `Synthesized Blockers:\n${blockers || '* No critical blockers reported.'}\n\nTeam compliance: ${compliancePercentage}%`
    );
  };

  const getStatusColor = (status: ReportStatus | 'MISSING') => {
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'SUBMITTED') return 'bg-blue-100 text-blue-800';
    if (status === 'REVISION_REQUESTED') return 'bg-red-100 text-red-800';
    if (status === 'DRAFT') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div id="manager-dashboard-viewport" className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
      {/* Stats bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1e3a8a]" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Team Submissions Queue</h2>
          </div>
          <span className="text-slate-300">|</span>
          <div className="text-xs text-slate-600 font-medium">
            Status:{' '}
            <span className="font-bold text-[#1e3a8a]">
              {submittedCount} of {totalCount} Submitted
            </span>{' '}
            ({compliancePercentage}% compliance)
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Queue */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 border-r border-slate-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TEAM MEMBER SUBMISSIONS</span>
              <span className="text-[11px] text-slate-400 font-medium">Cycle: Week 26</span>
            </div>

            <div className="divide-y divide-slate-100">
              {teamReports.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No team members found.</div>
              ) : (
                teamReports.map(({ userId, user, report }) => {
                  const displayStatus: ReportStatus | 'MISSING' = report ? report.status : 'MISSING';
                  return (
                    <div
                      key={userId}
                      className={`p-4 flex items-center justify-between transition-all hover:bg-slate-50/50 ${
                        selectedReportId === report?.id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          user.role === 'MANAGER' ? 'bg-blue-500' : 'bg-slate-400'
                        }`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500">{user.title}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${getStatusColor(displayStatus)}`}>
                        {displayStatus}
                      </span>

                      <div>
                        {report ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReportId(report.id)}
                            className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                              report.status === 'SUBMITTED'
                                ? 'bg-[#1e3a8a] text-white border-transparent'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {report.status === 'SUBMITTED' ? (
                              <><span>Review</span><ArrowRight className="w-3.5 h-3.5" /></>
                            ) : (
                              <><Eye className="w-3.5 h-3.5 text-slate-400" /><span>View</span></>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50">
                            Not started
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Manager Summary Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">ROLLUP SUMMARY</span>
              <button
                type="button"
                onClick={handleAutoSynthesize}
                className="text-[11px] font-semibold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200/40 flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Synthesize</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <label htmlFor="manager-summary-text" className="sr-only">Manager Summary</label>
              <textarea
                id="manager-summary-text"
                value={managerSummary}
                onChange={(e) => setManagerSummary(e.target.value)}
                placeholder="Write your unified team rollup narrative here..."
                className="w-full h-32 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  {isSummarySubmitted ? '✓ Submitted' : 'Draft — unsaved'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSummarySubmitted(true)}
                  className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Rollup</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Report Reviewer */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
          {selectedReportObj ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-400 flex items-center justify-center text-white text-xs font-bold">
                    {selectedReportObj.user.firstName[0]}{selectedReportObj.user.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      {selectedReportObj.user.firstName} {selectedReportObj.user.lastName}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                      {selectedReportObj.report?.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded border border-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {[
                  { label: '1. COMPLETED WORK', content: selectedReportObj.report?.completedContent },
                  { label: '2. CURRENT FOCUS', content: selectedReportObj.report?.workingOnContent },
                  { label: '3. BLOCKERS', content: selectedReportObj.report?.blockersContent },
                  { label: '4. FUTURE PLANS', content: selectedReportObj.report?.plansContent },
                ].map(({ label, content }) => (
                  <div key={label} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs font-mono text-slate-700 whitespace-pre-wrap">
                      {content || 'No content entered'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                {selectedReportObj.report?.status === 'SUBMITTED' || selectedReportObj.report?.status === 'REVISION_REQUESTED' ? (
                  !showRevisionForm ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedReportObj.report!.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRevisionForm(true)}
                        className="flex-1 bg-white hover:bg-slate-50 text-red-600 border border-red-200/60 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Revision</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleReject(e, selectedReportObj.report!.id)} className="flex flex-col gap-2.5">
                      <label htmlFor="reject-comment" className="text-[10px] font-bold text-red-700 uppercase tracking-wide">
                        REVISION NOTES
                      </label>
                      <input
                        id="reject-comment"
                        type="text"
                        value={revisionComment}
                        onChange={(e) => setRevisionComment(e.target.value)}
                        placeholder="e.g. Please clarify the scope of changes."
                        required
                        className="bg-white border border-red-200/80 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded transition-all">
                          Submit Request
                        </button>
                        <button type="button" onClick={() => setShowRevisionForm(false)} className="text-xs text-slate-500 px-3 py-2 rounded border border-slate-200">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <div className="text-center p-2.5 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Report approved and compiled.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Users className="w-8 h-8 mb-3 stroke-1" />
              <p className="text-xs font-bold text-slate-600">Select a Report to Review</p>
              <p className="text-[11px] text-slate-400 leading-normal max-w-xs mt-1">
                Choose an employee from the queue to review their report and approve or request changes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
