import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, LogOut, User as UserIcon, ShieldAlert, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenUpload: () => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
}

import { SystemStatusToggle } from './SystemStatusToggle';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC<NavbarProps> = ({ onOpenUpload, onToggleAssistant, isAssistantOpen }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/entities?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Global Search (Persons, Phones, Vehicles, Cases, Documents...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/80 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700/60 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
        />
      </form>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-3">
        {onToggleAssistant && (
          <button
            onClick={onToggleAssistant}
            title="Toggle AI Assistant (Alt+A)"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              isAssistantOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">AI Assistant</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </button>
        )}

        <ThemeToggle />

        <SystemStatusToggle />
        
        {/* Document Upload Button */}
        <button
          onClick={onOpenUpload}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload FIR / Report</span>
        </button>

        {/* User Info Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.username || 'Investigator'}</div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-wider">{user?.role || 'INVESTIGATOR'}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
