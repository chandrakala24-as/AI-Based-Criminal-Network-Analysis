import React from 'react';
import { Settings as SettingsIcon, Shield, Database, Cpu, Lock, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Security settings, user profile, appearance themes, and system metadata</p>
      </div>

      {/* Appearance & Theme Configuration Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <span>Appearance & Interface Theme</span>
          </h3>
          <ThemeToggle variant="pill" />
        </div>
        <p className="text-xs text-slate-400">
          Switch between dark cybersecurity mode and crisp daylight white mode for courtroom presentations and document reviews.
        </p>
        <ThemeToggle variant="cards" />
      </div>

      {/* User Profile Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" /> Active User Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Username</div>
            <div className="text-white font-bold mt-1">{user?.username}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Role</div>
            <div className="mt-1"><Badge label={user?.role || 'VIEWER'} variant="cyan" size="md" /></div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Email</div>
            <div className="text-white font-medium mt-1">{user?.email}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Account Status</div>
            <div className="mt-1"><Badge label={user?.active ? 'ACTIVE' : 'INACTIVE'} variant="emerald" size="md" /></div>
          </div>
        </div>
      </div>

      {/* RBAC Matrix Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-400" /> RBAC Access Control Matrix</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Permission</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Investigator</th>
                <th className="p-3 text-center">Analyst</th>
                <th className="p-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-center">
              {[
                ['Manage Users', '✅', '❌', '❌', '❌'],
                ['Create Cases', '✅', '✅', '❌', '❌'],
                ['Upload Documents', '✅', '✅', '❌', '❌'],
                ['View Analytics', '✅', '✅', '✅', '❌'],
                ['Generate Reports', '✅', '✅', '✅', '❌'],
                ['Read-only Access', '✅', '✅', '✅', '✅'],
              ].map(([perm, ...vals], idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 text-left text-slate-200 font-medium">{perm}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="p-3">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Metadata */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="font-bold text-base text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-400" /> System Metadata</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Backend Engine</div>
            <div className="text-white font-mono mt-1">FastAPI + SQLAlchemy + NetworkX</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">NLP Pipeline</div>
            <div className="text-white font-mono mt-1">spaCy + Regex Hybrid NER</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Evidence Integrity</div>
            <div className="text-white font-mono mt-1">SHA-256 Local Block Ledger</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Auth Protocol</div>
            <div className="text-white font-mono mt-1">JWT + PBKDF2 HMAC-SHA256</div>
          </div>
        </div>
      </div>
    </div>
  );
};
