import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Network, FolderGit2, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { entityService } from '../services/entityService';
import { Badge } from '../components/common/Badge';
import { Disclaimer } from '../components/common/Disclaimer';

export const EntityDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const entityType = type || 'PERSON';
  const entityId = id || 'P001';

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await entityService.getEntityProfile(entityType, entityId);
        setProfile(res);
      } catch (err) {
        console.error('Failed to load entity profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [entityType, entityId]);

  if (loading || !profile) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading entity profile for {entityType}:{entityId}...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/entities')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Badge label={profile.entity_type} variant="blue" />
            <span className="font-mono text-xs text-slate-400">ID: {profile.entity_id}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Entity Intelligence Dossier: {profile.entity_id}</h1>
        </div>
      </div>

      <Disclaimer compact />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Total Network Connections</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{profile.connections_count} links</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Associated Cases</div>
          <div className="text-2xl font-bold text-sky-400 font-mono mt-1">{profile.associated_cases_count} cases</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Source Evidence Records</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{profile.associated_documents_count} documents</div>
        </div>
      </div>

      {/* Relationships Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Observed Interactions & Relationships</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Source Node</th>
                <th className="p-3">Relationship</th>
                <th className="p-3">Target Node</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {profile.relationships.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-cyan-400">{r.source}</td>
                  <td className="p-3"><Badge label={r.relationship_type} variant="amber" /></td>
                  <td className="p-3 font-mono font-bold text-sky-400">{r.target}</td>
                  <td className="p-3 font-mono text-emerald-400">{Math.round((r.confidence || 1) * 100)}%</td>
                  <td className="p-3 text-slate-300">{r.explanation || 'Extracted relationship link.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
