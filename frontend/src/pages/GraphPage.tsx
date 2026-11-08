import React, { useEffect, useState } from 'react';
import { Network, RefreshCw, Filter } from 'lucide-react';
import { caseService } from '../services/caseService';
import { NetworkGraphData, Case } from '../types';
import { NetworkGraph } from '../components/graph/NetworkGraph';
import { Disclaimer } from '../components/common/Disclaimer';

export const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
    loadGraph();
  }, []);

  async function loadCases() {
    try {
      const data = await caseService.getCases();
      setCases(data);
    } catch {
      // ignore
    }
  }

  async function loadGraph(targetCaseId?: number) {
    setLoading(true);
    try {
      const data = await caseService.getCaseNetwork(targetCaseId);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load full graph network', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedCaseId(val);
    loadGraph(val);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Interactive Knowledge Graph Canvas</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-entity relationship network visualization and centrality analysis</p>
        </div>

        <div className="flex items-center gap-2">
          {cases.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCaseId ?? ''}
                onChange={handleCaseChange}
                className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
              >
                <option value="">All Cases (Global Network)</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadGraph(selectedCaseId)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <Disclaimer compact />

      {loading || !graphData ? (
        <div className="py-24 text-center text-slate-400 font-mono text-xs">Initializing Cytoscape Knowledge Graph...</div>
      ) : graphData.nodes.length === 0 ? (
        <div className="py-24 text-center text-slate-400 space-y-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-8">
          <Network className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">Knowledge Graph is Clean</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active nodes or relationships recorded. Ingest an FIR report with accused, phone numbers, or vehicles to render the graph.
          </p>
        </div>
      ) : (
        <NetworkGraph graphData={graphData} height="h-[750px]" />
      )}
    </div>
  );
};
