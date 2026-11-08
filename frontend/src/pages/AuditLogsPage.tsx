import React, { useEffect, useState } from 'react';
import { History, User, Clock, Folder, FileText } from 'lucide-react';
import { auditService } from '../services/auditService';
import { AuditLog } from '../types';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await auditService.getAuditLogs(200);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const actionVariant = (action: string): 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue' => {
    if (action.includes('LOGIN')) return 'emerald';
    if (action.includes('UPLOAD')) return 'cyan';
    if (action.includes('CREATE')) return 'blue';
    if (action.includes('VERIFY')) return 'amber';
    if (action.includes('REPORT')) return 'rose';
    return 'cyan';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">Comprehensive investigator activity logging for compliance and accountability</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading audit trail records...</div>
      ) : (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource Type</th>
                <th className="p-4">Resource ID</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-white">{log.username || `User #${log.user_id}`}</td>
                  <td className="p-4"><Badge label={log.action} variant={actionVariant(log.action)} /></td>
                  <td className="p-4 text-slate-300">{log.resource_type || '—'}</td>
                  <td className="p-4 font-mono text-cyan-400">{log.resource_id || '—'}</td>
                  <td className="p-4 font-mono text-slate-500">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
