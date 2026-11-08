import React from 'react';
import { Calendar, Clock, MapPin, FileText, User } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TimelineItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  source_document_id?: number;
  location_id?: number;
  explanation?: string;
}

interface TimelineViewerProps {
  items: TimelineItem[];
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
        No chronological timeline events logged for this query.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {items.map((item, idx) => {
        const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[29px] top-1.5 w-4 h-4 rounded-full bg-[#0F172A] border-2 border-cyan-500 group-hover:border-cyan-400 group-hover:scale-125 transition-all shadow-md shadow-cyan-500/20" />

            {/* Event Card */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge label={item.type} variant={item.type.includes('PHONE') ? 'cyan' : (item.type.includes('VEHICLE') ? 'emerald' : 'blue')} />
                  <span className="text-xs font-semibold text-slate-200">{item.description}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formattedTime}
                  </span>
                </div>
              </div>

              {item.explanation && (
                <p className="text-xs text-slate-300 mt-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {item.explanation}
                </p>
              )}

              {item.source_document_id && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <FileText className="w-3.5 h-3.5" />
                    Source Record: DOC-{item.source_document_id}
                  </span>
                  <span className="text-slate-400 italic">Investigator Verified</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
