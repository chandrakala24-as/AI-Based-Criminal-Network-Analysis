import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('investigator');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid username or password credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Theme Toggle Button in Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glowing Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Box */}
      <div className="w-full max-w-md bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 flex items-center justify-center mx-auto">
            <Network className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              CrimeGraph <span className="text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-mono">AI</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Criminal Network Analysis & Intelligence</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Investigation Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Sign-in Shortcuts */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider text-center mb-3">
            Quick Demo Environment Sign-in
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoClick('investigator', 'demo123')}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Investigator</div>
              <div className="text-[10px] text-cyan-400 font-mono">investigator / demo123</div>
            </button>

            <button
              onClick={() => handleDemoClick('admin', 'admin123')}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Admin</div>
              <div className="text-[10px] text-indigo-400 font-mono">admin / admin123</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Mandatory Legal Banner */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-lg">
        <p className="flex items-center justify-center gap-1.5 text-slate-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Decision-Support Investigation System
        </p>
        <p>All AI outputs are analytical leads requiring independent human verification.</p>
      </div>
    </div>
  );
};
