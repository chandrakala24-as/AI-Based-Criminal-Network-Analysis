import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Filter, AlignJustify, AlignLeft } from 'lucide-react';
import { caseService } from '../services/caseService';
import { Case } from '../types';
import { TimelineViewer } from '../components/timeline/TimelineViewer';
import { Disclaimer } from '../components/common/Disclaimer';

const EVENT_FILTERS = [
  { value: 'ALL', label: 'All Events' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'RELATIONSHIP', label: 'Relationship' },
  { value: 'OTHER', label: 'Other' },
];

export const TimelinePage: React.FC = () => {
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    loadCases();
    loadTimeline();
  }, []);

  async function loadCases() {
    try {
      const data = await caseService.getCases();
      setCases(data);
    } catch {
      // ignore
    }
  }

  async function loadTimeline(targetCaseId?: number) {
    setLoading(true);
    try {
      const items = await caseService.getCaseTimeline(targetCaseId);
      setTimelineItems(items);
    } catch (err) {
      console.error('Failed to load timeline items', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedCaseId(val);
    loadTimeline(val);
  };

  const filteredItems = useMemo(() => {
    if (eventFilter === 'ALL') return timelineItems;
    if (eventFilter === 'OTHER') {
      return timelineItems.filter(
        (item) => !['PHONE', 'VEHICLE', 'RELATIONSHIP'].some((t) => item.type?.toUpperCase().includes(t))
      );
    }
    return timelineItems.filter((item) => item.type?.toUpperCase().includes(eventFilter));
  }, [timelineItems, eventFilter]);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: timelineItems.length };
    EVENT_FILTERS.slice(1).forEach(({ value }) => {
      if (value === 'OTHER') {
        counts[value] = timelineItems.filter(
          (item) => !['PHONE', 'VEHICLE', 'RELATIONSHIP'].some((t) => item.type?.toUpperCase().includes(t))
        ).length;
      } else {
        counts[value] = timelineItems.filter((item) => item.type?.toUpperCase().includes(value)).length;
      }
    });
    return counts;
  }, [timelineItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Case Timeline Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">Chronological sequence of communications, transactions, and surveillance observations</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Case Filter Select */}
          {cases.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCaseId ?? ''}
                onChange={handleCaseChange}
                className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
              >
                <option value="">All Cases (Global Timeline)</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Compact / Expanded toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setCompact(false)}
              title="Expanded View"
              className={`p-1.5 rounded-md transition-all ${!compact ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <AlignJustify className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCompact(true)}
              title="Compact View"
              className={`p-1.5 rounded-md transition-all ${compact ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Type Filter Toggle Pills */}
      {timelineItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {EVENT_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setEventFilter(value)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                eventFilter === value
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                eventFilter === value ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {eventCounts[value] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <Disclaimer compact />

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading case timeline...</div>
      ) : timelineItems.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-8">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">Timeline is Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No chronological events or relationships logged yet. Ingest an FIR to generate timeline observations.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-[#0F172A] border border-slate-800 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No events for this filter</p>
          <p className="text-xs">Try selecting "All Events" to reset the filter</p>
        </div>
      ) : (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{filteredItems.length}</span> events
              {eventFilter !== 'ALL' && <span className="text-cyan-400"> · {eventFilter}</span>}
            </span>
          </div>
          <TimelineViewer items={compact ? filteredItems.slice(0, 10) : filteredItems} />
          {compact && filteredItems.length > 10 && (
            <button
              onClick={() => setCompact(false)}
              className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 mx-auto"
            >
              Show all {filteredItems.length} events
            </button>
          )}
        </div>
      )}
    </div>
  );
};
