import { api } from './api';
import { LedgerBlock, EvidenceVerificationResult } from '../types';

export const evidenceService = {
  async getLedgerBlocks(): Promise<LedgerBlock[]> {
    const res = await api.get('/evidence');
    return res.data;
  },

  async verifyDocumentIntegrity(document_id: number): Promise<EvidenceVerificationResult> {
    const res = await api.post(`/evidence/${document_id}/verify`);
    return res.data;
  }
};
