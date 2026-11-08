import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Download, FolderGit2, Search, CheckCircle, ExternalLink } from 'lucide-react';
import { Disclaimer } from '../components/common/Disclaimer';
import { caseService } from '../services/caseService';
import { API_BASE_URL } from '../services/api';
import { Case } from '../types';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await caseService.getCases();
      setCases(data);
      if (data.length > 0) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load cases for report generation', err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerate = async (targetId: number, targetCaseNumber: string) => {
    setGeneratingId(targetId);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate/${targetId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crimegraph_token')}`
        }
      });
      if (!response.ok) throw new Error('Report generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CrimeGraph_Intelligence_Report_${targetCaseNumber || targetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF report. Ensure the case exists and has valid records.');
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredCases = cases.filter(c =>
    c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCaseObj = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Investigation Intelligence Report Generator</h1>
        <p className="text-xs text-slate-400 mt-1">Export comprehensive, legally disclaimed investigation dossiers for any real FIR case</p>
      </div>

      <Disclaimer compact />

      {/* Main Report Action Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 text-cyan-400">
          <FileSpreadsheet className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg text-white">Generate Case Intelligence PDF Dossier</h3>
            <p className="text-xs text-slate-400">
              Includes: Case Meta Summary, Legal Sections, Accused Entities, Communication Hubs, Associated Vehicles, Cross-Case Entity Overlaps, and SHA-256 Ledger Fingerprint
            </p>
          </div>
        </div>

        {cases.length > 0 ? (
          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 space-y-4">
            <label className="block text-xs font-semibold text-slate-300">Select Target FIR Case to Export</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedCaseId || ''}
                onChange={(e) => setSelectedCaseId(parseInt(e.target.value))}
                className="flex-1 bg-slate-800 text-sm font-mono text-cyan-300 font-bold px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title} ({c.case_type})
                  </option>
                ))}
              </select>

              <button
                onClick={() => selectedCaseId && activeCaseObj && handleGenerate(selectedCaseId, activeCaseObj.case_number)}
                disabled={!selectedCaseId || generatingId !== null}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{generatingId === selectedCaseId ? 'Generating PDF...' : 'Download Investigation Report'}</span>
              </button>
            </div>

            {activeCaseObj && (
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{activeCaseObj.case_number}</span>
                  <Badge label={activeCaseObj.status} variant={activeCaseObj.status === 'OPEN' ? 'emerald' : 'cyan'} />
                  <span className="text-slate-400">"{activeCaseObj.title}"</span>
                </div>
                <button
                  onClick={() => navigate(`/cases/${activeCaseObj.id}`)}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Open Case Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <FolderGit2 className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">No FIR cases recorded in the database yet.</p>
            <button
              onClick={() => navigate('/cases')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-cyan-500/20"
            >
              Go to Cases & Ingest First FIR
            </button>
          </div>
        )}

        <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-800 pt-4">
          <strong className="text-rose-400">Report Disclaimer:</strong> All intelligence summaries and relationship matrices produced by this module are analytical leads for decision support and mandate independent human verification by authorized investigators prior to operational or legal proceedings.
        </div>
      </div>

      {/* All Available Cases Quick Export Table */}
      {cases.length > 0 && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white">All Active Investigation Dossiers ({cases.length})</h3>
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Case Unique ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{c.case_number}</td>
                    <td className="p-3 text-white font-medium">{c.title}</td>
                    <td className="p-3 text-slate-400">{c.case_type}</td>
                    <td className="p-3"><Badge label={c.status} variant={c.status === 'OPEN' ? 'emerald' : 'cyan'} /></td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleGenerate(c.id, c.case_number)}
                        disabled={generatingId === c.id}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>{generatingId === c.id ? 'Generating...' : 'PDF'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
