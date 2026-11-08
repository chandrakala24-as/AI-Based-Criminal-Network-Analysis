import React from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'cards';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-700/80 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isDark
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !isDark
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {/* Dark Theme Card */}
        <div
          onClick={() => setTheme('dark')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative overflow-hidden ${
            isDark
              ? 'bg-[#0B0F19] border-cyan-500 shadow-xl shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-500 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Dark Theme</h4>
                <span className="text-[10px] text-cyan-400 font-mono">Cyber Investigation Intel</span>
              </div>
            </div>
            {isDark && (
              <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/40">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            High-contrast dark palette tailored for tactical operations, network graph node clarity, and reduced eye strain.
          </p>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>#0B0F19 (OLED Navy) + Cyan Glow</span>
          </div>
        </div>

        {/* Light Theme Card */}
        <div
          onClick={() => setTheme('light')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative overflow-hidden ${
            !isDark
              ? 'bg-white border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-500 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Light Theme</h4>
                <span className="text-[10px] text-amber-600 font-mono">Clean Daylight Presentation</span>
              </div>
            </div>
            {!isDark && (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/40">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Crisp daylight palette designed for bright offices, court evidence presentations, document review, and print exports.
          </p>
          <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] font-mono text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>#F8FAFC (Clean White) + Deep Contrast</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: 'icon' navbar button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-400 border-slate-700/60 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 hover:border-indigo-400 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
          <span className="hidden lg:inline text-slate-200">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform duration-300" />
          <span className="hidden lg:inline text-slate-700">Dark</span>
        </>
      )}
    </button>
  );
};
