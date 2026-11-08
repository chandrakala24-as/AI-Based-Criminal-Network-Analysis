import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, AlertTriangle, Cpu, Eye, EyeOff } from 'lucide-react';
import { LedgerBlock, EvidenceVerificationResult } from '../../types';
import { evidenceService } from '../../services/evidenceService';

interface EvidenceLedgerViewerProps {
  blocks: LedgerBlock[];
}

export const EvidenceLedgerViewer: React.FC<EvidenceLedgerViewerProps> = ({ blocks }) => {
  const [selectedDocId, setSelectedDocId] = useState<number>(1);
  const [verificationResult, setVerificationResult] = useState<EvidenceVerificationResult | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [showFullHash, setShowFullHash] = useState<boolean>(false);

  const handleVerify = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await evidenceService.verifyDocumentIntegrity(selectedDocId);
      setVerificationResult(res);
    } catch {
      setVerificationResult({
        document_id: selectedDocId,
        filename: `DOC-${selectedDocId}`,
        stored_hash: 'N/A',
        computed_hash: 'N/A',
        verified: false,
        status_message: 'Verification failed - Unable to query database record.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setVerifying(false);
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    if (showFullHash) return hash;
    return hash.length > 16 ? `${hash.slice(0, 16)}...` : hash;
  };

  return (
    <div className="space-y-6">
      {/* Interactive Verification Header Widget */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
            <Lock className="w-5 h-5" />
            <span>SHA-256 Tamper-Evident Evidence Ledger</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Documents uploaded to CrimeGraph AI are cryptographically hashed and recorded into an immutable local block ledger referencing the previous block hash.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-mono">Verify Doc ID:</span>
          <input
            type="number"
            min="1"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(parseInt(e.target.value) || 1)}
            className="w-16 bg-slate-800 text-xs font-mono text-cyan-400 font-bold px-2.5 py-1 rounded border border-slate-700 focus:outline-none"
          />
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VERIFY INTEGRITY</span>
          </button>
        </div>
      </div>

      {/* Verification Results Panel */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
          verificationResult.verified
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          {verificationResult.verified ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm">
              {verificationResult.verified ? 'Evidence Integrity Verified' : 'Integrity Verification Failed'}
            </h4>
            <p className="text-slate-300">{verificationResult.status_message}</p>
            <div className="pt-2 flex flex-wrap gap-4 font-mono text-[11px] text-slate-400">
              <div>Recorded Hash: <span className="text-cyan-300">{verificationResult.stored_hash.slice(0, 16)}...</span></div>
              <div>Computed Hash: <span className="text-emerald-300">{verificationResult.computed_hash.slice(0, 16)}...</span></div>
              <div>Ledger Reference: <span className="text-amber-300">{verificationResult.ledger_reference || 'BLOCK-GENESIS'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Immutable Blockchain Ledger Block Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Immutable Block Ledger Chain ({blocks.length} blocks)
          </h4>
          <div className="flex items-center gap-3">
            {/* Full Hash Toggle */}
            <button
              onClick={() => setShowFullHash(!showFullHash)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                showFullHash
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {showFullHash ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showFullHash ? 'Full Hashes' : 'Truncated'}
            </button>
            <span className="text-[10px] text-slate-500 font-mono">Consensus: Local Cryptographic Chain</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Block Index</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Evidence Code</th>
                <th className="p-3">Case ID</th>
                <th className="p-3">SHA-256 Hash</th>
                <th className="p-3">Previous Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {blocks.map((b) => (
                <tr key={b.block_index} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-cyan-400 font-bold">#{b.block_index}</td>
                  <td className="p-3 text-slate-400">{new Date(b.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-white font-semibold">{b.evidence_id}</td>
                  <td className="p-3 text-slate-300">CASE-{b.case_id}</td>
                  <td className={`p-3 text-emerald-400 ${showFullHash ? 'break-all text-[10px]' : ''}`}>{formatHash(b.sha256_hash)}</td>
                  <td className={`p-3 text-slate-500 ${showFullHash ? 'break-all text-[10px]' : ''}`}>{formatHash(b.previous_hash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

