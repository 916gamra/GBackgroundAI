import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Clock,
  Trash2,
  Server,
  ChevronRight,
  Code,
  Terminal,
  BarChart3,
  Globe,
  ScanText,
  Zap,
  ArrowRight,
  Cpu,
  Database,
  Layers,
  Search,
  Bot
} from 'lucide-react';
import { Session, Provider, AppSettings } from '../../types';
import { MODELS } from '../../services/aiService';

interface WelcomeViewProps {
  sessions: Session[];
  activeProvider: Provider;
  settings: AppSettings;
  onStartNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onQuickPrompt: (prompt: string) => void;
  onOpenProviderPicker: () => void;
  onOpenModelPicker: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  sessions,
  activeProvider,
  settings,
  onStartNewChat,
  onSelectSession,
  onDeleteSession,
  onQuickPrompt,
  onOpenProviderPicker,
  onOpenModelPicker
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter valid sessions with history or titles
  const validSessions = sessions.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchesTitle = s.title.toLowerCase().includes(q);
    const matchesHistory = s.history.some(m => (m.content || '').toLowerCase().includes(q));
    return matchesTitle || matchesHistory;
  });

  const allModelsMap: Record<string, any> = { ...MODELS, ...(settings.customModels || {}) };
  const currentModelName = settings.mod === 'auto'
    ? 'Auto (Task Router)'
    : allModelsMap[settings.mod]?.name || settings.mod;

  const quickPrompts = [
    {
      id: 'applet',
      title: 'Interactive Web Applet',
      arabicTitle: 'تطبيق ويب تفاعلي',
      desc: 'Build a full single-page HTML application with Tailwind CSS, charts and interactive controls.',
      prompt: 'Build a modern, interactive single-page web app in HTML with Tailwind CSS and Chart.js widgets for tracking daily tasks and productivity stats.',
      icon: Code,
      color: 'from-sky-500/20 to-blue-600/20 text-sky-400 border-sky-500/30'
    },
    {
      id: 'python',
      title: 'Python Math & Data Analysis',
      arabicTitle: 'تحليل بيانات وكود بايثون',
      desc: 'Execute Python scripts in a Pyodide browser sandbox to calculate stats, matrices & distributions.',
      prompt: 'Run Python to compute the first 30 Fibonacci numbers, calculate their golden ratio convergences, and print summary statistics.',
      icon: Terminal,
      color: 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'search',
      title: 'Real-time Web Research',
      arabicTitle: 'بحث إنترنت معزز ومحدث',
      desc: 'Perform live Google and Wikipedia searches to synthesize fresh news and technical facts.',
      prompt: 'Search the web for recent 2026 developments in quantum computing and AI LLM architectures, then summarize the key breakthroughs.',
      icon: Globe,
      color: 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'image',
      title: 'AI Image Generation',
      arabicTitle: 'توليد صور ووسائط بذكاء',
      desc: 'Generate photorealistic artwork, 3D renders, or UI mockups directly inside chat.',
      prompt: 'Generate an AI image of a futuristic workspace with glowing holographic displays and neon cyan lighting in photorealistic 8k style.',
      icon: ScanText,
      color: 'from-purple-500/20 to-pink-600/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'automation',
      title: 'Zapier & Make Automation',
      arabicTitle: 'أتمتة المهام والتطبيقات',
      desc: 'Trigger automated workflows to send emails, update Google Sheets or sync database CRM records.',
      prompt: 'Execute Zapier AI Action to send a test summary email and explain how to connect 6000+ app integrations.',
      icon: Zap,
      color: 'from-orange-500/20 to-red-600/20 text-orange-400 border-orange-500/30'
    }
  ];

  return (
    <div className="h-full max-w-6xl mx-auto w-full flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5 overflow-hidden select-none animate-fadeIn">
      {/* Welcome Hero & Compact Quick Starters Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#18181c] via-[#121215] to-[#0d0d10] border border-[#27272a] p-5 md:p-6 shadow-2xl overflow-hidden shrink-0">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Bar: Title & Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 shadow-lg shadow-[var(--accent-light)]">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  مرحباً بك في <span className="text-[var(--accent)]">GBG AI Studio</span>
                </h1>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  منصة الذكاء الاصطناعي المتقدمة للبرمجة والأتمتة والبحث
                </p>
              </div>
            </div>

            <button
              onClick={onStartNewChat}
              className="px-5 py-2.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[var(--accent-light)] transition-all transform hover:scale-105 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>بدء محادثة جديدة (New Chat)</span>
            </button>
          </div>

          {/* Active Provider & Model Status Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs bg-[#0e0e11]/80 p-2.5 rounded-2xl border border-[#27272a]">
            <button
              onClick={onOpenProviderPicker}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#18181c] hover:bg-[#202026] border border-[#27272a] hover:border-[var(--accent)] font-semibold text-white transition-all cursor-pointer"
            >
              <Server size={13} className="text-[var(--accent)]" />
              <span className="text-[#a1a1aa] text-[11px]">Provider:</span>
              <span className="text-white text-[11px]">{activeProvider?.name || 'Provider'}</span>
            </button>

            <button
              onClick={onOpenModelPicker}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#18181c] hover:bg-[#202026] border border-[#27272a] hover:border-[var(--accent)] font-semibold text-white transition-all cursor-pointer"
            >
              <Cpu size={13} className="text-emerald-400" />
              <span className="text-[#a1a1aa] text-[11px]">Model:</span>
              <span className="text-emerald-300 font-mono text-[11px]">{currentModelName}</span>
            </button>
          </div>

          {/* Compact Quick Starter Cards Grid (Inside Hero Container) */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">
              <Zap size={13} className="text-[var(--accent)]" />
              <span>اختصارات للبدء الفوري (Quick Starters)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {quickPrompts.map(qp => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.id}
                    onClick={() => onQuickPrompt(qp.prompt)}
                    className="group text-left p-2.5 rounded-xl bg-[#121215] hover:bg-[#1a1a20] border border-[#27272a] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-2.5 shadow-sm"
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${qp.color} border flex items-center justify-center shrink-0`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[11px] text-white truncate group-hover:text-[var(--accent)] transition-colors">
                        {qp.arabicTitle}
                      </div>
                      <div className="text-[9.5px] text-[#71717a] truncate font-mono">
                        {qp.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations Dedicated Scrollable Container */}
      <div className="flex-1 flex flex-col min-h-0 rounded-3xl bg-[#121215]/80 border border-[#27272a] p-4 md:p-5 shadow-xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#27272a] shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>المحادثات السابقة (Chat History)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#18181c] border border-[#27272a] text-[10px] text-[var(--accent)] font-mono">
                  {validSessions.length}
                </span>
              </h2>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث في السجل..."
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl py-1 pl-8 pr-3 text-xs text-white placeholder-[#71717a] outline-none focus:border-[var(--accent)] font-sans"
            />
          </div>
        </div>

        {/* Scrollable Conversations Grid Container */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1 custom-scrollbar">
          {validSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-[#71717a] py-8 text-center">
              <MessageSquare size={28} className="opacity-30" />
              <div className="text-xs">
                {searchTerm ? 'لا توجد محادثة تطابق خيارات البحث' : 'لا توجد محادثات سابقة مخزنة حالياً'}
              </div>
              <button
                onClick={onStartNewChat}
                className="mt-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>بدء محادثة جديدة</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {validSessions.map(s => {
                const msgCount = s.history.filter(m => m.role === 'user' || m.role === 'assistant').length;
                const lastMsg = s.history[s.history.length - 1];
                const dateStr = new Date(s.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="group p-3.5 rounded-2xl bg-[#18181c]/90 border border-[#27272a] hover:border-[var(--accent)] hover:bg-[#1c1c22] transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a20] border border-[#2a2a32] text-[var(--accent)] flex items-center justify-center shrink-0">
                          <Bot size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate group-hover:text-[var(--accent)] transition-colors">
                            {s.title || 'محادثة جديدة'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#71717a] font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span>{msgCount} رسائل</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                        className="p-1 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="حذف المحادثة"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {lastMsg && (
                      <div className="p-2 rounded-xl bg-[#121215] border border-[#222228] text-[11px] text-[#a1a1aa] line-clamp-2 font-mono leading-relaxed">
                        {lastMsg.content || 'محتوى المحادثة...'}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#222228] text-[10.5px] font-semibold text-[var(--accent)]">
                      <span>متابعة المحادثة</span>
                      <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
