import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FolderGit2, Users, Network, GitCompare, 
  Clock, MapPin, Bell, ShieldCheck, FileSpreadsheet, History, Settings, Bot
} from 'lucide-react';

interface SidebarProps {
  onToggleAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onToggleAssistant }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/cases', icon: FolderGit2 },
    { label: 'Entities', path: '/entities', icon: Users },
    { label: 'Network Graph', path: '/graph', icon: Network },
    { label: 'Cross-Case Links', path: '/cross-case', icon: GitCompare },
    { label: 'Timeline', path: '/timeline', icon: Clock },
    { label: 'Map Intelligence', path: '/map', icon: MapPin },
    { label: 'Alerts', path: '/alerts', icon: Bell },
    { label: 'Evidence Integrity', path: '/evidence', icon: ShieldCheck },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Audit Logs', path: '/audit-logs', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <Network className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide leading-none flex items-center gap-1.5">
            CrimeGraph <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">Investigation Intel</p>
        </div>
      </div>

      {/* AI Assistant Quick Launcher */}
      <div className="p-3">
        <button
          onClick={onToggleAssistant}
          className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all duration-200"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800 bg-[#0B0F19]/50 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          System Online
        </span>
        <span className="font-mono text-[10px] text-slate-400">v1.0.0</span>
      </div>
    </aside>
  );
};
