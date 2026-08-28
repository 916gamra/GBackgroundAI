import React, { useState, useEffect } from 'react';
import { Search, Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import { ModelHealth, HealthFilter, ProviderConfig } from '../types/ProviderHealthTypes';
import { validateSingleModel } from '../services/ModelValidatorService';

interface ModelPickerWithDotsProps {
  provider: ProviderConfig;
  models: ModelHealth[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onRefreshHealth?: () => void;
}

export const ModelPickerWithDots: React.FC<ModelPickerWithDotsProps> = ({
  provider,
  models,
  selectedModelId,
  onSelectModel,
  onRefreshHealth
}) => {
  const [filter, setFilter] = useState<HealthFilter>('all_alive');
  const [search, setSearch] = useState('');
  const [localModels, setLocalModels] = useState<ModelHealth[]>(models);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setLocalModels(models);
  }, [models]);

  const handleScanModel = async (modelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Update local state to checking
    setLocalModels(prev => prev.map(m => m.id === modelId ? { ...m, status: 'checking' } : m));
    
    const updated = await validateSingleModel(provider, modelId);
    setLocalModels(prev => prev.map(m => m.id === modelId ? updated : m));
  };

  const handleScanAll = async () => {
    if (!provider.apiKey) return;
    setIsScanning(true);
    if (onRefreshHealth) {
      await onRefreshHealth();
    } else {
      setLocalModels(prev => prev.map(m => ({ ...m, status: 'checking' })));
      for (const m of localModels) {
        const updated = await validateSingleModel(provider, m.id);
        setLocalModels(prev => prev.map(item => item.id === m.id ? updated : item));
      }
    }
    setIsScanning(false);
  };

  const displayedModels = localModels.filter(m => {
    if (filter === 'all_alive' && m.status === 'dead') return false;
    if (search.trim()) {
      return m.id.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const aliveCount = localModels.filter(m => m.status === 'alive').length;
  const deadCount = localModels.filter(m => m.status === 'dead').length;

  const renderStatusDot = (m: ModelHealth) => {
    switch (m.status) {
      case 'checking':
        return (
          <span title="Checking status...">
            <RefreshCw size={12} className="animate-spin text-amber-400" />
          </span>
        );
      case 'alive':
        return (
          <span className="relative flex h-2.5 w-2.5" title={`Alive (${m.latencyMs || 0}ms)`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        );
      case 'rate_limited':
        return (
          <span title="Rate limited (429)">
            <AlertTriangle size={12} className="text-amber-400" />
          </span>
        );
      case 'dead':
        return (
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_6px_#f43f5e]" title={`Dead (${m.errorCode || 'error'})`}></span>
        );
      default:
        return (
          <span title="Unknown status">
            <HelpCircle size={12} className="text-[#71717a]" />
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-[#141418] border border-[#27272a] rounded-2xl p-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
            <Activity size={16} />
          </div>
          <div>
            <div className="font-bold text-xs text-white flex items-center gap-2">
              <span>Model Health Validator</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                {aliveCount} Alive
              </span>
              {deadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  {deadCount} Deprecated
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#71717a]">Real-time live model health & endpoint response validation</p>
          </div>
        </div>

        <button
          onClick={handleScanAll}
          disabled={isScanning || !provider.apiKey}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#272732] border border-[#33333e] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={isScanning ? 'animate-spin text-amber-400' : ''} />
          <span>{isScanning ? 'Scanning...' : 'Scan All Models'}</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#27272a]">
        <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-[#27272a]">
          <button
            onClick={() => setFilter('all_alive')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === 'all_alive'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            Alive Only ({aliveCount})
          </button>
          <button
            onClick={() => setFilter('include_dead')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === 'include_dead'
                ? 'bg-[#27272a] text-white shadow-sm'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            Include Dead ({localModels.length})
          </button>
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search model name..."
            className="w-full bg-[#18181c] border border-[#27272a] rounded-xl py-1 pl-8 pr-3 text-xs text-white placeholder-[#71717a] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Models List */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {displayedModels.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#71717a]">
            No models found matching current criteria.
          </div>
        ) : (
          displayedModels.map(m => {
            const isSelected = m.id === selectedModelId;
            return (
              <div
                key={m.id}
                onClick={() => onSelectModel(m.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1e1d2b] border-[var(--accent)] text-white'
                    : 'bg-[#18181c] border-[#27272a] hover:bg-[#22222a] hover:border-[#33333e]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status Dot */}
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">
                    {renderStatusDot(m)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-white truncate flex items-center gap-2">
                      <span>{m.id}</span>
                      {m.isDeprecated && (
                        <span className="text-[9px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/30">
                          Deprecated
                        </span>
                      )}
                    </div>
                    {m.baseUrlUsed && (
                      <div className="text-[10px] font-mono text-[#71717a] truncate">
                        via {m.baseUrlUsed.replace('https://', '')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.latencyMs !== undefined && m.status === 'alive' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {m.latencyMs}ms
                    </span>
                  )}
                  {m.errorCode && m.status === 'dead' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {m.errorCode}
                    </span>
                  )}

                  <button
                    onClick={(e) => handleScanModel(m.id, e)}
                    className="p-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                    title="Re-verify single model"
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
