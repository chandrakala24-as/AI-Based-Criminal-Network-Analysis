import { api } from './api';
import { Case, NetworkGraphData, CrossCaseLink, CaseSimilarity } from '../types';

export const caseService = {
  async getCases(status?: string, search?: string): Promise<Case[]> {
    const res = await api.get('/cases', { params: { status, search } });
    return res.data;
  },

  async createCase(data: Partial<Case>): Promise<Case> {
    const res = await api.post('/cases', data);
    return res.data;
  },

  async getCaseById(id: number): Promise<Case> {
    const res = await api.get(`/cases/${id}`);
    return res.data;
  },

  async updateCase(id: number, data: Partial<Case>): Promise<Case> {
    const res = await api.put(`/cases/${id}`, data);
    return res.data;
  },

  async getCaseNetwork(id?: number): Promise<NetworkGraphData> {
    const res = await api.get(id ? `/cases/${id}/network` : '/cases/network');
    return res.data;
  },

  async getCaseTimeline(id?: number) {
    const res = await api.get(id ? `/cases/${id}/timeline` : '/cases/timeline');
    return res.data;
  },

  async getCaseCrossLinks(id?: number): Promise<CrossCaseLink[]> {
    const res = await api.get(id ? `/cases/${id}/cross-links` : '/cases/cross-links');
    return res.data;
  },

  async getAllCrossLinks(): Promise<CrossCaseLink[]> {
    const res = await api.get('/cases/cross-links');
    return res.data;
  },

  async getSimilarCases(id: number): Promise<CaseSimilarity[]> {
    const res = await api.get(`/cases/${id}/similar`);
    return res.data;
  },

  async resetMockData(): Promise<{ message: string }> {
    const res = await api.post('/cases/reset-mock-data');
    return res.data;
  }
};
