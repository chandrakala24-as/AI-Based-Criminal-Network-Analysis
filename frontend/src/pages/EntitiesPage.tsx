import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Search, GitMerge, ChevronRight, LayoutGrid, List, Phone, Car, MapPin, Building2, User } from 'lucide-react';
import { entityService } from '../services/entityService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

const ENTITY_TYPES = [
  { value: '', label: 'All', icon: Users },
  { value: 'PERSON', label: 'Persons', icon: User },
  { value: 'PHONE', label: 'Phones', icon: Phone },
  { value: 'VEHICLE', label: 'Vehicles', icon: Car },
  { value: 'LOCATION', label: 'Locations', icon: MapPin },
];

const typeVariant: Record<string, 'blue' | 'cyan' | 'emerald' | 'amber'> = {
  PERSON: 'blue',
  PHONE: 'cyan',
  VEHICLE: 'emerald',
  LOCATION: 'amber',
};

export const EntitiesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [entities, setEntities] = useState<any[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [entityType, setEntityType] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [loading, setLoading] = useState(true);

  // Entity Resolution Modal State
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolveName, setResolveName] = useState('R. Kumar');
  const [resolveMatches, setResolveMatches] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  async function loadEntities() {
    setLoading(true);
    try {
      const data = await entityService.searchEntities(query, entityType);
      setEntities(data);
    } catch (err) {
      console.error('Failed to load entities', err);
    } finally {
      setLoading(false);
    }
  }

  const handleResolveCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    try {
      const res = await entityService.resolveMatch(resolveName, 'PERSON');
      setResolveMatches(res);
    } catch {
      alert('Entity resolution lookup failed.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Entity Directory & Resolution</h1>
          <p className="text-xs text-slate-400 mt-1">Search persons, phones, vehicles, locations, and run fuzzy deduplication</p>
        </div>

        <button
          onClick={() => setIsResolveOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <GitMerge className="w-4 h-4" />
          <span>Possible Match Resolution Tool</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); loadEntities(); }} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search entity by name or code (e.g., P001, Ravi, KA01AB1234)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
          />
        </form>

        {/* Entity Type Toggle Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ENTITY_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setEntityType(value)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                entityType === value
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5 ml-auto">
          <button
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            title="Card View"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Searching entity directory...</div>
      ) : entities.length === 0 ? (
        <div className="py-16 text-center bg-[#0F172A] border border-slate-800 rounded-2xl space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No entities found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or entity type filter</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Entity Code</th>
                <th className="p-4">Identifier / Name</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Aliases / Notes</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {entities.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{item.code}</td>
                  <td className="p-4 font-semibold text-white">{item.name}</td>
                  <td className="p-4"><Badge label={item.type} variant={typeVariant[item.type] || 'blue'} /></td>
                  <td className="p-4 text-slate-400">{item.aliases || item.address || 'N/A'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/entities/${item.type}/${item.code}`)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {entities.map((item, idx) => {
            const TypeIcon = ENTITY_TYPES.find(t => t.value === item.type)?.icon || Users;
            return (
              <div
                key={idx}
                onClick={() => navigate(`/entities/${item.type}/${item.code}`)}
                className="bg-[#0F172A] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 cursor-pointer transition-all shadow-lg hover:shadow-cyan-500/10 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/40 transition-all">
                    <TypeIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <Badge label={item.type} variant={typeVariant[item.type] || 'blue'} />
                </div>
                <div>
                  <p className="font-bold text-sm text-white leading-tight">{item.name}</p>
                  <p className="text-[11px] font-mono text-cyan-400 mt-0.5">{item.code}</p>
                </div>
                {(item.aliases || item.address) && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{item.aliases || item.address}</p>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entity Resolution Modal */}
      <Modal isOpen={isResolveOpen} onClose={() => setIsResolveOpen(false)} title="Entity Resolution & Duplicate Detection">
        <form onSubmit={handleResolveCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Target Entity Name for Fuzzy Match</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={resolveName}
                onChange={(e) => setResolveName(e.target.value)}
                className="flex-1 bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={resolving}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                {resolving ? 'Matching...' : 'Run Resolution'}
              </button>
            </div>
          </div>

          {resolveMatches.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white">Possible Match Candidates ({resolveMatches.length}):</h4>
              {resolveMatches.map((m, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>"{m.original_entity}" ↔ "{m.matched_entity}"</span>
                    <Badge label={`${Math.round(m.similarity_score * 100)}% Match`} variant="amber" />
                  </div>
                  <p className="text-[11px] text-amber-300 italic">{m.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
