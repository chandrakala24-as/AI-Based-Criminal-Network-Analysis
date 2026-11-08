import { api } from './api';
import { AuditLog } from '../types';

export const auditService = {
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const res = await api.get('/audit-logs', { params: { limit } });
    return res.data;
  }
};
