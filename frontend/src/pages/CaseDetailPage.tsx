import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderGit2, Network, Clock, MapPin, GitCompare, 
  FileSpreadsheet, ShieldCheck, Download, AlertTriangle, Upload, Eye
} from 'lucide-react';
import { caseService } from '../services/caseService';
import { Case, NetworkGraphData, CrossCaseLink, CaseSimilarity, AnomalyAlert } from '../types';
import { Badge } from '../components/common/Badge';
import { NetworkGraph } from '../components/graph/NetworkGraph';
import { TimelineViewer } from '../components/timeline/TimelineViewer';
import { MapViewer } from '../components/map/MapViewer';
import { EvidenceLedgerViewer } from '../components/evidence/EvidenceLedgerViewer';
import { evidenceService } from '../services/evidenceService';
import { analyticsService } from '../services/analyticsService';
import { API_BASE_URL } from '../services/api';
import { Disclaimer } from '../components/common/Disclaimer';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const caseId = id ? parseInt(id) : 0;
  const navigate = useNavigate();

  const [caseObj, setCaseObj] = useState<Case | null>(null);
  const [networkData, setNetworkData] = useState<NetworkGraphData | null>(null);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [crossLinks, setCrossLinks] = useState<CrossCaseLink[]>([]);
  const [similarCases, setSimilarCases] = useState<CaseSimilarity[]>([]);
  const [ledgerBlocks, setLedgerBlocks] = useState<any[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAllCaseDetails() {
      setLoading(true);
      try {
        const [c, net, tl, cl, sim, blocks, mapEv] = await Promise.all([
          caseService.getCaseById(caseId),
          caseService.getCaseNetwork(caseId),
          caseService.getCaseTimeline(caseId),
          caseService.getCaseCrossLinks(caseId),
          caseService.getSimilarCases(caseId),
          evidenceService.getLedgerBlocks(),
          analyticsService.getMapEvents()
        ]);

        setCaseObj(c);
        setNetworkData(net);
        setTimelineItems(tl);
        setCrossLinks(cl);
        setSimilarCases(sim);
        setLedgerBlocks(blocks.filter(b => b.case_id === caseId || blocks.length > 0));
        setMapPoints(mapEv.filter((m: any) => m.case_id === caseId || mapEv.length > 0));
      } catch (err) {
        console.error('Failed to load case details', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllCaseDetails();
  }, [caseId]);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate/${caseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crimegraph_token')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CrimeGraph_Intelligence_Report_${caseObj?.case_number || caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Failed to generate PDF report.');
    }
  };

  if (loading || !caseObj) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading case intelligence dossier for CASE-{caseId}...
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'network', label: 'Network Graph' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'map', label: 'Map Intelligence' },
    { id: 'cross', label: `Cross-Case Links (${crossLinks.length})` },
    { id: 'similar', label: `Similar Cases (${similarCases.length})` },
    { id: 'evidence', label: 'Evidence Ledger' },
  ];

  return (
    <div className="space-y-6">
      {/* Dossier Top Banner */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-cyan-400 text-sm bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
              {caseObj.case_number}
            </span>
            <Badge label={caseObj.status} variant={caseObj.status === 'OPEN' ? 'emerald' : 'cyan'} />
            <span className="text-xs text-slate-400 font-mono">{caseObj.case_type}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white mt-2">{caseObj.title}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">{caseObj.description || 'No detailed briefing.'}</p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Intelligence PDF Report</span>
        </button>
      </div>

      <Disclaimer compact />

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 border-b-2 transition-all shrink-0 ${
              activeTab === t.id
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Case Narrative & Intelligence Briefing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {caseObj.description || 'Synthetic investigation report record initialized.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400">Total Entities</div>
                  <div className="text-lg font-bold text-white font-mono">{networkData?.total_nodes || 0}</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400">Relationships</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono">{networkData?.total_edges || 0}</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400">Cross-Case Overlaps</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">{crossLinks.length}</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400">Timeline Events</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">{timelineItems.length}</div>
                </div>
              </div>
            </div>

            {/* Quick Cross Links preview */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-cyan-400" />
                Cross-Case Intelligence
              </h3>
              {crossLinks.length > 0 ? (
                crossLinks.map((cl, idx) => (
                  <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-white">Link: {cl.case_a_number} ↔ {cl.case_b_number}</div>
                    <div className="text-slate-400">Shared {cl.shared_entity_type}: <strong className="text-cyan-400">{cl.shared_entity_value}</strong></div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No cross-case entity links detected.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'network' && networkData && (
          <NetworkGraph graphData={networkData} height="h-[650px]" />
        )}

        {activeTab === 'timeline' && (
          <TimelineViewer items={timelineItems} />
        )}

        {activeTab === 'map' && (
          <MapViewer points={mapPoints} height="h-[600px]" />
        )}

        {activeTab === 'cross' && (
          <div className="space-y-3">
            {crossLinks.map((cl, idx) => (
              <div key={idx} className="bg-[#0F172A] border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">{cl.case_a_number} ↔ {cl.case_b_number}</span>
                  <Badge label={`${Math.round(cl.confidence * 100)}% Confidence`} variant="cyan" />
                </div>
                <div className="text-slate-300">Shared Entity Identifier: <strong className="text-cyan-400">{cl.shared_entity_type} {cl.shared_entity_value}</strong></div>
                <div className="text-[11px] text-amber-300 italic">{cl.status}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'similar' && (
          <div className="space-y-3">
            {similarCases.map((s, idx) => (
              <div key={idx} className="bg-[#0F172A] border border-slate-800 p-4 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-sky-400">{s.case_number} — {s.title}</div>
                  <p className="text-slate-400 mt-1">{s.reason}</p>
                </div>
                <Badge label={`${Math.round(s.similarity_score * 100)}% Similarity`} variant="purple" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'evidence' && (
          <EvidenceLedgerViewer blocks={ledgerBlocks} />
        )}
      </div>
    </div>
  );
};
