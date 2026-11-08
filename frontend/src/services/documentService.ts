import { api } from './api';
import { DocumentItem } from '../types';

export const documentService = {
  async uploadDocument(options: {
    case_id?: number;
    case_number?: string;
    case_title?: string;
    case_type?: string;
    case_description?: string;
    file?: File | null;
    raw_text?: string;
    document_type?: string;
  }) {
    const formData = new FormData();
    if (options.case_id) formData.append('case_id', options.case_id.toString());
    if (options.case_number) formData.append('case_number', options.case_number);
    if (options.case_title) formData.append('case_title', options.case_title);
    if (options.case_type) formData.append('case_type', options.case_type);
    if (options.case_description) formData.append('case_description', options.case_description);
    if (options.document_type) formData.append('document_type', options.document_type || 'FIR_REPORT');
    if (options.file) formData.append('file', options.file);
    if (options.raw_text) formData.append('raw_text', options.raw_text);

    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async approveEntities(document_id: number, accepted_ids: number[], rejected_ids: number[] = []) {
    const res = await api.post(`/documents/${document_id}/approve-entities`, {
      accepted_entity_ids: accepted_ids,
      rejected_entity_ids: rejected_ids,
    });
    return res.data;
  },

  async getDocumentById(id: number): Promise<DocumentItem> {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  }
};
