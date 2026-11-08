import React, { useState } from 'react';
import { 
  Bot, Send, Sparkles, FileText, ShieldCheck, Copy, Check, 
  Database, Filter, Search, DollarSign, Network, GitCompare, AlertTriangle, Folder 
} from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { AssistantResponse } from '../types';
import { Disclaimer } from '../components/common/Disclaimer';
import { useTheme } from '../context/ThemeContext';

export const AssistantPage: React.FC = () => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await assistantService.queryAssistant(query);
      setResult(res);
    } catch {
      alert('Assistant query failed. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const queryCategories = [
    {
      category: 'Key Entities & Graph',
      icon: Network,
      queries: [
        'Who are the top connected entities across cases?',
        'Who are the key suspects in active investigations?',
        'What vehicles or phones have multiple links?'
      ]
    },
    {
      category: 'Cross-Case Linkages',
      icon: GitCompare,
      queries: [
        'Are there any cross-case entity overlaps or shared phones?',
        'Which cases share suspects or vehicles?',
        'Find links between FIRs in different jurisdictions'
      ]
    },
    {
      category: 'Financial Trails',
      icon: DollarSign,
      queries: [
        'What financial transactions were recorded?',
        'Find high-value transfers above ₹50,000',
        'Show money trail and account numbers'
      ]
    },
    {
      category: 'Case Dossiers & Timelines',
      icon: Folder,
      queries: [
        'Summarize active investigation cases.',
        'Show chronological investigation events and timeline.',
        'What evidence documents were uploaded?'
      ]
    },
    {
      category: 'Anomalies & Flags',
      icon: AlertTriangle,
      queries: [
        'What pattern anomalies were detected?',
        'Show suspicious transaction spikes or volume outliers',
        'Flag dense network clusters and suspect hubs'
      ]
    }
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
            className={`font-bold text-sm mt-3 mb-1.5 ${isDark ? 'text-cyan-300' : 'text-cyan-700 font-extrabold'}`}
          >
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} text-xs mt-0.5 font-bold`}>•</span>
            <span
              className={`flex-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }}
            />
          </div>
        );
      }
      // Numbered or nested bullet
      if (line.trim().startsWith('  - ')) {
        const content = line.trim().substring(4);
        return (
          <div key={idx} className={`flex items-start gap-2 ml-5 my-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-[10px] mt-1`}>▫</span>
            <span
              className="flex-1 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }}
            />
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className={`my-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    const strongClass = isDark ? 'text-white font-semibold' : 'text-slate-900 font-bold';
    const emClass = isDark ? 'text-slate-300' : 'text-slate-700';
    const codeClass = isDark
      ? 'bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px] border border-slate-800'
      : 'bg-slate-200 px-1.5 py-0.5 rounded text-cyan-800 font-mono text-[11px] border border-slate-300 font-semibold';

    return text
      .replace(/\*\*(.*?)\*\*/g, `<strong class="${strongClass}">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em class="${emClass}">$1</em>`)
      .replace(/`([^`]+)`/g, `<code class="${codeClass}">$1</code>`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Explainable AI Investigation Assistant <Sparkles className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded multi-strategy retrieval decision-support engine with verifiable source document citations
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-cyan-300 font-mono">
          <Database className="w-3.5 h-3.5" />
          <span>Zero-Hallucination Grounding</span>
        </div>
      </div>

      <Disclaimer compact />

      {/* Interactive Query Search Bar */}
      <form onSubmit={handleSubmit} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ask an investigation query (e.g. Who is suspect Vikram? Which cases share phone nodes?)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 pl-10 pr-4 py-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-medium transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Analyzing Records...' : 'Query Assistant'}</span>
          </button>
        </div>

        {/* Prompt Categories */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Investigation Exploration Topics:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {queryCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{cat.category}</span>
                  </div>
                  <div className="space-y-1.5">
                    {cat.queries.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setQuery(q)}
                        className="w-full text-left bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-[11px] transition-colors truncate block"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>

      {/* Results Output Section */}
      {result && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div className="font-bold text-sm text-white">Grounded Analytical Assessment</div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Match Confidence: {Math.round(result.confidence * 100)}%
              </span>
              <button
                onClick={handleCopy}
                title="Copy report text"
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Formatted Answer Body */}
          <div className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-5 rounded-xl border border-slate-800">
            {renderFormattedText(result.answer)}
          </div>

          {/* Traceable Source Documents */}
          {result.sources.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Traceable Source Records ({result.sources.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.sources.map((s, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-bold text-cyan-400">
                      <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                        {s.filename || s.document_code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {s.case_number}
                      </span>
                    </div>
                    {s.relevance_snippet && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        "{s.relevance_snippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="pt-3 border-t border-slate-800 text-xs text-amber-300 italic flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};

