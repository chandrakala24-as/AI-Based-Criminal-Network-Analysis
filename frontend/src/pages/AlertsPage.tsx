import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, ShieldCheck, Filter, Search } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { AnomalyAlert } from '../types';
import { Badge } from '../components/common/Badge';
import { Disclaimer } from '../components/common/Disclaimer';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true);
      try {
        const data = await analyticsService.getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesSearch = !searchTerm.trim() || 
      a.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const severityOptions: Array<{ label: string; value: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'; count: number }> = [
    { label: 'All Alerts', value: 'ALL', count: alerts.length },
    { label: 'High Severity', value: 'HIGH', count: alerts.filter(a => a.severity === 'HIGH').length },
    { label: 'Medium Severity', value: 'MEDIUM', count: alerts.filter(a => a.severity === 'MEDIUM').length },
    { label: 'Low Severity', value: 'LOW', count: alerts.filter(a => a.severity === 'LOW').length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Anomaly Leads & Alerts</h1>
        <p className="text-xs text-slate-400 mt-1">Unsupervised Isolation Forest transaction surges and structural network anomalies</p>
      </div>

      <Disclaimer compact />

      {/* Filter Toolbar & Search */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Severity Toggle Pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {severityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverityFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                severityFilter === opt.value
                  ? opt.value === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : opt.value === 'MEDIUM'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anomalies & explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Processing anomaly detector pipeline...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-8">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Matching Anomalies</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No alerts match the selected severity filter "{severityFilter}".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((a, idx) => (
            <div key={idx} className="bg-[#0F172A] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">{a.alert_type}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge label={a.severity} variant={a.severity === 'HIGH' ? 'rose' : 'amber'} />
                  <span className="font-mono text-xs text-cyan-400 font-bold">Score: {a.score}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{a.explanation}</p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                <span className="text-amber-300 italic">{a.disclaimer}</span>
                <span className="font-mono text-slate-500">Status: {a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
