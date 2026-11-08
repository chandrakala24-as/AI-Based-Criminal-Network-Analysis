import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { evidenceService } from '../services/evidenceService';
import { LedgerBlock } from '../types';
import { EvidenceLedgerViewer } from '../components/evidence/EvidenceLedgerViewer';
import { Disclaimer } from '../components/common/Disclaimer';

export const EvidencePage: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      try {
        const data = await evidenceService.getLedgerBlocks();
        setBlocks(data);
      } catch (err) {
        console.error('Failed to load evidence ledger', err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Evidence Integrity & Blockchain Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">Immutable SHA-256 local block ledger for evidence verification</p>
      </div>

      <Disclaimer compact />

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Querying evidence blockchain ledger...</div>
      ) : (
        <EvidenceLedgerViewer blocks={blocks} />
      )}
    </div>
  );
};
