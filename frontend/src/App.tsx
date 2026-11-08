import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { ChatAssistant } from './components/assistant/ChatAssistant';
import { DocumentUploadModal } from './components/upload/DocumentUploadModal';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { EntitiesPage } from './pages/EntitiesPage';
import { EntityDetailPage } from './pages/EntityDetailPage';
import { GraphPage } from './pages/GraphPage';
import { CrossCasePage } from './pages/CrossCasePage';
import { TimelinePage } from './pages/TimelinePage';
import { MapPage } from './pages/MapPage';
import { AlertsPage } from './pages/AlertsPage';
import { EvidencePage } from './pages/EvidencePage';
import { AssistantPage } from './pages/AssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Authenticating session...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import { Bot, Sparkles, X } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Global Keyboard Shortcut: Alt + A or Ctrl + Space
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B0F19] relative">
      <Sidebar onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
          isAssistantOpen={isAssistantOpen}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/entities" element={<EntitiesPage />} />
            <Route path="/entities/:type/:id" element={<EntityDetailPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/cross-case" element={<CrossCasePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Action Button (FAB) for AI Assistant */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          title="Toggle AI Assistant (Alt+A)"
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            isAssistantOpen
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-cyan-500/10'
              : 'bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50'
          }`}
        >
          {/* Animated Glow Halo */}
          {!isAssistantOpen && (
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />
          )}

          <div className="relative flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xs tracking-wide">
              {isAssistantOpen ? 'Close AI' : 'Ask AI'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-spin-slow" />
          </div>

          {/* Quick Keyboard Hint Tooltip */}
          <span className="hidden xl:inline text-[10px] opacity-75 font-mono ml-1 px-1.5 py-0.5 rounded bg-black/30">
            Alt+A
          </span>
        </button>
      </div>

      {/* Global Floating AI Assistant Drawer */}
      <ChatAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      {/* Global Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
