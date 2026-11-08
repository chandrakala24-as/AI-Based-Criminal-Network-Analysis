import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Monitor, Bot, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api, BACKEND_URL } from '../../services/api';

export const SystemStatusToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    frontend: 'connected' | 'error' | 'checking';
    backend: 'connected' | 'error' | 'checking';
    database: 'connected' | 'error' | 'checking';
    assistant: 'connected' | 'error' | 'checking';
  }>({
    frontend: 'connected',
    backend: 'checking',
    database: 'checking',
    assistant: 'checking'
  });

  const checkStatus = async () => {
    setLoading(true);
    setStatus(s => ({ ...s, backend: 'checking', database: 'checking', assistant: 'checking' }));
    
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          frontend: 'connected',
          backend: 'connected',
          database: data.database === 'connected' ? 'connected' : 'error',
          assistant: 'connected'
        });
      } else {
        throw new Error("Backend not responding");
      }
    } catch (error) {
      setStatus({
        frontend: 'connected',
        backend: 'error',
        database: 'error',
        assistant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const StatusIcon = ({ state }: { state: string }) => {
    if (state === 'checking') return <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />;
    if (state === 'connected') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <XCircle className="w-4 h-4 text-rose-500" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
          isOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Activity className="w-4 h-4" />
        <span className="hidden sm:inline">System Status</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h3 className="text-sm font-semibold text-slate-200">Connection Status</h3>
            <button onClick={checkStatus} disabled={loading} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
          
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Frontend UI</span>
              </div>
              <StatusIcon state={status.frontend} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Backend API</span>
              </div>
              <StatusIcon state={status.backend} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database</span>
              </div>
              <StatusIcon state={status.database} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI Assistant Engine</span>
              </div>
              <StatusIcon state={status.assistant} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
