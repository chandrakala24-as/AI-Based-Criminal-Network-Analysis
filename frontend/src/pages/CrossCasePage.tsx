import React, { useEffect, useState, useMemo } from 'react';
import { GitCompare, FileText, ShieldCheck, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { caseService } from '../services/caseService';
import { CrossCaseLink } from '../types';
import { Badge } from '../components/common/Badge';
import { Disclaimer } from '../components/common/Disclaimer';

const CONFIDENCE_FILTERS = [
  { value: 'ALL', label: 'All Links' },
  { value: 'HIGH', label: 'High ≥80%' },
  { value: 'MEDIUM', label: 'Medium 50-79%' },
  { value: 'LOW', label: 'Low <50%' },
];

export const CrossCasePage: React.FC = () => {
  const [crossLinks, setCrossLinks] = useState<CrossCaseLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'confidence' | 'default'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function loadCrossCase() {
      setLoading(true);
      try {
        const links = await caseService.getAllCrossLinks();
        setCrossLinks(links);
      } catch (err) {
        console.error('Failed to load cross case links', err);
      } finally {
        setLoading(false);
      }
    }
    loadCrossCase();
  }, []);

  const filteredLinks = useMemo(() => {
    let results = [...crossLinks];

    // Confidence filter
    if (confidenceFilter === 'HIGH') {
      results = results.filter(cl => cl.confidence >= 0.8);
    } else if (confidenceFilter === 'MEDIUM') {
      results = results.filter(cl => cl.confidence >= 0.5 && cl.confidence < 0.8);
    } else if (confidenceFilter === 'LOW') {
      results = results.filter(cl => cl.confidence < 0.5);
    }

    // Sort
    if (sortBy === 'confidence') {
      results.sort((a, b) => b.confidence - a.confidence);
    }

    return results;
  }, [crossLinks, confidenceFilter, sortBy]);

  const filterCounts = useMemo(() => ({
    ALL: crossLinks.length,
    HIGH: crossLinks.filter(cl => cl.confidence >= 0.8).length,
    MEDIUM: crossLinks.filter(cl => cl.confidence >= 0.5 && cl.confidence < 0.8).length,
    LOW: crossLinks.filter(cl => cl.confidence < 0.5).length,
  }), [crossLinks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Cross-Case Intelligence Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Automated cross-case entity link discovery across phones, vehicles, persons, and locations</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'default' ? 'confidence' : 'default')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              sortBy === 'confidence'
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortBy === 'confidence' ? 'By Confidence' : 'Default Order'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confidence Filter Toggle Pills */}
      {crossLinks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {CONFIDENCE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setConfidenceFilter(value)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                confidenceFilter === value
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                confidenceFilter === value ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {filterCounts[value as keyof typeof filterCounts] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <Disclaimer compact />

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Analyzing cross-case linkages...</div>
      ) : crossLinks.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-8">
          <GitCompare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Cross-Case Entity Overlaps Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When multiple FIR reports share matching phone numbers, vehicle registrations, or suspect names, CrimeGraph AI automatically establishes cross-case intelligence links.
          </p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-[#0F172A] border border-slate-800 rounded-2xl space-y-2">
          <GitCompare className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No links match this confidence level</p>
          <p className="text-xs">Try selecting "All Links" to view all results</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLinks.map((cl, idx) => (
            <div key={idx} className="bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-mono font-bold text-base text-white">
                  <span className="text-cyan-400">{cl.case_a_number}</span>
                  <span className="text-slate-500">↔</span>
                  <span className="text-sky-400">{cl.case_b_number}</span>
                </div>
                <Badge label={`${Math.round(cl.confidence * 100)}% Confidence`} variant="cyan" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Shared Entity Identifier:</span>
                  <span className="font-mono font-bold text-white text-sm">{cl.shared_entity_type}: <span className="text-cyan-400">{cl.shared_entity_value}</span></span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <div>Linked Evidence Sources:</div>
                  <div className="flex flex-wrap gap-2">
                    {cl.sources.map((s, i) => (
                      <span key={i} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-amber-300 italic">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cl.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Case A</th>
                <th className="p-4">Case B</th>
                <th className="p-4">Shared Entity</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Sources</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLinks.map((cl, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{cl.case_a_number}</td>
                  <td className="p-4 font-mono font-bold text-sky-400">{cl.case_b_number}</td>
                  <td className="p-4 text-white font-semibold">{cl.shared_entity_type}: <span className="text-cyan-400">{cl.shared_entity_value}</span></td>
                  <td className="p-4"><Badge label={`${Math.round(cl.confidence * 100)}%`} variant={cl.confidence >= 0.8 ? 'emerald' : cl.confidence >= 0.5 ? 'amber' : 'blue'} /></td>
                  <td className="p-4 text-slate-400 font-mono">{cl.sources.length} source(s)</td>
                  <td className="p-4 text-amber-300 italic text-[11px]">{cl.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

