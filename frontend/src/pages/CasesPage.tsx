import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Plus, Search, Filter, Calendar, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { caseService } from '../services/caseService';
import { Case } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // New Case Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Cyber Fraud');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await caseService.getCases(statusFilter, searchTerm);
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await caseService.createCase({
        case_number: newCaseNumber || `CASE-${Date.now().toString().slice(-4)}`,
        title: newTitle,
        case_type: newType,
        description: newDescription,
        status: 'OPEN'
      });
      setIsModalOpen(false);
      navigate(`/cases/${created.id}`);
    } catch (err) {
      alert('Failed to create new case. Ensure case number is unique.');
    } finally {
      setCreating(false);
    }
  };

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Under Investigation', value: 'UNDER_INVESTIGATION' },
    { label: 'Pending Review', value: 'PENDING_REVIEW' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Investigation Cases</h1>
          <p className="text-xs text-slate-400 mt-1">Manage active dossier records and knowledge repositories</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Case Dossier</span>
        </button>
      </div>

      {/* Filters, View Toggle & Search */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); loadCases(); }} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases by title, number, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
          />
        </form>

        {/* Status Toggle Pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cases Output: Grid or List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-8">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Investigation Cases Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Create New Case Dossier" or use the "Upload FIR / Report" button in the top navigation to analyze real FIR reports.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-cyan-500/20"
            >
              Create Case Dossier
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="bg-[#0F172A] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-lg hover:shadow-cyan-500/10"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs">{c.case_number}</span>
                  <Badge label={c.status} variant={c.status === 'OPEN' ? 'emerald' : 'cyan'} />
                </div>

                <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description || 'No detailed summary provided.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(c.created_at).toLocaleDateString()}
                </span>

                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-semibold text-[11px]">
                  Open Dossier <ChevronRight className="w-3.5 h-3.5" />
                </span>
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
                <th className="p-3.5">Case Number</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Registered Date</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-mono font-bold text-cyan-400">{c.case_number}</td>
                  <td className="p-3.5 font-semibold text-white">{c.title}</td>
                  <td className="p-3.5 text-slate-300">{c.case_type}</td>
                  <td className="p-3.5"><Badge label={c.status} variant={c.status === 'OPEN' ? 'emerald' : 'cyan'} /></td>
                  <td className="p-3.5 text-slate-400 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3.5 text-right text-cyan-400 font-semibold text-[11px]">
                    View →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Case Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Case Dossier">
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Case Number</label>
            <input
              type="text"
              required
              placeholder="e.g. CASE-501 or FIR-2026-99"
              value={newCaseNumber}
              onChange={(e) => setNewCaseNumber(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Case Title</label>
            <input
              type="text"
              required
              placeholder="Operation Cyber Syndicate Probe"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Case Category</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
            >
              <option value="Cyber Fraud">Cyber Fraud</option>
              <option value="Financial Smuggling">Financial Smuggling</option>
              <option value="Organized Theft">Organized Theft</option>
              <option value="Narcotics Network">Narcotics Network</option>
              <option value="Extortion Ring">Extortion Ring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="Enter preliminary case briefing details..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 p-3 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white">Cancel</button>
            <button
              type="submit"
              disabled={creating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-md"
            >
              {creating ? 'Creating...' : 'Initialize Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
