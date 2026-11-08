import { api } from './api';
import { SystemStats, AnomalyAlert } from '../types';

export const analyticsService = {
  async getStats(): Promise<SystemStats> {
    const res = await api.get('/analytics/stats');
    return res.data;
  },

  async getCentralityMetrics(limit: number = 10) {
    const res = await api.get('/analytics/centrality', { params: { limit } });
    return res.data;
  },

  async getAnomalies(): Promise<AnomalyAlert[]> {
    const res = await api.get('/analytics/anomalies');
    return res.data;
  },

  async getAlerts() {
    const res = await api.get('/alerts');
    return res.data;
  },

  async getMapEvents() {
    const res = await api.get('/locations/map-events');
    return res.data;
  }
};
