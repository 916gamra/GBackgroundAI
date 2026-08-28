import React, { useState, useEffect, useRef } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProviderConfig } from '../types/ProviderHealthTypes';
import { fetchModelsWithValidation } from '../services/ModelValidatorService';

interface ApiKeyValidatorInputProps {
  provider: ProviderConfig;
  value: string;
  onChange: (key: string) => void;
  onValidationSuccess?: (models: any) => void;
  placeholder?: string;
}

export const ApiKeyValidatorInput: React.FC<ApiKeyValidatorInputProps> = ({
  provider,
  value,
  onChange,
  onValidationSuccess,
  placeholder = "Enter API Key..."
}) => {
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    // Cancel previous inflight validation & debounce timer
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setStatus('validating');
    setErrorMessage(null);

    // 800ms Debounce
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const baseUrls = provider.baseUrls && provider.baseUrls.length > 0
          ? provider.baseUrls
          : ['https://integrate.api.nvidia.com/v1', 'https://api.nvidia.com/v1'];

        let isValidKey = false;
        let lastError = '';

        for (const baseUrl of baseUrls) {
          if (controller.signal.aborted) return;
          try {
            const cleanUrl = baseUrl.replace(/\/+$/, '');
            const res = await fetch(`${cleanUrl}/models`, {
              headers: { 'Authorization': `Bearer ${value.trim()}` },
              signal: controller.signal
            });

            if (res.ok) {
              isValidKey = true;
              break;
            } else if (res.status === 401 || res.status === 403) {
              lastError = 'Invalid API key or unauthorized access (401/403)';
            } else {
              lastError = `API error ${res.status}`;
            }
          } catch (e: any) {
            if (e.name === 'AbortError') return;
            lastError = 'Network error during validation';
          }
        }

        if (controller.signal.aborted) return;

        if (isValidKey) {
          setStatus('valid');
          setErrorMessage(null);
          // Trigger instant model validation
          const modelsResult = await fetchModelsWithValidation({ ...provider, apiKey: value.trim() });
          if (onValidationSuccess) {
            onValidationSuccess(modelsResult);
          }
        } else {
          setStatus('invalid');
          setErrorMessage(lastError || 'Invalid API Key');
        }
      } catch (e: any) {
        if (!controller.signal.aborted) {
          setStatus('invalid');
          setErrorMessage('Validation failed');
        }
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, provider.id]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold text-[#a1a1aa] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Key size={13} className="text-[var(--accent)]" />
          <span>{provider.label || provider.id} API Key</span>
        </span>
        {status === 'valid' && (
          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck size={12} />
            Verified & Active
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[#18181c] border rounded-xl py-2 pl-3 pr-20 text-xs text-white placeholder-[#71717a] outline-none font-mono transition-all ${
            status === 'valid'
              ? 'border-emerald-500/60 focus:border-emerald-400'
              : status === 'invalid'
              ? 'border-rose-500/60 focus:border-rose-400'
              : 'border-[#27272a] focus:border-[var(--accent)]'
          }`}
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {status === 'validating' && (
            <Loader2 size={14} className="animate-spin text-amber-400" />
          )}
          {status === 'valid' && (
            <CheckCircle2 size={14} className="text-emerald-400" />
          )}
          {status === 'invalid' && (
            <XCircle size={14} className="text-rose-400" />
          )}

          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1 rounded text-[#71717a] hover:text-white transition-colors cursor-pointer"
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1 px-1">
          <AlertCircle size={11} />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
};
