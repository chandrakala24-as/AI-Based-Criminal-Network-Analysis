import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderGit2, Users, Network, Bell, ShieldCheck, GitCompare, 
  TrendingUp, ArrowRight, AlertTriangle, Cpu
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { caseService } from '../services/caseService';
import { SystemStats, Case, CrossCaseLink, AnomalyAlert } from '../types';
import { Badge } from '../components/common/Badge';
import { Disclaimer } from '../components/common/Disclaimer';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [crossLinks, setCrossLinks] = useState<CrossCaseLink[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [topEntities, setTopEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, casesData, crossData, anomalyData, centralityData] = await Promise.all([
          analyticsService.getStats(),
          caseService.getCases(),
          caseService.getAllCrossLinks(),
          analyticsService.getAnomalies(),
          analyticsService.getCentralityMetrics(5)
        ]);

        setStats(statsData);
        setRecentCases(casesData.slice(0, 5));
        setCrossLinks(crossData.slice(0, 4));
        setAnomalies(anomalyData.slice(0, 4));
        setTopEntities(centralityData);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono">Loading CrimeGraph AI Investigation Intelligence Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Disclaimer Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Investigation Overview Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Cross-case intelligence, network analytics, and automated decision support</p>
        </div>

        <button
          onClick={() => navigate('/graph')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <Network className="w-4 h-4" />
          <span>Launch Full Knowledge Graph</span>
        </button>
      </div>

      <Disclaimer compact />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: stats?.total_cases ?? 0, icon: FolderGit2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Total Entities', value: stats?.total_entities ?? 0, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Relationships', value: stats?.total_relationships ?? 0, icon: Network, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Potential Alerts', value: stats?.total_alerts ?? 0, icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Verified Evidence', value: stats?.verified_evidence_count ?? 0, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-slate-700 transition-all">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white font-mono">{item.value.toLocaleString()}</div>
                <div className="text-xs text-slate-400 font-medium">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Cross-Case Intelligence + Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cross-Case Links Widget */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-base text-white">Cross-Case Entity Overlaps</h3>
            </div>
            <button onClick={() => navigate('/cross-case')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {crossLinks.map((cl, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-3.5 rounded-xl transition-all flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400">{cl.case_a_number}</span>
                    <span className="text-slate-500">↔</span>
                    <span className="text-sky-400">{cl.case_b_number}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Shared {cl.shared_entity_type}: <strong className="text-slate-200">{cl.shared_entity_value}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <Badge label={`${intPercent(cl.confidence)}% Match`} variant="cyan" />
                  <div className="text-[10px] text-amber-300 mt-1 italic">Verification Required</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Leads Widget */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Detected Anomaly Leads</h3>
            </div>
            <button onClick={() => navigate('/alerts')} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              View Alerts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {anomalies.map((a, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-xl transition-all text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{a.alert_type}</span>
                  <Badge label={a.severity} variant={a.severity === 'HIGH' ? 'rose' : 'amber'} />
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{a.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Connected Entities + Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Connected Entities */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Top Centrality Network Hubs</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">PageRank & Degree Metrics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Entity Identifier</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Connections</th>
                  <th className="p-3">Degree Centrality</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {topEntities.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => navigate(`/entities`)}>
                    <td className="p-3 font-bold text-white">{e.entity_name}</td>
                    <td className="p-3"><Badge label={e.entity_type} variant="blue" /></td>
                    <td className="p-3 font-mono text-cyan-400 font-bold">{e.connections_count} direct</td>
                    <td className="p-3 font-mono text-slate-300">{e.degree_centrality}</td>
                    <td className="p-3 text-[10px] text-amber-300 italic">Analytical Lead</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Cases List */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-base text-white">Recent Cases</h3>
            <button onClick={() => navigate('/cases')} className="text-xs text-sky-400 hover:underline">All Cases</button>
          </div>

          <div className="space-y-3">
            {recentCases.length > 0 ? (
              recentCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 p-3 rounded-xl cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sky-400">{c.case_number}</span>
                    <Badge label={c.status} variant={c.status === 'OPEN' ? 'emerald' : 'cyan'} />
                  </div>
                  <div className="text-slate-200 font-medium truncate">{c.title}</div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-3">
                <FolderGit2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No active cases yet. Add an FIR report to begin analysis.</p>
                <button
                  onClick={() => navigate('/cases')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Go to Cases
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function intPercent(val: number): number {
  return Math.round(val * 100);
}
