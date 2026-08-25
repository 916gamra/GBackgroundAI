import React, { useState, useMemo } from 'react';
import { Search, X, Check, Server, Plus, Settings2, Globe, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { Provider } from '../../types';

interface ProviderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
  activeProviderId: string;
  onSelectProvider: (providerId: string) => void;
  onOpenSettingsProviders: () => void;
}

export const ProviderPickerModal: React.FC<ProviderPickerModalProps> = ({
  isOpen,
  onClose,
  providers,
  activeProviderId,
  onSelectProvider,
  onOpenSettingsProviders
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const getProviderBadge = (pvType?: string) => {
    const type = (pvType || 'custom').toLowerCase();
    switch (type) {
      case 'google':
        return { label: 'GOOGLE GEMINI', color: 'bg-blue-500/15 border-blue-500/30 text-blue-400' };
      case 'nvidia':
        return { label: 'NVIDIA NIM', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' };
      case 'groq':
        return { label: 'GROQ LPU', color: 'bg-orange-500/15 border-orange-500/30 text-orange-400' };
      case 'openrouter':
        return { label: 'OPENROUTER', color: 'bg-purple-500/15 border-purple-500/30 text-purple-300' };
      case 'ollama':
        return { label: 'LOCAL OLLAMA', color: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' };
      default:
        return { label: type.toUpperCase(), color: 'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa]' };
    }
  };

  const filteredProviders = providers.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.pvType && p.pvType.toLowerCase().includes(q)) ||
      (p.defaultModel && p.defaultModel.toLowerCase().includes(q)) ||
      p.baseUrl.toLowerCase().includes(q)
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
              <Server size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Select AI Provider</h3>
              <p className="text-[11px] text-[#a1a1aa]">Choose the active inference service for your queries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717a] hover:text-white hover:bg-[#1f1f23] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search provider by name, type, endpoint or default model..."
            className="w-full bg-[#18181c] border border-[#27272a] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-[#71717a] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Provider Cards List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#71717a] flex flex-col items-center justify-center gap-2">
              <Server size={24} className="opacity-40" />
              <span>No providers match your search query</span>
            </div>
          ) : (
            filteredProviders.map(prov => {
              const isSelected = prov.id === activeProviderId;
              const badge = getProviderBadge(prov.pvType);

              return (
                <div
                  key={prov.id}
                  onClick={() => {
                    onSelectProvider(prov.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#181822] border-[var(--accent)] shadow-md shadow-[var(--accent-light)]'
                      : 'bg-[#141418] border-[#27272a] hover:bg-[#191920] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[var(--accent-light)] border-[var(--accent)]/40 text-[var(--accent)]'
                          : 'bg-[#1c1c22] border-[#2c2c36] text-[#a1a1aa]'
                      }`}>
                        <Server size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            const isProviderWorking = prov.status !== 'error';
                            return (
                              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isProviderWorking ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'}`} title={isProviderWorking ? 'Provider online & working' : 'Provider connection error'} />
                                {prov.name}
                              </span>
                            );
                          })()}
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {prov.isBuiltin && (
                            <span className="text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.2 rounded border border-[var(--accent)]/30">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#71717a] truncate max-w-[240px] sm:max-w-[320px] mt-0.5">
                          {prov.baseUrl}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--accent-light)] border border-[var(--accent)]/40 text-[var(--accent)] text-[10px] font-bold">
                          <Check size={12} />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#3f3f46] hover:border-[var(--accent)]" />
                      )}
                    </div>
                  </div>

                  {/* Details Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#202026] text-[10px] font-mono text-[#71717a]">
                    <div className="flex items-center gap-2 truncate">
                      <span>Default Model:</span>
                      <span className="text-[#a1a1aa] font-semibold truncate">{prov.defaultModel || 'Auto'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--accent)] font-semibold shrink-0">
                      <span>{isSelected ? 'Currently Selected' : 'Click to Switch'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Link to Providers Settings */}
        <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center justify-between gap-2">
          <div className="text-[11px] text-[#71717a]">
            Need to add new API keys or configure endpoints?
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSettingsProviders();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-[var(--accent)] hover:text-white transition-all cursor-pointer shrink-0"
          >
            <Settings2 size={13} />
            <span>Manage in Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
