import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, Code, Brain, Zap, Sparkles, Eye, Server, RefreshCw, Layers, CheckCircle2, AlertCircle, Star, Activity } from 'lucide-react';
import { MODELS, sanitizeApiKey } from '../../services/aiService';
import { ModelConfig, Provider } from '../../types';
import { getAdapterForProvider } from '../../services/providers';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModelId: string;
  onSelectModel: (id: string) => void;
  customModels?: Record<string, ModelConfig>;
  onToggleStarModel?: (modelId: string, modelConfig: ModelConfig) => void;
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
  onToggleStarModel,
  activeProvider,
  providers,
  onSwitchProvider,
  onUpdateProvider
}) => {
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);

  // Automatically fetch live models when modal opens
  useEffect(() => {
    if (isOpen && activeProvider) {
      handleFetchLiveModels();
    }
  }, [isOpen, activeProvider?.id, activeProvider?.apiKey]);

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
        const cleanName = pMod.split('/').pop()?.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || pMod;
        combined[pMod] = {
          name: cleanName,
          pv: activeProvider.pvType || activeProvider.id,
          t: 0.7,
          p: 0.95,
          mk: 128000,
          cat: 'general',
          desc: `Configured model for ${activeProvider.name}`,
          speed: 8,
          power: 8
        };
      }

      // Add default preset model if missing
      if (activeProvider.defaultModel && !combined[activeProvider.defaultModel]) {
        const cleanName = activeProvider.defaultModel.split('/').pop()?.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || activeProvider.defaultModel;
        combined[activeProvider.defaultModel] = {
          name: cleanName,
          pv: activeProvider.pvType || activeProvider.id,
          t: 0.7,
          p: 0.95,
          mk: 128000,
          cat: 'general',
          desc: `Preset default for ${activeProvider.name}`,
          speed: 8,
          power: 8
        };
      }

      // Add available live-fetched models
      if (activeProvider.availableModels) {
        activeProvider.availableModels.forEach(mId => {
          if (mId) {
            const rawLast = mId.split('/').pop() || mId;
            const cleanName = rawLast.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            const cat = mId.toLowerCase().includes('vision') ? 'vision'
              : mId.toLowerCase().includes('r1') || mId.toLowerCase().includes('think') || mId.toLowerCase().includes('pro') || mId.toLowerCase().includes('nemotron') ? 'think'
              : mId.toLowerCase().includes('code') || mId.toLowerCase().includes('coder') ? 'code'
              : mId.toLowerCase().includes('flash') || mId.toLowerCase().includes('mini') || mId.toLowerCase().includes('8b') ? 'fast'
              : 'general';

            combined[mId] = {
              name: cleanName,
              pv: activeProvider.pvType || activeProvider.id,
              t: 0.7,
              p: 0.95,
              mk: mId.toLowerCase().includes('1.5') || mId.toLowerCase().includes('2.5') || mId.toLowerCase().includes('llama-3') ? 128000 : 32768,
              cat,
              desc: `Live fetched directly from ${activeProvider.name}`,
              speed: 9,
              power: 9
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
      (pType === 'google' || pType === 'gemini' || pName.includes('google') || pName.includes('gemini')) &&
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

    // 5. DeepSeek
    if (
      (pType === 'deepseek' || pName.includes('deepseek')) &&
      (mPv === 'deepseek' || id.startsWith('deepseek'))
    ) {
      return true;
    }

    // 6. NVIDIA NIM aliases
    if (
      (pType === 'nvidia' || pId === 'nv-builtin' || pName.includes('nvidia')) &&
      (
        mPv === 'nvidia' ||
        id.startsWith('nvidia/') ||
        id.startsWith('meta/') ||
        id.startsWith('qwen/') ||
        id.startsWith('deepseek-ai/') ||
        id.startsWith('mistralai/')
      )
    ) {
      return true;
    }

    return false;
  };

  // Fetch Live Models directly from Provider endpoint using adapter
  const handleFetchLiveModels = async () => {
    if (!activeProvider) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const adapter = getAdapterForProvider(activeProvider.pvType || activeProvider.id);
      const cleanKey = sanitizeApiKey(activeProvider.apiKey);
      const fetchedInfos = await adapter.listModels(cleanKey, activeProvider.baseUrl);
      const list = fetchedInfos.map(m => m.id);

      if (list.length > 0) {
        const uniqueList = Array.from(new Set(list)).sort();
        const updated: Provider = {
          ...activeProvider,
          availableModels: uniqueList
        };
        if (onUpdateProvider) {
          onUpdateProvider(updated);
        }
        setFetchSuccess(`Fetched ${uniqueList.length} real models directly from ${activeProvider.name}! ✨`);
      } else {
        setFetchError('Response contained 0 models in list.');
      }
    } catch (err: any) {
      setFetchError(`Network error connecting to ${activeProvider.name}: ${err.message || 'Failed to fetch'}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Starred / Custom models
  const starredList = Object.entries(customModels || {}).filter(([id, m]) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q) ||
      (m.desc && m.desc.toLowerCase().includes(q))
    );
  });

  // Determine which models to display
  const modelsToDisplay = Object.entries(allModels).filter(([id, m]) => {
    // Check if model belongs to active provider or search
    const isForActive = isModelForActiveProvider(m, id) ||
      (activeProvider?.availableModels && activeProvider.availableModels.includes(id)) ||
      (configuredModel && (id === configuredModel || id.toLowerCase() === configuredModel.toLowerCase()));

    if (!isForActive && !search) {
      return false;
    }

    const q = search.toLowerCase();
    if (!q) return true;

    return (
      m.name.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q) ||
      (m.desc && m.desc.toLowerCase().includes(q)) ||
      (m.pv && m.pv.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#121215] border-t border-[#27272a] rounded-t-[28px] p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85dvh] animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Bottom sheet drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-[#3f3f46] mx-auto mb-3 shrink-0 cursor-grab" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Select AI Model</h3>
              <p className="text-[11px] text-[#a1a1aa] flex items-center gap-1.5 flex-wrap">
                <span>Active Provider:</span>
                <span className="font-semibold text-white bg-[#1f1f26] px-1.5 py-0.2 rounded text-[10px] border border-[#33333e]">
                  {activeProvider?.name || 'Current Provider'}
                </span>
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

            {/* Direct Fetch Models Button */}
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
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">

          {/* SAVED / STARRED MODELS SECTION (Costume Models) */}
          {starredList.length > 0 && (
            <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-[#17171f] border border-amber-500/30">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 px-1">
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>Starred / Saved Custom Models (الموديلات المحفوظة)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {starredList.length} Saved
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {starredList.map(([id, m]) => {
                  const isSelected = id === currentModelId;
                  return (
                    <div
                      key={`starred-${id}`}
                      onClick={() => {
                        onSelectModel(id);
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#1e1d2b] border-amber-400/80 text-white'
                          : 'bg-[#13131a] border-[#292936] hover:bg-[#1c1c28]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleStarModel) onToggleStarModel(id, m);
                          }}
                          className="p-1 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                          title="Remove from Starred Models"
                        >
                          <Star size={14} className="fill-amber-400" />
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                            {m.name}
                            <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1 rounded">
                              Saved
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#a1a1aa] truncate">{id}</div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold shrink-0">
                          Active
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--accent)] font-semibold shrink-0">Select</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALL PROVIDER MODELS */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider px-1">
              {activeProvider?.name || 'Available'} Models
            </div>

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
                const isStarred = !!customModels?.[id];
                const matchingProv = (providers || []).find(p => 
                  p.id === m.pv || 
                  p.pvType === m.pv || 
                  (m.pv === 'nvidia' && (p.id === 'nv-builtin' || p.pvType === 'nvidia')) ||
                  activeProvider?.id === m.pv
                ) || activeProvider;

                const hasApiKey = matchingProv && (matchingProv.pvType === 'ollama' || matchingProv.id === 'ollama' || (matchingProv.apiKey && matchingProv.apiKey.trim().length > 0));
                const isWorking = !!matchingProv && matchingProv.status !== 'error' && hasApiKey;
                const statusTitle = !matchingProv ? 'No provider found' : matchingProv.status === 'error' ? 'Provider connection error' : !hasApiKey ? 'Missing API Key' : 'Model ready';
                const pvType = (m.pv || '').toLowerCase();
                let pvBadgeClass = 'bg-blue-500/15 border-blue-500/30 text-blue-400';
                if (pvType === 'groq') {
                  pvBadgeClass = 'bg-orange-500/15 border-orange-500/30 text-orange-400';
                } else if (pvType === 'google' || pvType === 'gemini') {
                  pvBadgeClass = 'bg-blue-500/15 border-blue-500/30 text-blue-400';
                } else if (pvType === 'nvidia') {
                  pvBadgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
                } else if (pvType === 'meta') {
                  pvBadgeClass = 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';
                } else if (pvType === 'deepseek') {
                  pvBadgeClass = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400';
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
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'}`} title={statusTitle} />
                          {m.name}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${pvBadgeClass}`}>
                          {(m.pv || 'MODEL').toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#27272a] text-[#a1a1aa] text-[9px] font-mono font-semibold">
                          {getCategoryLabel(m.cat)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#71717a] mt-0.5 leading-snug">{m.desc}</p>

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-[#71717a] flex-wrap">
                        {m.mk && <span>📏 {Math.round(m.mk / 1024)}k Context</span>}
                        <span className="text-[#52525b] truncate max-w-[200px]">{id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {/* Star ⭐ Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleStarModel) onToggleStarModel(id, m);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isStarred
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-[#18181c] border-[#27272a] text-[#71717a] hover:text-amber-300 hover:border-amber-500/30'
                        }`}
                        title={isStarred ? 'Remove from Saved Custom Models' : 'Save model with Star ⭐'}
                      >
                        <Star size={13} className={isStarred ? 'fill-amber-400' : ''} />
                      </button>

                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent-light)] border border-[var(--accent)]/40 text-[var(--accent)] text-[10px] font-bold">
                          <Check size={12} />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#3f3f46]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
