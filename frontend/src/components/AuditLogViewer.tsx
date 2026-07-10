import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Filter } from 'lucide-react';
import { auditApi, AuditLog } from '../api/audit';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const res = await auditApi.list();
      setLogs(res.data);
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((log) =>
    !filter ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(filter.toLowerCase()) ||
    log.actor_id.toLowerCase().includes(filter.toLowerCase())
  );

  const actionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-800';
    if (action.includes('UPDATE') || action.includes('SUBMIT')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('APPROVE')) return 'bg-purple-100 text-purple-800';
    if (action.includes('LOCK')) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-IL', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ts; }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#1e3a8a]" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            System Audit Log
          </h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtered.length} entries
          </span>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1e3a8a] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="px-6 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-sm">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by action, entity, or actor..."
            className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Loading audit logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Shield className="w-8 h-8 mb-3 stroke-1" />
            <p className="text-sm font-medium text-slate-600">No audit logs yet</p>
            <p className="text-xs text-slate-400 mt-1">
              System actions will appear here as users interact with FlowReport
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Actor ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {log.entity_type}
                      <span className="text-slate-400 font-mono ml-1 text-[10px]">
                        {log.entity_id?.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {log.actor_id?.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
