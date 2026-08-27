import React, { useState, useEffect } from 'react';
import { validateNvidiaApiKey } from '../../services/apiValidation';
import { Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'gbai_nvidia_api_key';

interface ApiKeyValidatorInputProps {
  onValidated?: (key: string) => void;
}

export const ApiKeyValidatorInput: React.FC<ApiKeyValidatorInputProps> = ({ onValidated }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApiKey(stored);
        setStatus('success');
        setFeedbackMessage('تم استرجاع المفتاح المحفوظ مسبقاً.');
        if (onValidated) onValidated(stored);
      }
    } catch {}
  }, [onValidated]);

  const handleVerify = async () => {
    setStatus('loading');
    setFeedbackMessage('');

    const result = await validateNvidiaApiKey(apiKey);

    if (result.isValid) {
      setStatus('success');
      setFeedbackMessage(result.message);
      const clean = apiKey.trim();
      try {
        localStorage.setItem(STORAGE_KEY, clean);
      } catch {}
      if (onValidated) {
        onValidated(clean);
      }
    } else {
      setStatus('error');
      setFeedbackMessage(result.message);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4" dir="rtl">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">إعداد مفتاح الاتصال (Nvidia NIM)</h3>
        <p className="text-xs text-zinc-400 mt-1">أدخل مفتاح Nvidia NIM الخاص بك لتفعيل محركات التفكير المتقدمة وتحديث قائمة النماذج تلقائياً.</p>
      </div>

      <div className="space-y-2">
        <div className="relative flex items-center">
          <Key className="absolute right-3 w-4 h-4 text-zinc-400" />
          
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={status === 'loading'}
            placeholder="nvapi-............................"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pr-10 pl-24 py-2.5 text-sm font-mono outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors disabled:opacity-60"
          />

          <button
            onClick={handleVerify}
            disabled={status === 'loading' || !apiKey}
            className="absolute left-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            {status === 'loading' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'تحقق'
            )}
          </button>
        </div>

        {status === 'success' && (
          <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl text-xs leading-relaxed animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl text-xs leading-relaxed animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
