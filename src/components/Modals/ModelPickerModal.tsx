import React, { useState, useMemo } from 'react';
import { Search, X, Check, Code, Brain, Zap, Sparkles, Eye, Server, RefreshCw, Layers, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { MODELS, sanitizeApiKey } from '../../services/aiService';
import { ModelConfig, Provider } from '../../types';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModelId: string;
  onSelectModel: (id: string) => void;
  customModels?: Record<string, ModelConfig>;
  activeProvider?: Provider;
  providers?: Provider[];
  onSwitchProvider?: (providerId: string) => void;
  onUpdateProvider?: (provider: Provider) => void;
}

export const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  isOpen,
  onClose,
  currentModelId,
  onSelectModel,
  customModels,
  activeProvider,
  providers,
  onSwitchProvider,
  onUpdateProvider
}) => {
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const [showAllProviderModels, setShowAllProviderModels] = useState(false);

  // Check if provider was configured in Auto Mode
  const isProviderAutoMode = activeProvider?.model === 'auto';
  const configuredModel = activeProvider?.model;

  // Build the models map
  const allModels: Record<string, ModelConfig> = useMemo(() => {
    const combined: Record<string, ModelConfig> = {
      ...MODELS,
      ...(customModels || {})
    };

    if (activeProvider) {
      // Add configured model if missing
      const pMod = activeProvider.model;
      if (pMod && pMod !== 'auto' && !combined[pMod]) {
        combined[pMod] = {
          name: pMod.split('/').pop() || pMod,
          pv: activeProvider.pvType || activeProvider.id,
          t: 0.7,
          p: 0.95,
          mk: 8192,
          cat: 'general',
          desc: `Configured model for ${activeProvider.name}`,
          speed: 8,
          power: 8
        };
      }

      // Add default preset model if missing
      if (activeProvider.defaultModel && !combined[activeProvider.defaultModel]) {
        combined[activeProvider.defaultModel] = {
          name: activeProvider.defaultModel.split('/').pop() || activeProvider.defaultModel,
          pv: activeProvider.pvType || activeProvider.id,
          t: 0.7,
          p: 0.95,
          mk: 8192,
          cat: 'general',
          desc: `Preset default for ${activeProvider.name}`,
          speed: 8,
          power: 8
        };
      }

      // Add available fetched models
      if (activeProvider.availableModels) {
        activeProvider.availableModels.forEach(mId => {
          if (mId && !combined[mId]) {
            combined[mId] = {
              name: mId.split('/').pop() || mId,
              pv: activeProvider.pvType || activeProvider.id,
              t: 0.7,
              p: 0.95,
              mk: 8192,
              cat: 'general',
              desc: `Available on ${activeProvider.name}`,
              speed: 8,
              power: 8
            };
          }
        });
      }
    }

    return combined;
  }, [customModels, activeProvider]);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'code': return <Code size={14} className="text-blue-400" />;
      case 'think': return <Brain size={14} className="text-purple-400" />;
      case 'fast': return <Zap size={14} className="text-amber-400" />;
      case 'vision': return <Eye size={14} className="text-sky-400" />;
      default: return <Sparkles size={14} className="text-emerald-400" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'code': return 'CODE';
      case 'think': return 'REASONING';
      case 'fast': return 'FAST';
      case 'vision': return 'VISION';
      default: return 'GENERAL';
    }
  };

  // Check if a model matches the current active provider
  const isModelForActiveProvider = (m: ModelConfig, id: string): boolean => {
    if (!activeProvider) return true;

    const pType = (activeProvider.pvType || '').toLowerCase();
    const pId = activeProvider.id.toLowerCase();
    const pName = activeProvider.name.toLowerCase();
    const mPv = (m.pv || '').toLowerCase();

    // 1. Explicitly configured model or available model on provider
    if (activeProvider.model === id || activeProvider.defaultModel === id) return true;
    if (activeProvider.availableModels && activeProvider.availableModels.includes(id)) return true;

    // 2. Direct provider match
    if (mPv === pType || mPv === pId) return true;

    // 3. Google Gemini aliases
    if (
      (pType === 'google' || pName.includes('google') || pName.includes('gemini')) &&
      (mPv === 'google' || mPv === 'gemini' || id.startsWith('gemini-') || id.startsWith('google/'))
    ) {
      return true;
    }

    // 4. Groq aliases
    if (
      (pType === 'groq' || pName.includes('groq')) &&
      (mPv === 'groq' || id.startsWith('groq/') || id.includes('(groq)'))
    ) {
      return true;
    }

    // 5. NVIDIA NIM aliases
    if (
      (pType === 'nvidia' || pId === 'nv-builtin' || pName.includes('nvidia')) &&
      (
        mPv === 'nvidia' ||
        id.startsWith('nvidia/') ||
        id.startsWith('qwen/') ||
        id.startsWith('deepseek') ||
        id.startsWith('meta/') ||
        id.startsWith('mistralai/') ||
        id.startsWith('moonshotai/') ||
        id.startsWith('z-ai/') ||
        id.startsWith('minimaxai/') ||
        id.startsWith('openai/gpt-oss') ||
        id.startsWith('google/gemma')
      )
    ) {
      return true;
    }

    return false;
  };

  // Fetch Live Models directly from Provider endpoint
  const handleFetchLiveModels = async () => {
    if (!activeProvider) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      let endpoint = activeProvider.baseUrl.trim();
      if (endpoint.includes('/chat/completions')) {
        endpoint = endpoint.replace('/chat/completions', '/models');
      } else if (endpoint.endsWith('/')) {
        endpoint = `${endpoint}models`;
      } else if (!endpoint.endsWith('/models')) {
        endpoint = `${endpoint}/models`;
      }

      const cleanKey = sanitizeApiKey(activeProvider.apiKey);
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(activeProvider.headers || {})
      };

      if (cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }

      const res = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) {
            errDetail = errJson.error.message;
          }
        } catch {}
        setFetchError(`Failed to fetch models: ${errDetail}`);
        setIsFetching(false);
        return;
      }

      const data = await res.json();
      let list: string[] = [];

      if (Array.isArray(data.data)) {
        list = data.data.map((m: any) => m.id || m.name).filter(Boolean);
      } else if (Array.isArray(data.models)) {
        list = data.models.map((m: any) => m.name || m.id).filter(Boolean);
      } else if (Array.isArray(data)) {
        list = data.map((m: any) => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
      }

      if (list.length > 0) {
        list = Array.from(new Set(list)).sort();
        const updated: Provider = {
          ...activeProvider,
          availableModels: list
        };
        if (onUpdateProvider) {
          onUpdateProvider(updated);
        }
        setFetchSuccess(`Fetched ${list.length} real models directly from ${activeProvider.name}! ✨`);
      } else {
        setFetchError('Response contained 0 models in list.');
      }
    } catch (err: any) {
      setFetchError(`Network error connecting to ${activeProvider.name}: ${err.message || 'Failed to fetch'}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Determine which models to display
  const modelsToDisplay = Object.entries(allModels).filter(([id, m]) => {
    // Check if model belongs to active provider
    const isForActive = isModelForActiveProvider(m, id) ||
      (activeProvider?.availableModels && activeProvider.availableModels.includes(id)) ||
      (configuredModel && (id === configuredModel || id.toLowerCase() === configuredModel.toLowerCase()));

    if (!isForActive) {
      return false;
    }

    const q = search.toLowerCase();
    if (!q) return true;

    return (
      m.name.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      (m.pv && m.pv.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#121215] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] animate-slideUp sm:animate-fadeIn">
        {/* Mobile drag handle */}
        <div className="w-12 h-1 rounded-full bg-[#3f3f46] mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Select AI Engine</h3>
              <p className="text-[11px] text-[#a1a1aa] flex items-center gap-1.5 flex-wrap">
                <span>Active Provider:</span>
                <span className="font-semibold text-white bg-[#1f1f26] px-1.5 py-0.2 rounded text-[10px] border border-[#33333e]">
                  {activeProvider?.name || 'Current Provider'}
                </span>
                {isProviderAutoMode ? (
                  <span className="text-purple-400 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded text-[10px] font-mono">
                    Auto Mode Active
                  </span>
                ) : (
                  <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[10px] font-mono">
                    Configured Model
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Banner for Configured Model vs Auto Mode */}
        {!isProviderAutoMode && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#181820] border border-[#27272a] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <div className="text-[11px] truncate">
                <span className="text-[#a1a1aa]">Configured on Provider: </span>
                <span className="font-bold font-mono text-white truncate">{configuredModel || currentModelId}</span>
              </div>
            </div>

            <button
              onClick={() => setShowAllProviderModels(prev => !prev)}
              className="px-2 py-1 rounded-lg bg-[#22222a] hover:bg-[#2c2c36] border border-[#33333e] text-[10px] font-semibold text-[var(--accent)] hover:text-white transition-all cursor-pointer shrink-0"
            >
              {showAllProviderModels ? 'Show Configured Only' : 'Browse All Models'}
            </button>
          </div>
        )}

        {/* Live Fetch & Search Bar */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search models for ${activeProvider?.name || 'provider'}...`}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-[#71717a] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Direct Fetch Models Button inside Chatbot Page */}
            <button
              onClick={handleFetchLiveModels}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-xs font-semibold text-[var(--accent)] hover:text-white transition-all cursor-pointer shrink-0"
              title="Fetch live model list from provider API"
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin text-amber-400' : ''} />
              <span>{isFetching ? 'Fetching...' : 'Fetch Live Models'}</span>
            </button>
          </div>

          {/* Feedback messages */}
          {fetchSuccess && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{fetchSuccess}</span>
            </div>
          )}
          {fetchError && (
            <div className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono flex items-center gap-1.5">
              <AlertCircle size={12} />
              <span>{fetchError}</span>
            </div>
          )}
        </div>

        {/* Models list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {/* AUTO TASK ROUTER (Shown if Auto mode is active or when browsing all) */}
          {(isProviderAutoMode || showAllProviderModels) &&
            ('auto'.includes(search.toLowerCase()) || 'task router smart auto'.includes(search.toLowerCase())) && (
              <div
                onClick={() => {
                  onSelectModel('auto');
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  currentModelId === 'auto'
                    ? 'bg-[#1c1c24] border-[var(--accent)] shadow-sm'
                    : 'bg-[#141418] border-[#27272a] hover:bg-[#18181f] hover:border-[#3f3f46]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-white">Auto (Smart Task Router)</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-mono font-bold">
                      AUTO ROUTER
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717a] mt-0.5 leading-snug">
                    Automatically routes requests to the optimal model based on query complexity and tools
                  </p>
                </div>
                {currentModelId === 'auto' && <Check size={16} className="text-[var(--accent)] shrink-0 mt-1" />}
              </div>
            )}

          {modelsToDisplay.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#71717a] flex flex-col items-center justify-center gap-2">
              <Server size={24} className="opacity-40" />
              <span>No models currently listed for {activeProvider?.name}</span>
              <button
                onClick={handleFetchLiveModels}
                className="mt-2 text-[var(--accent)] hover:underline text-xs flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={12} />
                <span>Fetch available models from provider API</span>
              </button>
            </div>
          ) : (
            modelsToDisplay.map(([id, m]) => {
              const isSelected = id === currentModelId;
              const pvType = (m.pv || '').toLowerCase();
              let pvBadgeClass = 'bg-blue-500/15 border-blue-500/30 text-blue-400';
              if (pvType === 'groq') {
                pvBadgeClass = 'bg-orange-500/15 border-orange-500/30 text-orange-400';
              } else if (pvType === 'google' || pvType === 'gemini') {
                pvBadgeClass = 'bg-blue-500/15 border-blue-500/30 text-blue-400';
              } else if (pvType === 'nvidia') {
                pvBadgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
              }

              return (
                <div
                  key={id}
                  onClick={() => {
                    onSelectModel(id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#181824] border-[var(--accent)] shadow-md shadow-[var(--accent-light)]'
                      : 'bg-[#141418] border-[#27272a] hover:bg-[#18181f] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isSelected
                      ? 'bg-[var(--accent-light)] border-[var(--accent)]/40 text-[var(--accent)]'
                      : 'bg-[#1c1c20] border-[#27272a] text-[#a1a1aa]'
                  }`}>
                    {getCategoryIcon(m.cat)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-white">{m.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${pvBadgeClass}`}>
                        {(m.pv || 'MODEL').toUpperCase()}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#27272a] text-[#a1a1aa] text-[9px] font-mono font-semibold">
                        {getCategoryLabel(m.cat)}
                      </span>
                      {m.ex && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-mono font-bold">
                          THINKING
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#71717a] mt-0.5 leading-snug">{m.desc}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-[#71717a] flex-wrap">
                      {m.mk && <span>📏 {Math.round(m.mk / 1024)}k Context</span>}
                      <span className="text-[#52525b] truncate max-w-[220px]">{id}</span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--accent-light)] border border-[var(--accent)]/40 text-[var(--accent)] text-[10px] font-bold shrink-0 mt-0.5">
                      <Check size={12} />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#3f3f46] shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
