import { useState, useEffect } from 'react';
import { History, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { metricsApi, CycleHistoryItem } from '../api/metrics';

export default function CycleHistory() {
  const [cycles, setCycles] = useState<CycleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const res = await metricsApi.cycleHistory();
      setCycles(res.data || []);
    } catch (e) {
      console.error('Failed to fetch cycle history', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const statusColor = (status: string) => {
    if (status === 'OPEN') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status === 'LOCKED') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const complianceColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const complianceBg = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrend = (index: number) => {
    if (index >= cycles.length - 1) return null;
    const current = cycles[index].compliance_rate;
    const previous = cycles[index + 1].compliance_rate;
    if (current > previous + 5) return 'up';
    if (current < previous - 5) return 'down';
    return 'flat';
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-[#1e3a8a]" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Cycle History
          </h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {cycles.length} cycles
          </span>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1e3a8a] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Loading cycle history...
          </div>
        ) : cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <History className="w-8 h-8 mb-3 stroke-1" />
            <p className="text-sm font-medium text-slatenet-600">No cycles yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Report cycles will appear here once created
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Cycles</p>
                <p className="text-2xl font-bold text-slate-800">{cycles.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Compliance</p>
                <p className={`text-2xl font-bold ${complianceColor(
                  cycles.reduce((a, c) => a + c.compliance_rate, 0) / cycles.length
                )}`}>
                  {Math.round(cycles.reduce((a, c) => a + c.compliance_rate, 0) / cycles.length)}%
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Open Cycles</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {cycles.filter(c => c.status === 'OPEN').length}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  WEEKLY REPORTING CYCLES
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {cycles.map((cycle, index) => {
                  const trend = getTrend(index);
                  return (
                    <div key={cycle.cycle_id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      {/* Week badge */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#1e3a8a]/5 border border-[#1e3a8a]/10 shrink-0">
                        <span className="text-[10px] font-bold text-[#1e3a8a] uppercase">Wk</span>
                        <span className="text-lg font-bold text-[#1e3a8a] leading-tight">{cycle.week_num}</span>
                        <span className="text-[9px] text-slate-400">{cycle.year}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-slate-800">
                            Week {cycle.week_num}, {cycle.year}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColor(cycle.status)}`}>
                            {cycle.status}
                          </span>
                          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                          {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${complianceBg(cycle.compliance_rate)}`}
                              style={{ width: `${Math.min(cycle.compliance_rate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold w-10 text-right ${complianceColor(cycle.compliance_rate)}`}>
                            {Math.round(cycle.compliance_rate)}%
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-800">{cycle.submitted_count}</p>
                          <p className="text-[10px] text-slate-400">Submitted</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-emerald-600">{cycle.approved_count}</p>
                          <p className="text-[10px] text-slate-400">Approved</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-500">{cycle.total_employees}</p>
                          <p className="text-[10px] text-slate-400">Team</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
