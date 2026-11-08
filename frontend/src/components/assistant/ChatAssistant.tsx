import React, { useState } from 'react';
import { 
  Bot, Send, X, FileText, ExternalLink, ShieldCheck, Sparkles, 
  Trash2, Copy, Check, Filter, Layers, Database, ChevronDown, ChevronUp 
} from 'lucide-react';
import { assistantService } from '../../services/assistantService';
import { AssistantResponse, SourceReference } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: number;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  confidence?: number;
  sources?: SourceReference[];
  disclaimer?: string;
  scope?: 'global' | 'case';
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose, caseId }) => {
  const { isDark } = useTheme();
  const [scope, setScope] = useState<'global' | 'case'>(caseId ? 'case' : 'global');
  const [showSources, setShowSources] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '### Hello, Investigator.\nI am **CrimeGraph AI Grounded Assistant**. Ask me anything about:\n- **Entity Intelligence**: Persons, suspect aliases, mobile numbers, vehicle registrations\n- **Case Dossiers**: Summaries, active investigations, timelines, and milestones\n- **Financial Trails**: High-value transactions, money transfers, and anomalous volumes\n- **Network Graph Hubs**: Centrality scores, cross-case shared nodes, and fraud alerts',
      disclaimer: 'All insights are grounded in verified database records and require investigator verification.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      scope: scope
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res: AssistantResponse = await assistantService.queryAssistant(userText, caseId, scope);
      const botMsg: MessageItem = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        confidence: res.confidence,
        sources: res.sources,
        disclaimer: res.disclaimer,
        scope: scope
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Unable to process query against active investigation records. Please check your query or verify backend connectivity.',
          disclaimer: 'Requires investigator verification.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Session cleared. Ask a new investigation query to analyze case dossiers or network nodes.',
        disclaimer: 'Requires investigator verification.'
      }
    ]);
  };

  const sampleQueries = [
    "Who are the top connected entities?",
    "Summarize active investigation cases.",
    "Which cases share a phone number or suspect?",
    "What financial transactions were recorded?",
    "What anomalies were detected?"
  ];

  // Helper to render markdown-like formatting cleanly
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4
            key={idx}
            className={`font-bold text-xs mt-2 mb-1 ${isDark ? 'text-cyan-300' : 'text-cyan-700 font-extrabold'}`}
          >
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-1">
            <span className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} text-[10px] mt-0.5 font-bold`}>•</span>
            <span className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
          </div>
        );
      }
      // Numbered or nested bullet
      if (line.trim().startsWith('  - ')) {
        const content = line.trim().substring(4);
        return (
          <div key={idx} className={`flex items-start gap-1.5 ml-4 my-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-[8px] mt-1`}>▫</span>
            <span className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />;
    });
  };

  const formatInlineMarkdown = (text: string) => {
    const strongClass = isDark ? 'text-white font-semibold' : 'text-slate-900 font-bold';
    const emClass = isDark ? 'text-slate-300' : 'text-slate-700';
    const codeClass = isDark 
      ? 'bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono text-[10px] border border-slate-800' 
      : 'bg-slate-200 px-1 py-0.5 rounded text-cyan-800 font-mono text-[10px] border border-slate-300 font-semibold';

    return text
      .replace(/\*\*(.*?)\*\*/g, `<strong class="${strongClass}">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em class="${emClass}">$1</em>`)
      .replace(/`([^`]+)`/g, `<code class="${codeClass}">$1</code>`);
  };

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 w-[420px] max-w-[100vw] z-50 shadow-2xl flex flex-col animate-slide-left font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0F172A] border-l border-slate-800' : 'bg-white border-l border-slate-200 shadow-cyan-950/10'
      }`}
    >
      {/* Drawer Header */}
      <div
        className={`p-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              CrimeGraph AI <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            </h3>
            <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Grounded Investigation Intel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            title="Clear Chat History"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/80' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Assistant"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scope & Mode Toggle Toolbar */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between text-[11px] ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Knowledge Scope Toggle */}
        <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <button
            onClick={() => setScope('global')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all text-[10px] font-semibold ${
              scope === 'global'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>Global Intel</span>
          </button>
          {caseId && (
            <button
              onClick={() => setScope('case')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all text-[10px] font-semibold ${
                scope === 'case'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Current Case</span>
            </button>
          )}
        </div>

        {/* Source Citations Toggle */}
        <button
          onClick={() => setShowSources(!showSources)}
          title={showSources ? "Hide traceable source cards" : "Show traceable source cards"}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-all ${
            showSources
              ? isDark ? 'bg-slate-800 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-300 font-semibold shadow-sm'
              : isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Sources: {showSources ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div
        className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar ${
          isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInputQuery(q)}
            className={`shrink-0 px-2.5 py-1 rounded-full border transition-all text-[10px] ${
              isDark
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                : 'bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border-slate-200 hover:border-cyan-300 shadow-sm'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className={`flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs ${isDark ? '' : 'bg-slate-50/50'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`group relative max-w-[92%] p-3.5 rounded-2xl leading-relaxed shadow-sm transition-all ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-600/20'
                  : isDark
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Copy message button */}
              {m.sender === 'bot' && (
                <button
                  onClick={() => handleCopy(m.id, m.text)}
                  title="Copy answer"
                  className={`absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}

              {/* Message Content */}
              <div className="text-[12px]">
                {m.sender === 'bot' ? renderFormattedText(m.text) : m.text}
              </div>

              {/* Traceable Source References */}
              {showSources && m.sources && m.sources.length > 0 && (
                <div className={`mt-3 pt-2.5 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-cyan-600 uppercase font-mono tracking-wider">
                    <span>Traceable Grounding Sources ({m.sources.length}):</span>
                    {m.confidence && (
                      <span className={isDark ? 'text-emerald-400' : 'text-emerald-600 font-bold'}>
                        {Math.round(m.confidence * 100)}% Match
                      </span>
                    )}
                  </div>
                  {m.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className={`flex items-center gap-1 truncate max-w-[200px] ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          <FileText className="w-3 h-3 shrink-0" />
                          {s.filename || s.document_code}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          {s.case_number}
                        </span>
                      </div>
                      {s.relevance_snippet && (
                        <p className={`text-[10px] italic line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          "{s.relevance_snippet}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer Badge */}
              {m.disclaimer && (
                <div
                  className={`mt-2.5 pt-2 border-t text-[10px] italic flex items-center gap-1 ${
                    isDark ? 'border-slate-800/60 text-amber-300/90' : 'border-slate-200 text-amber-700 font-medium'
                  }`}
                >
                  <ShieldCheck className={`w-3 h-3 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>{m.disclaimer}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div
            className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl w-fit shadow-md border ${
              isDark ? 'text-slate-300 bg-slate-900/90 border-slate-800' : 'text-slate-700 bg-white border-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-[11px]">Searching cases, entities & document contents...</span>
          </div>
        )}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={handleSend}
        className={`p-3 border-t ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="relative">
          <input
            type="text"
            placeholder={scope === 'case' ? "Ask about this case..." : "Ask investigation question (e.g. Find suspect Vikram, phone 98765...)"}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className={`w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 transition-colors ${
              isDark
                ? 'bg-slate-800/90 text-slate-200 border-slate-700/80 placeholder:text-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white'
            }`}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
