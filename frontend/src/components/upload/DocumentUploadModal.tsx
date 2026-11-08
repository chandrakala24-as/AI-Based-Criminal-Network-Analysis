import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Check, Plus, FolderGit2, Edit3 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentService } from '../../services/documentService';
import { caseService } from '../../services/caseService';
import { Case, ExtractedEntity } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: number;
  onSuccess?: (newCaseId?: number) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Mode & Case Selection
  const [existingCases, setExistingCases] = useState<Case[]>([]);
  const [isNewCase, setIsNewCase] = useState<boolean>(!caseId);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(caseId);
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [caseType, setCaseType] = useState<string>('Cyber Fraud');
  const [caseDescription, setCaseDescription] = useState<string>('');

  // Ingestion Mode: File vs Raw Text
  const [inputMode, setInputMode] = useState<'FILE' | 'PASTE'>('PASTE');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [docType, setDocType] = useState<string>('FIR_REPORT');

  // Workflow steps
  const [uploading, setUploading] = useState<boolean>(false);
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'REVIEW' | 'COMPLETE'>('SELECT');
  const [docId, setDocId] = useState<number | null>(null);
  const [resultingCaseId, setResultingCaseId] = useState<number | null>(null);
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCases();
      if (caseId) {
        setSelectedCaseId(caseId);
        setIsNewCase(false);
      } else {
        setIsNewCase(true);
      }
    }
  }, [isOpen, caseId]);

  async function loadCases() {
    try {
      const data = await caseService.getCases();
      setExistingCases(data);
      if (data.length === 0) {
        setIsNewCase(true);
      }
    } catch {
      // ignore
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (inputMode === 'FILE' && !file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }
    if (inputMode === 'PASTE' && !rawText.trim()) {
      setErrorMsg('Please paste the FIR report text into the box.');
      return;
    }

    setUploading(true);
    setStep('PROCESSING');
    setErrorMsg(null);

    try {
      const res = await documentService.uploadDocument({
        case_id: !isNewCase ? selectedCaseId : undefined,
        case_number: isNewCase ? (caseNumber.trim() || undefined) : undefined,
        case_title: isNewCase ? (caseTitle.trim() || undefined) : undefined,
        case_type: caseType,
        case_description: caseDescription.trim() || undefined,
        document_type: docType,
        file: inputMode === 'FILE' ? file : null,
        raw_text: inputMode === 'PASTE' ? rawText : undefined
      });

      setDocId(res.document.id);
      setResultingCaseId(res.document.case_id);
      setEntities(res.entities);
      // Default all extracted entities to accepted
      const allIds = res.entities.map((e: any, idx: number) => e.id ?? idx);
      setAcceptedIds(allIds);
      setStep('REVIEW');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload and extract document text.');
      setStep('SELECT');
    } finally {
      setUploading(false);
    }
  };

  const toggleEntityAccept = (id: number) => {
    if (acceptedIds.includes(id)) {
      setAcceptedIds(acceptedIds.filter(i => i !== id));
    } else {
      setAcceptedIds([...acceptedIds, id]);
    }
  };

  const handleCommit = async () => {
    if (!docId) return;
    setUploading(true);
    try {
      const res = await documentService.approveEntities(docId, acceptedIds);
      setStep('COMPLETE');
      if (res.case_id) {
        setResultingCaseId(res.case_id);
      }
      if (onSuccess) onSuccess(resultingCaseId || res.case_id);
    } catch (err: any) {
      setErrorMsg('Failed to commit approved entities to knowledge graph.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawText('');
    setCaseNumber('');
    setCaseTitle('');
    setCaseDescription('');
    setStep('SELECT');
    setDocId(null);
    setResultingCaseId(null);
    setEntities([]);
    setAcceptedIds([]);
    setErrorMsg(null);
    onClose();
  };

  const handleViewCase = () => {
    const targetId = resultingCaseId || selectedCaseId;
    handleReset();
    if (targetId) {
      navigate(`/cases/${targetId}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Ingest Real FIR Report & Investigation Records" maxWidth="2xl">
      {step === 'SELECT' && (
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Case Assignment Choice */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-cyan-400" />
                Case Assignment & Unique Identifier
              </label>

              {existingCases.length > 0 && !caseId && (
                <div className="flex bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsNewCase(true)}
                    className={`px-3 py-1 rounded-md transition-all ${isNewCase ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Create New Case
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCase(false);
                      if (!selectedCaseId && existingCases.length > 0) setSelectedCaseId(existingCases[0].id);
                    }}
                    className={`px-3 py-1 rounded-md transition-all ${!isNewCase ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Select Existing Case
                  </button>
                </div>
              )}
            </div>

            {isNewCase ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Unique Case ID / FIR No. <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FIR-2024-KA01-0421"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-cyan-300 font-mono font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique alphanumeric identifier</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Case Title / Subject <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Online Financial Extortion"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Case Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cyber Fraud">Cyber Fraud</option>
                    <option value="Financial Smuggling">Financial Smuggling</option>
                    <option value="Organized Theft">Organized Theft</option>
                    <option value="Narcotics Network">Narcotics Network</option>
                    <option value="Extortion Ring">Extortion Ring</option>
                    <option value="Identity Theft">Identity Theft</option>
                    <option value="Violent Crime">Violent Crime</option>
                    <option value="General Investigation">General Investigation</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Target Investigation Case</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(parseInt(e.target.value))}
                  className="w-full bg-slate-800 text-xs text-cyan-300 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                >
                  {existingCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ingestion Mode Toggle */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('PASTE')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                inputMode === 'PASTE' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Paste Raw FIR Text</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('FILE')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                inputMode === 'FILE' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document File</span>
            </button>
          </div>

          {/* Input Method A: Paste Raw FIR Text */}
          {inputMode === 'PASTE' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Paste FIR / Police Intelligence Text Below:
              </label>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste complete FIR text here... (e.g. Police Station, Accused details, Complainant, IPC/BNS sections, mobile numbers, vehicle registrations, bank accounts, stolen property amount, incident narrative)"
                className="w-full bg-slate-900 text-xs text-slate-200 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Supports multi-lingual legal terminology, Indian sections, and entity extraction</span>
                <span>{rawText.length} characters</span>
              </div>
            </div>
          )}

          {/* Input Method B: Upload File */}
          {inputMode === 'FILE' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 text-center transition-all bg-slate-900/40 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                <h4 className="text-xs font-semibold text-slate-200">Drag & drop your document file here</h4>
                <p className="text-[11px] text-slate-400 mt-1">Supports PDF, DOCX, TXT, CSV, JSON (Up to 20MB)</p>

                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.docx,.txt,.csv,.json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />

                <label
                  htmlFor="file-upload"
                  className="mt-3 inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-colors border border-slate-600"
                >
                  Browse Local File
                </label>
              </div>

              {file && (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">{file.name}</div>
                      <div className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="bg-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                  >
                    <option value="FIR_REPORT">FIR Report</option>
                    <option value="CDR_LOG">Call Detail Record (CDR)</option>
                    <option value="BANK_RECORD">Bank Transaction Statement</option>
                    <option value="SURVEILLANCE_NOTE">Surveillance Note</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button onClick={handleReset} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              disabled={uploading || (inputMode === 'FILE' && !file) || (inputMode === 'PASTE' && !rawText.trim())}
              onClick={handleProcess}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              <span>Analyze FIR & Extract Entities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'PROCESSING' && (
        <div className="py-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <h4 className="text-base font-semibold text-white">Analyzing FIR Report & Extracting Entities...</h4>
          <p className="text-xs text-slate-400 font-mono">Running Rule-based NLP + Regex Pipeline on Indian Legal Formats</p>
        </div>
      )}

      {step === 'REVIEW' && (
        <div className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 text-xs text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong>Human-in-the-Loop Verification:</strong> Review NLP-extracted entities below. Check accepted items to commit to the database and knowledge graph.
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{entities.length} entities extracted ({acceptedIds.length} selected)</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAcceptedIds(entities.map((e, idx) => e.id ?? idx))}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                Select All
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setAcceptedIds([])}
                className="text-slate-400 hover:underline text-[11px]"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Extracted Entities Review Table */}
          <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 sticky top-0 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3">Verify</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Extracted Value</th>
                  <th className="p-3">Normalized Value</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {entities.length > 0 ? (
                  entities.map((ent, idx) => {
                    const entId = ent.id ?? idx;
                    const isAccepted = acceptedIds.includes(entId);
                    return (
                      <tr key={idx} className={isAccepted ? 'bg-cyan-950/20' : 'bg-transparent opacity-60'}>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleEntityAccept(entId)}
                            className={`p-1 rounded-md transition-colors ${
                              isAccepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 font-mono font-semibold text-cyan-400">{ent.entity_type}</td>
                        <td className="p-3 text-slate-200">{ent.entity_value}</td>
                        <td className="p-3 font-mono text-slate-300">{ent.normalized_value}</td>
                        <td className="p-3 font-mono text-slate-400">{Math.round(ent.confidence * 100)}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                      No distinct structured entities recognized. You can still approve to record the document narrative.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button onClick={() => setStep('SELECT')} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
              Back
            </button>
            <button
              onClick={handleCommit}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploading ? 'Committing...' : 'Approve & Sync Knowledge Graph'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 'COMPLETE' && (
        <div className="py-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
          <h4 className="text-lg font-bold text-white">FIR Ingestion & Analysis Complete!</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Entities, persons, phones, vehicles, and relationships have been successfully committed to the database. The evidence SHA-256 block ledger has been updated.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-700"
            >
              Close
            </button>
            <button
              onClick={handleViewCase}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>View Case Dossier</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
