import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 flex items-center gap-2.5 text-xs text-amber-200/90">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Decision Support Notice:</strong> AI analytical leads require human investigator verification.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-200/90">
      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-rose-300">Mandatory Investigation Support Disclaimer</h4>
        <p className="mt-1 text-xs text-rose-200/80 leading-relaxed">
          CrimeGraph AI is a decision-support platform designed to surface potential patterns, entity relationships, and cross-case leads. 
          This system does NOT automatically determine guilt, draw legal conclusions, or make formal accusations. All generated scores, centrality ranks, and network links require independent verification by authorized law-enforcement personnel.
        </p>
      </div>
    </div>
  );
};
