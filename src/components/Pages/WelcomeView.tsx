import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Server,
  Code,
  Terminal,
  Globe,
  ScanText,
  Zap,
  ArrowRight,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Layers,
  Smile,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Session, Provider, AppSettings } from '../../types';
import { MODELS } from '../../services/aiService';
import { PremiumAvatar } from '../PremiumAvatar';
import { BEHAVIOR_CONFIGS, AgentBehaviorState, EXPRESSIONS, STATES } from '../../bot';

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
  activeProvider,
  settings,
  onStartNewChat,
  onQuickPrompt,
  onOpenProviderPicker,
  onOpenModelPicker
}) => {
  const allModelsMap: Record<string, any> = { ...MODELS, ...(settings.customModels || {}) };
  const currentModelName = settings.mod === 'auto'
    ? 'Auto (Task Router)'
    : allModelsMap[settings.mod]?.name || settings.mod;

  const isWorking = !activeProvider || activeProvider.status !== 'error';

  // Avatar Studio Test State
  const [selectedBehavior, setSelectedBehavior] = useState<AgentBehaviorState>('idle');
  const [customExpr, setCustomExpr] = useState<string | null>(null);
  const [customAnim, setCustomAnim] = useState<string | null>(null);
  const [showAllExpressions, setShowAllExpressions] = useState(false);

  const quickPrompts = [
    {
      id: 'applet',
      title: 'Interactive Web App',
      category: 'Frontend & UI',
      desc: 'Build a full single-page web app with Tailwind CSS, charts, and reactive widgets.',
      prompt: 'Build a modern, interactive single-page web app in HTML with Tailwind CSS and Chart.js widgets for tracking daily tasks and productivity stats.',
      icon: Code,
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    },
    {
      id: 'python',
      title: 'Python Math & Data',
      category: 'Computation',
      desc: 'Execute Python scripts in a sandboxed runtime to calculate matrices, stats & algorithms.',
      prompt: 'Run Python to compute the first 30 Fibonacci numbers, calculate their golden ratio convergences, and print summary statistics.',
      icon: Terminal,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      id: 'search',
      title: 'Web Research & Facts',
      category: 'Intelligence',
      desc: 'Perform live Google and Wikipedia searches to synthesize technical facts and updates.',
      prompt: 'Search the web for recent 2026 developments in quantum computing and AI LLM architectures, then summarize the key breakthroughs.',
      icon: Globe,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'image',
      title: 'AI Image Generation',
      category: 'Creative Art',
      desc: 'Generate photorealistic artwork, 3D renders, or UI mockups directly in conversation.',
      prompt: 'Generate an AI image of a futuristic workspace with glowing holographic displays and neon cyan lighting in photorealistic 8k style.',
      icon: ScanText,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      id: 'automation',
      title: 'Workflow Automation',
      category: 'Integrations',
      desc: 'Trigger automated workflows to process data, send reports, or sync API records.',
      prompt: 'Execute Zapier AI Action to send a test summary email and explain how to connect 6000+ app integrations.',
      icon: Zap,
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    }
  ];

  const behaviorKeys: AgentBehaviorState[] = ['idle', 'thinking', 'speaking', 'analyzing', 'success', 'error', 'listening', 'waiting'];

  return (
    <div className="h-full w-full max-w-lg mx-auto flex flex-col justify-start items-stretch px-3.5 py-4 sm:py-6 select-none animate-fadeIn overflow-y-auto custom-scrollbar gap-4 pb-28">
      
      {/* Mobile One UI Brand Header with Live Reactive Avatar */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative mb-3 group cursor-pointer">
          <div className="absolute -inset-3 bg-gradient-to-r from-[var(--accent)] to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-65 transition duration-500" />
          <PremiumAvatar
            behaviorState={selectedBehavior}
            expression={customExpr || undefined}
            animState={customAnim || undefined}
            interactive={true}
            className="w-20 h-20 !rounded-3xl shadow-2xl relative z-10"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-sans">
          GBG <span className="text-[var(--accent)]">AI Studio</span>
        </h1>
        <p className="text-xs text-[#a1a1aa] max-w-xs mx-auto leading-relaxed mt-1 font-sans">
          {BEHAVIOR_CONFIGS[selectedBehavior]?.labelAr} • {BEHAVIOR_CONFIGS[selectedBehavior]?.labelEn}
        </p>

        {/* Quick Avatar Behavior Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-md px-1">
          {behaviorKeys.map(bKey => {
            const cfg = BEHAVIOR_CONFIGS[bKey];
            const isSelected = selectedBehavior === bKey && !customExpr;
            return (
              <button
                key={bKey}
                onClick={() => {
                  setSelectedBehavior(bKey);
                  setCustomExpr(null);
                  setCustomAnim(null);
                }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)] scale-105'
                    : 'bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46]'
                }`}
              >
                {bKey === 'thinking' && '💭 '}
                {bKey === 'speaking' && '✍️ '}
                {bKey === 'analyzing' && '⚡ '}
                {bKey === 'success' && '✨ '}
                {bKey === 'error' && '🚨 '}
                {bKey === 'listening' && '👂 '}
                {bKey === 'idle' && '🟢 '}
                {bKey === 'waiting' && '🧘 '}
                {cfg.labelAr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Avatar Expressions Accordion */}
      <div className="w-full rounded-[22px] bg-[#141418] border border-[#27272a] p-3.5 shadow-lg flex flex-col gap-2">
        <div
          onClick={() => setShowAllExpressions(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none text-xs font-bold text-white hover:text-[var(--accent)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Smile size={15} className="text-[var(--accent)]" />
            <span>محرك التعابير والمشاعر (22 تعبير + 6 حركات)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#71717a]">
            <span>{showAllExpressions ? 'إخفاء' : 'عرض الكل'}</span>
            {showAllExpressions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {showAllExpressions && (
          <div className="pt-2 flex flex-col gap-3 animate-fadeIn border-t border-[#222228] mt-1">
            {/* Expressions grid */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider mb-1.5 flex items-center gap-1">
                <Smile size={11} />
                <span>التعابير المشاعرية (Expressions)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {EXPRESSIONS.map(expr => (
                  <button
                    key={expr.id}
                    onClick={() => setCustomExpr(expr.id)}
                    className={`px-2 py-1.5 rounded-xl text-[10.5px] font-mono text-center border transition-all cursor-pointer truncate ${
                      customExpr === expr.id
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md'
                        : 'bg-[#1a1a20] border-[#292932] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)]/50'
                    }`}
                  >
                    {expr.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation States */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider mb-1.5 flex items-center gap-1">
                <Activity size={11} />
                <span>حالات الحركة والتحريك (Dynamic States)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STATES.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setCustomAnim(st.id)}
                    className={`px-2 py-1.5 rounded-xl text-[10.5px] font-mono text-center border transition-all cursor-pointer truncate ${
                      customAnim === st.id
                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-md'
                        : 'bg-[#1a1a20] border-[#292932] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)]/50'
                    }`}
                  >
                    {st.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Samsung One UI Mobile Action & Configuration Card */}
      <div className="w-full rounded-[24px] bg-[#141418] border border-[#27272a] p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#24242c]">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Setup</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1b1b22] border border-[#2c2c36] text-[10px] text-emerald-400 font-mono">
            <ShieldCheck size={11} />
            <span>Ready</span>
          </div>
        </div>

        {/* Provider Sheet Trigger Row */}
        <button
          onClick={onOpenProviderPicker}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1c1c22] hover:bg-[#23232c] active:scale-[0.99] border border-[#2e2e38] hover:border-[var(--accent)]/50 transition-all cursor-pointer text-left"
          title="Tap to select AI Provider"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
              <Server size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-[#8e8e99] tracking-wider">Provider</div>
              <div className="font-bold text-xs text-white truncate">{activeProvider?.name || 'Select Provider'}</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#71717a] shrink-0" />
        </button>

        {/* Model Sheet Trigger Row */}
        <button
          onClick={onOpenModelPicker}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1c1c22] hover:bg-[#23232c] active:scale-[0.99] border border-[#2e2e38] hover:border-[var(--accent)]/50 transition-all cursor-pointer text-left"
          title="Tap to select AI Model"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-[#8e8e99] tracking-wider flex items-center gap-1.5">
                <span>Model</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'}`}
                  title={isWorking ? 'Model connected' : 'Provider connection error / Missing key'}
                />
              </div>
              <div className="font-bold text-xs font-mono text-emerald-400 truncate">{currentModelName}</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#71717a] shrink-0" />
        </button>

        {/* Prominent Start New Chat CTA */}
        <button
          onClick={onStartNewChat}
          className="w-full mt-1 py-3.5 px-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-light)] transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Start New Conversation</span>
        </button>
      </div>

      {/* Suggested Quick Starters Section */}
      <div className="w-full flex flex-col gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#71717a] uppercase tracking-wider px-1">
          <Zap size={13} className="text-[var(--accent)]" />
          <span>Capabilities & Starters</span>
        </div>

        <div className="flex flex-col gap-2">
          {quickPrompts.map(qp => {
            const Icon = qp.icon;
            return (
              <button
                key={qp.id}
                onClick={() => onQuickPrompt(qp.prompt)}
                className="group w-full p-3 rounded-2xl bg-[#141418]/90 hover:bg-[#1a1a22] active:scale-[0.99] border border-[#27272a] hover:border-[var(--accent)]/50 transition-all cursor-pointer flex items-center justify-between gap-3 text-left shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border ${qp.badgeColor} flex items-center justify-center shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-[var(--accent)] transition-colors truncate">
                        {qp.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1f1f26] text-[#8e8e99] border border-[#2e2e38] shrink-0">
                        {qp.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717a] line-clamp-1 mt-0.5">
                      {qp.desc}
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-xl bg-[#1a1a20] border border-[#2a2a34] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                  <ArrowRight size={13} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

