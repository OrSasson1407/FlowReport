import React, { useState, useEffect } from 'react';
import { Save, Send, Paperclip, Plus, Trash2, HelpCircle, FileCheck, CheckCircle2, AlertTriangle, Eye, Edit3 } from 'lucide-react';
import { Report, User } from '../types';

interface EmployeeDashboardProps {
  report: Report;
  onSaveReport: (updatedReport: Report) => void;
  onSubmitReport: (reportId: string) => void;
  activePersona: User;
  manager: User;
}

export default function EmployeeDashboard({
  report,
  onSaveReport,
  onSubmitReport,
  activePersona,
  manager,
}: EmployeeDashboardProps) {
  // Local editable states
  const [completed, setCompleted] = useState(report.completedContent);
  const [workingOn, setWorkingOn] = useState(report.workingOnContent);
  const [blockers, setBlockers] = useState(report.blockersContent);
  const [plans, setPlans] = useState(report.plansContent);

  // Jira & Attachment states
  const [jiraRefs, setJiraRefs] = useState<string[]>(report.jiraReferences || []);
  const [newJira, setNewJira] = useState('');
  const [attachments, setAttachments] = useState<string[]>(report.attachments || []);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-save feedback state
  const [autosaveMessage, setAutosaveMessage] = useState('All changes synced');
  const [isEditing, setIsEditing] = useState(true); // Toggle between Edit and Preview markdown

  // Synchronize local states when report prop changes (e.g. if we switch personas)
  useEffect(() => {
    setCompleted(report.completedContent);
    setWorkingOn(report.workingOnContent);
    setBlockers(report.blockersContent || '');
    setPlans(report.plansContent);
    setJiraRefs(report.jiraReferences || []);
    setAttachments(report.attachments || []);
  }, [report]);

  // Simulated Autosave loop (every 15 seconds of typing activity)
  useEffect(() => {
    const handleAutosave = () => {
      setAutosaveMessage('Autosaving draft...');
      setTimeout(() => {
        onSaveReport({
          ...report,
          completedContent: completed,
          workingOnContent: workingOn,
          blockersContent: blockers,
          plansContent: plans,
          jiraReferences: jiraRefs,
          attachments: attachments,
          updatedAt: new Date().toISOString(),
        });
        setAutosaveMessage('Auto-saved to draft (local cache)');
      }, 800);
    };

    const delayDebounce = setTimeout(() => {
      if (
        completed !== report.completedContent ||
        workingOn !== report.workingOnContent ||
        blockers !== report.blockersContent ||
        plans !== report.plansContent ||
        jiraRefs.length !== (report.jiraReferences?.length || 0) ||
        attachments.length !== (report.attachments?.length || 0)
      ) {
        handleAutosave();
      }
    }, 2500);

    return () => clearTimeout(delayDebounce);
  }, [completed, workingOn, blockers, plans, jiraRefs, attachments]);

  // Manual save handler
  const handleManualSave = () => {
    setAutosaveMessage('Saving changes...');
    onSaveReport({
      ...report,
      completedContent: completed,
      workingOnContent: workingOn,
      blockersContent: blockers,
      plansContent: plans,
      jiraReferences: jiraRefs,
      attachments: attachments,
      updatedAt: new Date().toISOString(),
    });
    setTimeout(() => {
      setAutosaveMessage('Draft manually saved');
    }, 600);
  };

  // Add Jira Ticket Reference
  const handleAddJira = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJira.trim()) return;
    const cleanJira = newJira.trim().toUpperCase();
    if (!jiraRefs.includes(cleanJira)) {
      const updated = [...jiraRefs, cleanJira];
      setJiraRefs(updated);
    }
    setNewJira('');
  };

  // Remove Jira reference
  const handleRemoveJira = (ticket: string) => {
    setJiraRefs(jiraRefs.filter((ref) => ref !== ticket));
  };

  // Simulate File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setTimeout(() => {
      setAttachments([...attachments, file.name]);
      setIsUploading(false);
      setAutosaveMessage(`Attached ${file.name}`);
    }, 1200);
  };

  // Remove Attachment
  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(attachments.filter((file) => file !== fileName));
  };

  // Helper to parse markdown-like lists into beautiful components
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) return <p className="text-slate-400 italic text-xs">No content added yet.</p>;
    
    return (
      <div className="space-y-2">
        {text.split('\n').map((line, index) => {
          let cleanLine = line.trim();
          if (cleanLine.startsWith('>') || cleanLine.startsWith('*') || cleanLine.startsWith('-')) {
            cleanLine = cleanLine.substring(1).trim();
          }
          // Simple Jira highlighter
          const jiraPattern = /\[([A-Z]+-\d+)\]/g;
          const hasJira = jiraPattern.test(cleanLine);
          
          return (
            <div key={index} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
              <span className="text-[#1e3a8a] mt-1 font-bold shrink-0">•</span>
              <span>
                {hasJira ? (
                  cleanLine.split(jiraPattern).map((part, i) => {
                    if (i % 2 === 1) {
                      return (
                        <span key={i} className="bg-blue-50 text-[#1e3a8a] border border-blue-200/50 rounded px-1 py-0.25 font-mono text-[11px] font-semibold select-all mx-0.5">
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })
                ) : (
                  cleanLine
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="employee-dashboard-viewport" className="flex-1 flex flex-col overflow-y-auto p-6 bg-[#f8fafc]">
      
      {/* Top Warning Banner if report was rejected */}
      {report.status === 'REVISION_REQUESTED' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-red-800">Revision Requested by Elena Rostova</h3>
            <p className="text-xs text-red-700 mt-1">
              "Elena: {report.comments || 'Please provide more details on WeasyPrint dependencies and testing coverage.'}"
            </p>
          </div>
        </div>
      )}

      {/* Top Confirmation Banner if report is submitted */}
      {report.status === 'APPROVED' && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-emerald-800">Report Approved and Locked</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Your weekly report has been reviewed and approved by {manager.firstName} {manager.lastName}. Changes are now locked.
            </p>
          </div>
        </div>
      )}

      {report.status === 'SUBMITTED' && (
        <div className="mb-6 bg-blue-50 border-l-4 border-[#1e3a8a] rounded-r-lg p-4 flex gap-3">
          <FileCheck className="w-5 h-5 text-[#1e3a8a] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-blue-800">Status: Awaiting Manager Review</h3>
            <p className="text-xs text-blue-700 mt-1">
              Your report was successfully submitted on {report.submittedAt ? new Date(report.submittedAt).toLocaleTimeString() : 'time'}. It is currently queued for {manager.firstName}'s synthesis.
            </p>
          </div>
        </div>
      )}

      {/* Main Drafting Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3): The Drafting Editor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Editor Card Header & Toggle */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">WEEKLY LOG DRAFT</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  report.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
                  report.status === 'REVISION_REQUESTED' ? 'bg-red-100 text-red-800' :
                  report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {report.status}
                </span>
              </div>
              
              {/* Edit/Preview Toggle */}
              <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white">
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${
                    isEditing ? 'bg-slate-100 text-[#1e3a8a]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${
                    !isEditing ? 'bg-slate-100 text-[#1e3a8a]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Editor Input Form */}
            {isEditing ? (
              <div className="p-5 flex flex-col gap-5">
                {/* Bucket 1: Completed */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="completed-input" className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      1. Completed Work
                    </label>
                    <span className="text-[10px] text-slate-400">What did you deliver this week?</span>
                  </div>
                  <textarea
                    id="completed-input"
                    value={completed}
                    disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                    onChange={(e) => setCompleted(e.target.value)}
                    placeholder="e.g. > [PR-402] Implemented JWT authorization middleware in Go gateway.&#10;> Resolved Redis caching race condition under heavy load tests."
                    className="w-full h-24 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:bg-white transition-all disabled:opacity-65"
                  />
                </div>

                {/* Bucket 2: Working On */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="working-input" className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      2. Working On
                    </label>
                    <span className="text-[10px] text-slate-400">Current active areas of focus</span>
                  </div>
                  <textarea
                    id="working-input"
                    value={workingOn}
                    disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                    onChange={(e) => setWorkingOn(e.target.value)}
                    placeholder="e.g. > Connecting Hierarchy Engine to Postgres row-level security policy checks."
                    className="w-full h-24 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:bg-white transition-all disabled:opacity-65"
                  />
                </div>

                {/* Bucket 3: Blockers */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="blockers-input" className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      3. Blockers
                    </label>
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      What is holding you up?
                    </span>
                  </div>
                  <textarea
                    id="blockers-input"
                    value={blockers}
                    disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="e.g. > [CRITICAL] Waiting for DevOps to provision testing instances for WeasyPrint."
                    className="w-full h-20 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:bg-white transition-all disabled:opacity-65"
                  />
                </div>

                {/* Bucket 4: Plans */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="plans-input" className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      4. Plans
                    </label>
                    <span className="text-[10px] text-slate-400">Next week objectives</span>
                  </div>
                  <textarea
                    id="plans-input"
                    value={plans}
                    disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                    onChange={(e) => setPlans(e.target.value)}
                    placeholder="e.g. > Complete integration testing for Excel/PDF export worker nodes."
                    className="w-full h-20 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:bg-white transition-all disabled:opacity-65"
                  />
                </div>
              </div>
            ) : (
              /* High-fidelity executive compiled preview */
              <div className="p-6 bg-slate-50/20 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. COMPLETED WORK</h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-150 shadow-2xs">
                    {renderMarkdownPreview(completed)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. WORKING ON</h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-150 shadow-2xs">
                    {renderMarkdownPreview(workingOn)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. BLOCKERS & IMPEDIMENTS</h4>
                  <div className={`p-4 rounded-lg border shadow-2xs ${blockers.trim() ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-150'}`}>
                    {renderMarkdownPreview(blockers)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">4. FUTURE PLANS</h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-150 shadow-2xs">
                    {renderMarkdownPreview(plans)}
                  </div>
                </div>
              </div>
            )}

            {/* Core Action Footer Bar */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-medium">
                  {autosaveMessage}
                </span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSubmitReport(report.id)}
                  disabled={report.status === 'APPROVED' || report.status === 'SUBMITTED'}
                  className="flex items-center gap-1.5 bg-[#1e3a8a] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Weekly Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): References, Attachments, and Metadata */}
        <div className="flex flex-col gap-6">
          
          {/* FlowReport Rules card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1e3a8a]" />
              <span>Reporting Protocol</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5 items-start">
                <span className="text-[10px] bg-[#1e3a8a] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Complete the 4 Buckets</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Do not leave mandatory fields empty. Use bullet symbols (<code className="font-mono text-slate-800 bg-slate-100 rounded px-0.5">&gt;</code>) to structure text.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="text-[10px] bg-[#1e3a8a] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Add JIRA/SEC Keys</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Always link your active tickets in square brackets (e.g., <code className="font-mono text-[#1e3a8a] bg-blue-50 rounded px-0.5">[PR-402]</code>) for cross-linking.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="text-[10px] bg-[#1e3a8a] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Review Hierarchy Flow</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Once submitted, Elena (Manager) will review. Approved updates are automatically rolled up to the CEO on Monday.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* JIRA Reference Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-2.5">
              JIRA/PR REFERENCES
            </h3>

            {/* List of references */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {jiraRefs.length > 0 ? (
                jiraRefs.map((ref) => (
                  <span key={ref} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200/50 text-[#1e3a8a] font-mono text-[11px] font-bold px-2 py-0.75 rounded">
                    {ref}
                    {report.status !== 'APPROVED' && report.status !== 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveJira(ref)}
                        className="hover:bg-blue-100 text-[#1e3a8a] p-0.5 rounded ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No linked tickets yet</span>
              )}
            </div>

            {/* Input field to add reference */}
            {report.status !== 'APPROVED' && report.status !== 'SUBMITTED' && (
              <form onSubmit={handleAddJira} className="flex gap-2">
                <label htmlFor="new-jira-input" className="sr-only">New Jira reference</label>
                <input
                  id="new-jira-input"
                  type="text"
                  value={newJira}
                  onChange={(e) => setNewJira(e.target.value)}
                  placeholder="e.g. PR-402, ENG-99"
                  className="flex-1 bg-slate-50/50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:bg-white"
                />
                <button
                  type="submit"
                  className="bg-slate-100 hover:bg-slate-200 text-[#1e3a8a] p-1.5 rounded border border-slate-200 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Secure File Attachments Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                ATTACHMENTS
              </h3>
              <span className="text-[10px] text-slate-400">Max 50MB</span>
            </div>

            {/* File List */}
            <div className="flex flex-col gap-1.5">
              {attachments.length > 0 ? (
                attachments.map((file) => (
                  <div key={file} className="flex items-center justify-between bg-slate-50 px-2.5 py-2 rounded border border-slate-150">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-600 truncate">{file}</span>
                    </div>
                    {report.status !== 'APPROVED' && report.status !== 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">
                  No reference files attached
                </div>
              )}
            </div>

            {/* Simulated file selector */}
            {report.status !== 'APPROVED' && report.status !== 'SUBMITTED' && (
              <div className="flex flex-col gap-2">
                <label className="border border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-[#3b82f6] hover:bg-slate-50/50 transition-all">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-600">
                      {isUploading ? 'Uploading to secure S3...' : 'Select or drop files'}
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Org context of submission */}
          <div className="bg-slate-100/50 rounded-xl border border-slate-200 p-4.5 text-xs text-slate-600 flex flex-col gap-2">
            <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              Hierarchy Routing Info
            </span>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Hard-Line Manager:</span>
              <span className="font-semibold text-slate-700">{manager.firstName} {manager.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department Node:</span>
              <span className="font-semibold text-[#1e3a8a]">{activePersona.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Compliance Deadline:</span>
              <span className="font-semibold text-slate-700">Friday, 5:00 PM PST</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
