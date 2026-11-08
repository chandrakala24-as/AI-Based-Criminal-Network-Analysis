import { api } from './api';
import { AssistantResponse } from '../types';

export const assistantService = {
  async queryAssistant(query: string, case_id?: number, scope?: 'global' | 'case'): Promise<AssistantResponse> {
    const res = await api.post('/assistant/query', { query, case_id, scope: scope || 'global' });
    return res.data;
  }
};
