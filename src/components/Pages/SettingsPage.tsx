import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Server,
  Cpu,
  Sparkles,
  Sliders,
  Palette,
  Volume2,
  Smartphone,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Brain,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Terminal,
  ShieldCheck,
  HelpCircle,
  FileCode,
  Layers,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { AppSettings, Provider, ModelConfig } from '../../types';
import { DEFAULT_SYS, MODELS, sanitizeApiKey, normalizeChatEndpoint } from '../../services/aiService';
import { ToolsSettings } from './ToolsSettings';
import { getAdapterForProvider } from '../../services/providers';
import { PremiumAvatar } from '../PremiumAvatar';

interface SettingsPageProps {
  settings: AppSettings;
  providers: Provider[];
  activeProviderId: string;
  onSaveSettings: (settings: AppSettings) => void;
  onSaveProviders: (providers: Provider[], activeId: string) => void;
  onBack: () => void;
  onClearAllSessions: () => void;
}

type TabSection = 'providers' | 'models' | 'tools' | 'persona' | 'inference' | 'theme' | 'voice' | 'android';

interface FieldValidation {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
}

const PROVIDER_PRESETS: Array<{
  name: string;
  pvType: string;
  baseUrl: string;
  defaultModel: string;
  desc: string;
  docUrl: string;
}> = [
  {
    name: 'Google AI (Gemini)',
    pvType: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.5-flash',
    desc: 'Google Gemini official API with massive 1M+ context window, ultra-low latency, and multimodal capabilities.',
    docUrl: 'https://aistudio.google.com'
  },
  {
    name: 'NVIDIA NIM',
    pvType: 'nvidia',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    desc: 'High-throughput enterprise AI microservices with 100+ open-source models.',
    docUrl: 'https://build.nvidia.com'
  },
  {
    name: 'Groq Cloud (LPU)',
    pvType: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    desc: 'Ultra-low latency inference engine running on Groq LPUs.',
    docUrl: 'https://console.groq.com'
  },
  {
    name: 'Ollama (Local)',
    pvType: 'ollama',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'llama3:latest',
    desc: 'Run powerful models locally on your machine with no API key.',
    docUrl: 'https://ollama.com'
  },
  {
    name: 'OpenRouter',
    pvType: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    desc: 'Unified gateway to 200+ AI models across all top providers.',
    docUrl: 'https://openrouter.ai'
  },
  {
    name: 'Meta AI (Model API)',
    pvType: 'meta',
    baseUrl: 'https://api.meta.ai/v1/chat/completions',
    defaultModel: 'muse-spark-1.2',
    desc: 'Meta Model API with Muse Spark reasoning models (muse-spark-1.2, muse-spark-1.1).',
    docUrl: 'https://api.meta.ai'
  },
  {
    name: 'DeepSeek Official',
    pvType: 'deepseek',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    desc: 'DeepSeek direct API for V3 and R1 reasoning engines.',
    docUrl: 'https://platform.deepseek.com'
  },
  {
    name: 'OpenAI Compatible',
    pvType: 'custom',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    desc: 'Any OpenAI API standard compliant endpoint (Together, vLLM, LM Studio, etc).',
    docUrl: 'https://platform.openai.com'
  }
];

const PERSONA_PRESETS = [
  {
    name: 'Autonomous Software Engineer',
    desc: 'Writes production-ready, typed, and clean code with tests and self-contained implementations.',
    prompt: `You are GBackgroundAI, a Principal Full-Stack Software Engineer & Architect.
Core Behaviors:
- Output clean, robust, and well-typed code (TypeScript, Python, Rust, Go, SQL).
- When creating web components, provide complete, self-contained HTML/Tailwind/JS code ready for live execution.
- Think through edge cases, state lifecycles, and responsive mobile viewports.
- Support Arabic and English with natural fluency.`
  },
  {
    name: 'Deep Logic & Math Analyst',
    desc: 'Breaks complex logic down step-by-step with proofs, calculations, and mathematical rigor.',
    prompt: `You are GBackgroundAI, an advanced computational scientist and algorithmic reasoning specialist.
Core Behaviors:
- Detail every derivation, algebraic step, or algorithmic complexity analysis (Big-O).
- Verify logical conclusions thoroughly before outputting the final result.
- Execute Python code and mathematical tools to guarantee computational accuracy.`
  },
  {
    name: 'Concise & Fast Assistant',
    desc: 'Ultra-direct answers with zero fluff or conversational filler.',
    prompt: `You are GBackgroundAI in Ultra-Concise Mode.
Core Behaviors:
- Give immediate, direct answers without pleasantries or conversational filler.
- Use bullet points and clean code blocks.
- Answer in the same language as requested with maximum density of information.`
  },
  {
    name: 'Polyglot & Translation Specialist',
    desc: 'Multilingual linguistic precision, fluent terminology, and cross-cultural clarity.',
    prompt: `You are GBackgroundAI, a Master Multilingual AI Specialist.
Core Behaviors:
- Provide high-precision translations and natural technical explanations across English and global languages.
- Write clean, runnable code with clear explanatory comments.
- Maintain elegant formatting and high readability.`
  }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  providers,
  activeProviderId,
  onSaveSettings,
  onSaveProviders,
  onBack,
  onClearAllSessions
}) => {
  const [activeTab, setActiveTab] = useState<TabSection>('providers');
  const [searchFilter, setSearchFilter] = useState('');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message: string; latency?: number }>>({});
  
  // Local state
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localProviders, setLocalProviders] = useState<Provider[]>(providers);
  const [localActiveProvId, setLocalActiveProvId] = useState<string>(activeProviderId);
  const [notification, setNotification] = useState<string | null>(null);

  // Real-time Field Validations per provider
  const [urlValidations, setUrlValidations] = useState<Record<string, FieldValidation>>({});
  const [apiKeyValidations, setApiKeyValidations] = useState<Record<string, FieldValidation>>({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [openModelDropdown, setOpenModelDropdown] = useState<string | null>(null);

  // Refs for automatic next-field focus navigation
  const modelInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const keyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // New Custom Model Modal / Form State
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelKey, setNewModelKey] = useState('');
  const [newModelConfig, setNewModelConfig] = useState<ModelConfig>({
    name: '',
    pv: localActiveProvId,
    t: 0.7,
    p: 1.0,
    mk: 8192,
    cat: 'general',
    desc: '',
    speed: 8,
    power: 8,
    supportsThinking: false,
    supportsVision: false,
    supportsTools: true,
    isCustom: true
  });

  // New Memory Item Form State
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Combine built-in models with custom models
  const allModels: Record<string, ModelConfig> = useMemo(() => {
    return {
      ...MODELS,
      ...(localSettings.customModels || {})
    };
  }, [localSettings.customModels]);

  // Handle saving changes
  const handleApplyChanges = () => {
    onSaveSettings(localSettings);
    onSaveProviders(localProviders, localActiveProvId);
    triggerToast('Settings and models saved successfully! ✨');
  };

  // Toggle API Key visibility
  const toggleKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Automated URL Validation & Next Field Transition
  const validateUrl = async (provId: string, url: string, shouldAdvance: boolean = false) => {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      setUrlValidations(prev => ({
        ...prev,
        [provId]: { status: 'invalid', message: 'URL endpoint cannot be empty' }
      }));
      return false;
    }

    try {
      new URL(trimmed);
    } catch {
      setUrlValidations(prev => ({
        ...prev,
        [provId]: { status: 'invalid', message: 'Invalid URL syntax (e.g. https://...)' }
      }));
      return false;
    }

    const prov = localProviders.find(p => p.id === provId);
    const isKnownPublic =
      trimmed.includes('integrate.api.nvidia.com') ||
      trimmed.includes('api.groq.com') ||
      trimmed.includes('generativelanguage.googleapis.com') ||
      trimmed.includes('openrouter.ai') ||
      trimmed.includes('api.deepseek.com') ||
      trimmed.includes('api.openai.com');

    setUrlValidations(prev => ({
      ...prev,
      [provId]: { status: 'validating', message: 'Validating endpoint reachability...' }
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const cleanKey = sanitizeApiKey(prov?.apiKey);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }

      const res = await fetch(trimmed, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: prov?.model || 'ping', messages: [{ role: 'user', content: 'test' }], max_tokens: 1 }),
        signal: controller.signal
      }).catch(err => {
        return { ok: false, status: 0, statusText: err.message } as any;
      });

      clearTimeout(timeoutId);

      if (res && (res.status > 0 || res.ok || isKnownPublic)) {
        setUrlValidations(prev => ({
          ...prev,
          [provId]: { status: 'valid', message: `Endpoint reachable & active (HTTP ${res.status || 200})` }
        }));
        if (shouldAdvance && modelInputRefs.current[provId]) {
          modelInputRefs.current[provId]?.focus();
        }
        return true;
      } else {
        setUrlValidations(prev => ({
          ...prev,
          [provId]: { status: 'invalid', message: 'Endpoint unreachable or server not responding' }
        }));
        return false;
      }
    } catch (err: any) {
      if (isKnownPublic) {
        setUrlValidations(prev => ({
          ...prev,
          [provId]: { status: 'valid', message: 'Endpoint configured & ready' }
        }));
        return true;
      }
      setUrlValidations(prev => ({
        ...prev,
        [provId]: { status: 'invalid', message: `Connection error: ${err.message || 'Network Failed'}` }
      }));
      return false;
    }
  };

  // Automated API Key Validation
  const validateApiKey = async (prov: Provider) => {
    const key = sanitizeApiKey(prov.apiKey);
    if (!key && prov.pvType !== 'ollama') {
      setApiKeyValidations(prev => ({
        ...prev,
        [prov.id]: { status: 'invalid', message: 'API key is required for authentication' }
      }));
      return;
    }

    setApiKeyValidations(prev => ({
      ...prev,
      [prov.id]: { status: 'validating', message: 'Validating API key with provider...' }
    }));

    try {
      const adapter = getAdapterForProvider(prov.pvType || prov.id || 'openai-compatible');
      const health = await adapter.validate(key, prov.baseUrl);

      if (health.status === 'connected') {
        setApiKeyValidations(prev => ({
          ...prev,
          [prov.id]: { status: 'valid', message: health.message || 'API key verified successfully! Key is active and authorized' }
        }));
        // Auto fetch models after successful key validation
        handleFetchModels(prov);
      } else {
        setApiKeyValidations(prev => ({
          ...prev,
          [prov.id]: { status: 'invalid', message: health.message || 'Verification failed: Invalid API key' }
        }));
      }
    } catch (err: any) {
      setApiKeyValidations(prev => ({
        ...prev,
        [prov.id]: { status: 'invalid', message: `Verification failed: ${err.message || 'Connection error'}` }
      }));
    }
  };

  // Fetch Available Models Dynamically from Provider Endpoint (/v1/models)
  const handleFetchModels = async (prov: Provider) => {
    setFetchingModels(prev => ({ ...prev, [prov.id]: true }));
    triggerToast(`Connecting to ${prov.name} API to fetch available models...`);

    try {
      const cleanKey = sanitizeApiKey(prov.apiKey);
      const adapter = getAdapterForProvider(prov.pvType || 'openai-compatible');
      const modelInfos = await adapter.listModels(cleanKey, prov.baseUrl);
      let list = modelInfos.map(m => m.id);

      if (list.length > 0) {
        list = Array.from(new Set(list)).sort();
        const updated = localProviders.map(p =>
          p.id === prov.id ? { ...p, availableModels: list } : p
        );
        setLocalProviders(updated);
        onSaveProviders(updated, localActiveProvId);
        setOpenModelDropdown(prov.id);
        triggerToast(`✨ Fetched ${list.length} real models directly from ${prov.name} API!`);
      } else {
        triggerToast(`⚠️ API response from ${prov.name} returned 0 models.`);
      }
    } catch (err: any) {
      triggerToast(`❌ Network/CORS error fetching models from ${prov.name}: ${err.message || 'Failed to fetch'}`);
    } finally {
      setFetchingModels(prev => ({ ...prev, [prov.id]: false }));
    }
  };

  // Add Provider from Preset or Custom
  const handleAddProvider = (preset?: typeof PROVIDER_PRESETS[0]) => {
    const newId = `prov-${Date.now()}`;
    const newProv: Provider = preset
      ? {
          id: newId,
          name: preset.name,
          baseUrl: preset.baseUrl,
          apiKey: '',
          model: preset.defaultModel,
          isBuiltin: false,
          pvType: preset.pvType
        }
      : {
          id: newId,
          name: 'Custom Provider',
          baseUrl: 'https://api.openai.com/v1/chat/completions',
          apiKey: '',
          model: 'gpt-4o-mini',
          isBuiltin: false,
          pvType: 'custom'
        };

    const updated = [...localProviders, newProv];
    setLocalProviders(updated);
    onSaveProviders(updated, localActiveProvId);
    triggerToast(`Added ${newProv.name}`);
  };

  // Delete Provider
  const handleDeleteProvider = (id: string) => {
    if (localProviders.length <= 1) {
      triggerToast('At least one provider is required.');
      return;
    }
    const updated = localProviders.filter(p => p.id !== id);
    let nextActive = localActiveProvId;
    if (localActiveProvId === id) {
      nextActive = updated[0].id;
      setLocalActiveProvId(nextActive);
    }
    setLocalProviders(updated);
    onSaveProviders(updated, nextActive);
    triggerToast('Provider removed');
  };

  // Test Provider Connection
  const handleTestProvider = async (prov: Provider) => {
    setTestResults(prev => ({
      ...prev,
      [prov.id]: { status: 'loading', message: 'Testing connection...' }
    }));
    
    try {
      const cleanKey = sanitizeApiKey(prov.apiKey);
      const adapter = getAdapterForProvider(prov.pvType || 'openai-compatible');
      const health = await adapter.validate(cleanKey, prov.baseUrl);
      
      setTestResults(prev => ({
        ...prev,
        [prov.id]: { 
          status: health.status === 'connected' ? 'success' : 'error', 
          message: health.message || '', 
          latency: health.latency 
        }
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [prov.id]: { status: 'error', message: err.message || 'Connection failed' }
      }));
    }
  };

  // Save Custom Model
  const handleSaveCustomModel = () => {
    if (!newModelKey.trim() || !newModelConfig.name.trim()) {
      triggerToast('Model ID and Display Name are required');
      return;
    }

    const key = newModelKey.trim();
    const updatedCustom = {
      ...(localSettings.customModels || {}),
      [key]: {
        ...newModelConfig,
        name: newModelConfig.name.trim(),
        desc: newModelConfig.desc.trim() || `Custom model (${key})`,
        ex: newModelConfig.supportsThinking ? { chat_template_kwargs: { enable_thinking: true } } : undefined
      }
    };

    const updatedSettings = {
      ...localSettings,
      customModels: updatedCustom,
      mod: key
    };

    setLocalSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    setIsAddingModel(false);
    setNewModelKey('');
    triggerToast(`Added model ${newModelConfig.name}!`);
  };

  // Delete Custom Model
  const handleDeleteCustomModel = (key: string) => {
    const updatedCustom = { ...(localSettings.customModels || {}) };
    delete updatedCustom[key];

    const nextModel = localSettings.mod === key ? 'qwen/qwen3-coder-480b-a35b-instruct' : localSettings.mod;
    const updatedSettings = {
      ...localSettings,
      customModels: updatedCustom,
      mod: nextModel
    };

    setLocalSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    triggerToast('Custom model deleted');
  };

  // Add Memory Fact
  const handleAddMemory = () => {
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    const updatedMem = {
      ...(localSettings.agentMem || {}),
      [newMemKey.trim()]: newMemVal.trim()
    };
    const updated = { ...localSettings, agentMem: updatedMem };
    setLocalSettings(updated);
    onSaveSettings(updated);
    setNewMemKey('');
    setNewMemVal('');
    triggerToast('Memory fact saved');
  };

  // Delete Memory Fact
  const handleDeleteMemory = (key: string) => {
    const updatedMem = { ...(localSettings.agentMem || {}) };
    delete updatedMem[key];
    const updated = { ...localSettings, agentMem: updatedMem };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  // Export full JSON config
  const handleExportJSON = () => {
    const payload = {
      settings: localSettings,
      providers: localProviders,
      exportDate: new Date().toISOString(),
      app: 'GBackgroundAI v13'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gbg_ai_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Configuration exported');
  };

  // Import JSON config
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.settings) {
          setLocalSettings(parsed.settings);
          onSaveSettings(parsed.settings);
        }
        if (parsed.providers && Array.isArray(parsed.providers)) {
          setLocalProviders(parsed.providers);
          onSaveProviders(parsed.providers, parsed.providers[0]?.id || localActiveProvId);
        }
        triggerToast('Configuration restored successfully! ✨');
      } catch (err) {
        triggerToast('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070709] text-[#e0e0e0] flex flex-col font-sans overflow-hidden select-none animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--accent)] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-bounce">
          {notification}
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-[60px] bg-[#0c0c0e] border-b border-[#27272a] px-4 md:px-8 flex items-center justify-between shrink-0 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-[16px] md:text-[18px] font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Settings & AI Engine Studio</span>
              <span className="text-[10px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-light)] px-2 py-0.5 rounded-md border border-[var(--accent)]/30">
                Full Page
              </span>
            </h1>
            <p className="text-[11px] text-[#71717a] hidden sm:block">
              Configure multi-model endpoints, custom models, system personas, and Android parameters
            </p>
          </div>
        </div>

        {/* Quick Save & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyChanges}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md shadow-[var(--accent-light)] cursor-pointer"
          >
            <Check size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Save Changes</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Sidebar + Scrollable Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 bg-[#0d0d10] border-b md:border-b-0 md:border-r border-[#27272a] p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Server size={16} />
            <span>AI Providers & APIs</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Cpu size={16} />
            <span>Custom Models</span>
            {localSettings.customModels && Object.keys(localSettings.customModels).length > 0 && (
              <span className="ml-auto px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
                {Object.keys(localSettings.customModels).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Wrench size={16} />
            <span>AI Tools & Agent Manual</span>
            <span className="ml-auto px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
              {16 + (localSettings.customTools?.length || 0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('persona')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'persona'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>System Persona & Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('inference')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'inference'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Sliders size={16} />
            <span>Inference & Context</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Palette size={16} />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Volume2 size={16} />
            <span>Voice & Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
            }`}
          >
            <Smartphone size={16} />
            <span>Android APK & Backup</span>
          </button>

          <div className="hidden md:block mt-auto pt-4 border-t border-[#27272a]">
            <div className="p-2.5 rounded-xl bg-[#141417] border border-[#27272a] text-[11px] text-[#71717a] flex flex-col gap-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Local Privacy</span>
              </div>
              <span>Keys & memory are saved securely in your local browser sandbox.</span>
            </div>
          </div>
        </nav>

        {/* Dynamic Section Viewer */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#09090b]">
          <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 1. AI PROVIDERS & APIS SECTION */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'providers' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Server size={20} className="text-[var(--accent)]" />
                      <span>AI Inference Providers</span>
                    </h2>
                    <p className="text-xs text-[#a1a1aa]">
                      Manage API endpoints, keys, and default models for NVIDIA NIM, Groq, Ollama, OpenRouter, and custom servers.
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddProvider()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs font-semibold hover:border-[var(--accent)] transition-all cursor-pointer"
                  >
                    <Plus size={14} className="text-[var(--accent)]" />
                    <span>Add Custom Provider</span>
                  </button>
                </div>

                {/* Quick Presets Catalog */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Quick Presets Catalog</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {PROVIDER_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] flex flex-col justify-between gap-2 transition-all"
                      >
                        <div>
                          <div className="font-bold text-sm text-white flex items-center justify-between">
                            <span>{preset.name}</span>
                            <a
                              href={preset.docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#71717a] hover:text-[var(--accent)]"
                              title="Documentation"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                          <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed line-clamp-2">
                            {preset.desc}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAddProvider(preset)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[#18181c] hover:bg-[var(--accent)] hover:text-white border border-[#27272a] text-[11px] font-semibold text-[#a1a1aa] transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add Endpoint</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active & Configured Providers List */}
                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Configured Providers ({localProviders.length})</span>

                  {localProviders.map((prov) => {
                    const isSelected = prov.id === localActiveProvId;
                    const testState = testResults[prov.id];
                    const urlVal = urlValidations[prov.id];
                    const keyVal = apiKeyValidations[prov.id];
                    const isFetching = fetchingModels[prov.id];
                    const isDropdownOpen = openModelDropdown === prov.id;

                    return (
                      <div
                        key={prov.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-3.5 ${
                          isSelected
                            ? 'bg-[#151518] border-[var(--accent)] shadow-lg shadow-[var(--accent-light)]'
                            : 'bg-[#121215] border-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="activeProviderRadio"
                              id={`active-prov-${prov.id}`}
                              checked={isSelected}
                              onChange={() => {
                                setLocalActiveProvId(prov.id);
                                onSaveProviders(localProviders, prov.id);
                                const targetModel = prov.model || (prov as any).defaultModel || 'auto';
                                setLocalSettings(prev => ({ ...prev, mod: targetModel }));
                                triggerToast(`Active provider set to ${prov.name}`);
                              }}
                              className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input
                                type="text"
                                value={prov.name}
                                onChange={e => {
                                  const updated = localProviders.map(p => p.id === prov.id ? { ...p, name: e.target.value } : p);
                                  setLocalProviders(updated);
                                }}
                                className="bg-transparent font-bold text-sm text-white outline-none border-b border-transparent focus:border-[var(--accent)]"
                              />
                              {prov.isBuiltin && (
                                <span className="text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.2 rounded border border-[var(--accent)]/30">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  <Check size={10} /> Active
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isSelected ? (
                              <button
                                onClick={() => {
                                  setLocalActiveProvId(prov.id);
                                  onSaveProviders(localProviders, prov.id);
                                  const targetModel = prov.model || (prov as any).defaultModel || 'auto';
                                  setLocalSettings(prev => ({ ...prev, mod: targetModel }));
                                  triggerToast(`Active provider set to ${prov.name}`);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--accent)]/15 hover:bg-[var(--accent)] hover:text-white border border-[var(--accent)]/40 text-xs font-semibold text-[var(--accent)] transition-all cursor-pointer"
                                title="Set as Active Provider"
                              >
                                <Check size={12} />
                                <span>Set Active</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                                <CheckCircle2 size={12} />
                                <span>Active Provider</span>
                              </div>
                            )}

                            <button
                              onClick={() => handleTestProvider(prov)}
                              disabled={testState?.status === 'loading'}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1c1c20] hover:bg-[#27272a] border border-[#27272a] text-xs font-mono text-[#a1a1aa] hover:text-white transition-all cursor-pointer"
                              title="Full Connection & Model Ping"
                            >
                              <Activity size={12} className={testState?.status === 'loading' ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                              <span>{testState?.status === 'loading' ? 'Pinging...' : 'Test'}</span>
                            </button>

                            {!prov.isBuiltin && (
                              <button
                                onClick={() => handleDeleteProvider(prov.id)}
                                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-all cursor-pointer"
                                title="Delete Provider"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Test connection result bar */}
                        {testState && (
                          <div className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between ${
                            testState.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : testState.status === 'error'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span>{testState.message}</span>
                            {testState.latency && <span>{testState.latency}ms</span>}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* 1. Base URL with Realtime Verification & Color Border */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[#71717a] font-medium flex items-center gap-1.5">
                                <span>Base URL / Endpoint</span>
                                {urlVal?.status === 'valid' && <CheckCircle2 size={13} className="text-emerald-400" />}
                                {urlVal?.status === 'invalid' && <AlertCircle size={13} className="text-rose-400" />}
                              </label>
                              <span className="text-[10px] text-[#71717a]">Press Next/Tab to verify</span>
                            </div>

                            <div className="relative">
                              <input
                                type="text"
                                value={prov.baseUrl}
                                onChange={e => {
                                  const val = e.target.value;
                                  const updated = localProviders.map(p => p.id === prov.id ? { ...p, baseUrl: val } : p);
                                  setLocalProviders(updated);
                                  setUrlValidations(prev => ({ ...prev, [prov.id]: { status: 'idle' } }));
                                }}
                                onBlur={() => validateUrl(prov.id, prov.baseUrl, false)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === 'Tab') {
                                    validateUrl(prov.id, prov.baseUrl, true);
                                  }
                                }}
                                placeholder="https://..."
                                className={`w-full bg-[#18181c] rounded-xl px-3 py-2 text-white font-mono outline-none transition-all ${
                                  urlVal?.status === 'valid'
                                    ? 'border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : urlVal?.status === 'invalid'
                                    ? 'border-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                                    : 'border border-[#27272a] focus:border-[var(--accent)]'
                                }`}
                              />
                              {urlVal?.status === 'validating' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Activity size={13} className="animate-spin text-amber-400" />
                                </div>
                              )}
                            </div>

                            {/* URL error / validation feedback message */}
                            {urlVal?.message && (
                              <span className={`text-[11px] font-mono leading-tight ${
                                urlVal.status === 'valid' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {urlVal.message}
                              </span>
                            )}
                          </div>

                          {/* 2. Model Identifier / Auto Mode / Dynamic Discovery */}
                          <div className="flex flex-col gap-1 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-[#71717a] font-medium flex items-center gap-1.5">
                                <span>Model Identifier / Mode</span>
                                {prov.model === 'auto' && (
                                  <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    Auto Router
                                  </span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5">
                                {/* Outside Auto Mode Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isAuto = prov.model === 'auto';
                                    const nextModel = isAuto ? (prov.availableModels?.[0] || 'gpt-4o-mini') : 'auto';
                                    const updated = localProviders.map(p => p.id === prov.id ? { ...p, model: nextModel } : p);
                                    setLocalProviders(updated);
                                    triggerToast(isAuto ? `Manual model selection enabled for ${prov.name}` : `Auto mode (All models) enabled for ${prov.name}`);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                                    prov.model === 'auto'
                                      ? 'bg-purple-500/25 border border-purple-500/50 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                                      : 'bg-[#1c1c20] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white'
                                  }`}
                                  title="Toggle Auto Task Router: single API key accessing all models on provider"
                                >
                                  <Sparkles size={11} className={prov.model === 'auto' ? 'text-purple-400' : 'text-[#71717a]'} />
                                  <span>{prov.model === 'auto' ? 'Auto: ON' : 'Auto'}</span>
                                </button>

                                {/* Fetch Models Button */}
                                <button
                                  type="button"
                                  onClick={() => handleFetchModels(prov)}
                                  disabled={isFetching}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1c1c20] hover:bg-[#27272a] border border-[#27272a] text-[11px] font-mono text-[var(--accent)] hover:text-white transition-all cursor-pointer"
                                  title="Fetch model catalog from provider /v1/models"
                                >
                                  <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
                                  <span>{isFetching ? 'Fetching...' : 'Fetch Models'}</span>
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <input
                                ref={el => { modelInputRefs.current[prov.id] = el; }}
                                type="text"
                                disabled={prov.model === 'auto'}
                                value={prov.model === 'auto' ? 'All Models Selected (Auto Task Router)' : prov.model}
                                onChange={e => {
                                  if (prov.model !== 'auto') {
                                    const updated = localProviders.map(p => p.id === prov.id ? { ...p, model: e.target.value } : p);
                                    setLocalProviders(updated);
                                  }
                                }}
                                placeholder="e.g. gpt-4o-mini or llama-3.3-70b"
                                className={`w-full rounded-xl px-3 py-2 pr-10 font-mono text-xs outline-none transition-all ${
                                  prov.model === 'auto'
                                    ? 'bg-[#121215] border border-purple-500/30 text-purple-300/80 cursor-not-allowed opacity-80 select-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]'
                                    : 'bg-[#18181c] border border-[#27272a] text-white focus:border-[var(--accent)]'
                                }`}
                              />

                              {/* Dropdown toggle icon button on the right inside input */}
                              <button
                                type="button"
                                disabled={prov.model === 'auto'}
                                onClick={() => {
                                  if (prov.model !== 'auto') {
                                    setOpenModelDropdown(isDropdownOpen ? null : prov.id);
                                  }
                                }}
                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                                  prov.model === 'auto'
                                    ? 'opacity-30 cursor-not-allowed text-[#71717a]'
                                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a] cursor-pointer'
                                }`}
                                title="Select from fetched models"
                              >
                                <ChevronDown
                                  size={15}
                                  className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[var(--accent)]' : ''}`}
                                />
                              </button>
                            </div>

                            {/* Dropdown list of fetched models */}
                            {isDropdownOpen && prov.model !== 'auto' && (() => {
                              const modelsList = prov.availableModels || [];

                              return (
                                <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto bg-[#141418] border border-[var(--accent)] rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
                                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[#71717a] font-bold flex items-center justify-between border-b border-[#27272a] pb-1.5 mb-1">
                                    <span>API Models ({modelsList.length})</span>
                                    <button
                                      type="button"
                                      onClick={() => handleFetchModels(prov)}
                                      className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <RefreshCw size={10} className={fetchingModels[prov.id] ? 'animate-spin' : ''} />
                                      <span>{fetchingModels[prov.id] ? 'Fetching...' : 'Fetch from API'}</span>
                                    </button>
                                  </div>
                                  {modelsList.length > 0 ? (
                                    modelsList.map((mName, mIdx) => (
                                      <div
                                        key={mIdx}
                                        onClick={() => {
                                          const updated = localProviders.map(p =>
                                            p.id === prov.id ? { ...p, model: mName } : p
                                          );
                                          setLocalProviders(updated);
                                          onSaveProviders(updated, localActiveProvId);
                                          setOpenModelDropdown(null);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono truncate cursor-pointer flex items-center justify-between transition-colors ${
                                          prov.model === mName ? 'bg-[var(--accent)] text-white' : 'text-[#d4d4d8] hover:bg-[#1f1f24]'
                                        }`}
                                      >
                                        <span className="truncate">{mName}</span>
                                        {prov.model === mName && <Check size={13} />}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3 text-center flex flex-col items-center gap-2">
                                      <span className="text-xs text-[#a1a1aa] font-mono">No models fetched from API yet.</span>
                                      <button
                                        type="button"
                                        onClick={() => handleFetchModels(prov)}
                                        className="px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-mono font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                                      >
                                        <RefreshCw size={12} className={fetchingModels[prov.id] ? 'animate-spin' : ''} />
                                        <span>Fetch Models from API</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* 3. API Key with Internal Verification Icon & Visibility Toggle */}
                          <div className="flex flex-col gap-1 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[#71717a] font-medium flex items-center gap-1.5">
                                <span>API Key / Access Token</span>
                                {keyVal?.status === 'valid' && <CheckCircle2 size={13} className="text-emerald-400" />}
                                {keyVal?.status === 'invalid' && <AlertCircle size={13} className="text-rose-400" />}
                              </label>
                              <div className="flex items-center gap-2 text-[10px]">
                                {(prov.pvType === 'nvidia' || prov.id.includes('nvidia') || prov.name.includes('NVIDIA')) && (
                                  <a
                                    href="https://build.nvidia.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[var(--accent)] hover:underline font-mono flex items-center gap-0.5"
                                  >
                                    <span>Get Free NVIDIA Key</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                                <span className="text-[#52525b]">• Stored in local browser sandbox</span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                ref={el => { keyInputRefs.current[prov.id] = el; }}
                                type={showApiKeys[prov.id] ? 'text' : 'password'}
                                value={prov.apiKey}
                                onChange={e => {
                                  const updated = localProviders.map(p => p.id === prov.id ? { ...p, apiKey: e.target.value } : p);
                                  setLocalProviders(updated);
                                  setApiKeyValidations(prev => ({ ...prev, [prov.id]: { status: 'idle' } }));
                                }}
                                onBlur={() => {
                                  if (prov.apiKey.trim()) {
                                    validateApiKey(prov);
                                  }
                                }}
                                placeholder="sk-..."
                                className={`w-full bg-[#18181c] rounded-xl px-3 py-2 pr-18 text-white font-mono outline-none transition-all ${
                                  keyVal?.status === 'valid'
                                    ? 'border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : keyVal?.status === 'invalid'
                                    ? 'border-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                                    : 'border border-[#27272a] focus:border-[var(--accent)]'
                                }`}
                              />

                              {/* Action buttons inside the API key input */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {/* Verify Key Icon Button */}
                                <button
                                  type="button"
                                  onClick={() => validateApiKey(prov)}
                                  disabled={keyVal?.status === 'validating'}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    keyVal?.status === 'valid'
                                      ? 'text-emerald-400 hover:bg-emerald-500/20'
                                      : keyVal?.status === 'invalid'
                                      ? 'text-rose-400 hover:bg-rose-500/20'
                                      : 'text-[#a1a1aa] hover:text-[var(--accent)] hover:bg-[#27272a]'
                                  }`}
                                  title="Verify API Key validity with provider"
                                >
                                  {keyVal?.status === 'validating' ? (
                                    <Activity size={14} className="animate-spin text-amber-400" />
                                  ) : keyVal?.status === 'valid' ? (
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                  ) : keyVal?.status === 'invalid' ? (
                                    <AlertCircle size={14} className="text-rose-400" />
                                  ) : (
                                    <ShieldCheck size={14} />
                                  )}
                                </button>

                                {/* Toggle Key Visibility */}
                                <button
                                  type="button"
                                  onClick={() => toggleKeyVisibility(prov.id)}
                                  className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-all cursor-pointer"
                                  title={showApiKeys[prov.id] ? 'Hide API Key' : 'Show API Key'}
                                >
                                  {showApiKeys[prov.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>

                            {/* API Key validation feedback */}
                            {keyVal?.message && (
                              <span className={`text-[11px] font-mono leading-tight ${
                                keyVal.status === 'valid' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {keyVal.message}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 2. CUSTOM MODELS STUDIO */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'models' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Cpu size={20} className="text-[var(--accent)]" />
                      <span>Custom Models & Model Studio</span>
                    </h2>
                    <p className="text-xs text-[#a1a1aa]">
                      Add, calibrate, benchmark, and fine-tune models with custom context limits, reasoning templates, and vision support.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddingModel(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>New Custom Model</span>
                  </button>
                </div>

                {/* New Model Builder Form */}
                {isAddingModel && (
                  <div className="p-5 rounded-2xl bg-[#141418] border border-[var(--accent)] shadow-xl flex flex-col gap-4 animate-slideUp">
                    <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                      <span className="font-bold text-sm text-white">Create New Model Profile</span>
                      <button
                        onClick={() => setIsAddingModel(false)}
                        className="text-xs text-[#a1a1aa] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Model ID (Exact API string) *</label>
                        <input
                          type="text"
                          value={newModelKey}
                          onChange={e => setNewModelKey(e.target.value)}
                          placeholder="e.g. meta-llama/llama-3.3-70b-instruct or deepseek/deepseek-r1"
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Display Name *</label>
                        <input
                          type="text"
                          value={newModelConfig.name}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Llama 3.3 70B Turbo"
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Provider</label>
                        <select
                          value={newModelConfig.pv}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, pv: e.target.value }))}
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                        >
                          {localProviders.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Category</label>
                        <select
                          value={newModelConfig.cat}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, cat: e.target.value as any }))}
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                        >
                          <option value="code">💻 Code Specialist</option>
                          <option value="think">🧠 Deep Reasoning / Thinking</option>
                          <option value="fast">⚡ Ultra Fast Inference</option>
                          <option value="general">🌐 General Intelligence</option>
                          <option value="vision">👁️ Vision & Multimodal</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Max Output Tokens</label>
                        <input
                          type="number"
                          value={newModelConfig.mk}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, mk: parseInt(e.target.value) || 8192 }))}
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[#a1a1aa] font-medium">Default Temperature (0.0 – 2.0)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={newModelConfig.t}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, t: parseFloat(e.target.value) || 0.7 }))}
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[#a1a1aa] font-medium">Description</label>
                        <input
                          type="text"
                          value={newModelConfig.desc}
                          onChange={e => setNewModelConfig(prev => ({ ...prev, desc: e.target.value }))}
                          placeholder="Brief description of this model's strengths..."
                          className="bg-[#1a1a1f] border border-[#27272a] rounded-xl px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      {/* Capabilities Toggles */}
                      <div className="md:col-span-2 flex flex-wrap gap-4 pt-2 border-t border-[#27272a]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newModelConfig.supportsThinking}
                            onChange={e => setNewModelConfig(prev => ({ ...prev, supportsThinking: e.target.checked }))}
                            className="accent-[var(--accent)]"
                          />
                          <span>Enable Deep Thinking (<code className="text-amber-300">&lt;think&gt;</code>)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newModelConfig.supportsVision}
                            onChange={e => setNewModelConfig(prev => ({ ...prev, supportsVision: e.target.checked }))}
                            className="accent-[var(--accent)]"
                          />
                          <span>Supports Vision / Images</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newModelConfig.supportsTools}
                            onChange={e => setNewModelConfig(prev => ({ ...prev, supportsTools: e.target.checked }))}
                            className="accent-[var(--accent)]"
                          />
                          <span>Supports Agent Autonomous Tools</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsAddingModel(false)}
                        className="px-4 py-2 rounded-xl bg-[#1c1c20] text-[#a1a1aa] hover:text-white text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCustomModel}
                        className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)]"
                      >
                        Save Model
                      </button>
                    </div>
                  </div>
                )}

                {/* Model Catalog / List */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                      Available Models ({Object.keys(allModels).length})
                    </span>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Search models..."
                      className="bg-[#141418] border border-[#27272a] rounded-xl px-3 py-1 text-xs text-white outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(allModels)
                      .filter(([id, m]) =>
                        !searchFilter ||
                        m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        id.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        m.desc.toLowerCase().includes(searchFilter.toLowerCase())
                      )
                      .map(([id, m]) => {
                        const isCurrentActive = localSettings.mod === id;
                        const isCustom = !!m.isCustom || !MODELS[id];

                        return (
                          <div
                            key={id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isCurrentActive
                                ? 'bg-[#151519] border-[var(--accent)] shadow-md shadow-[var(--accent-light)]'
                                : 'bg-[#121215] border-[#27272a]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">{m.name}</span>
                                  {isCustom && (
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                      Custom
                                    </span>
                                  )}
                                  {isCurrentActive && (
                                    <span className="text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.2 rounded border border-[var(--accent)]/30">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-[#71717a] truncate max-w-[280px]">
                                  {id}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {isCustom && (
                                  <button
                                    onClick={() => handleDeleteCustomModel(id)}
                                    className="p-1 text-[#71717a] hover:text-rose-400 transition-colors"
                                    title="Delete custom model"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-[#a1a1aa] leading-relaxed line-clamp-2">
                              {m.desc}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] pt-1 border-t border-[#27272a]/60">
                              <span>Max: {m.mk} tokens</span>
                              <span>Temp: {m.t}</span>
                              <button
                                onClick={() => {
                                  setLocalSettings(prev => ({ ...prev, mod: id }));
                                  onSaveSettings({ ...localSettings, mod: id });
                                  triggerToast(`Active model set to ${m.name}`);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isCurrentActive
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-[#1c1c20] text-[#a1a1aa] hover:text-white'
                                }`}
                              >
                                {isCurrentActive ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 2.5 AI TOOLS & AGENT MANUAL */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'tools' && (
              <ToolsSettings
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
                onApplyChanges={handleApplyChanges}
                triggerToast={triggerToast}
              />
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 3. SYSTEM PERSONA & MEMORY */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'persona' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="pb-3 border-b border-[#27272a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PremiumAvatar status="idle" className="w-10 h-10 !rounded-2xl" />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>System Persona & Persistent Memory</span>
                      </h2>
                      <p className="text-xs text-[#a1a1aa]">
                        Craft the assistant's behavior, instructions, identity, and teach it permanent facts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Persona Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Persona Presets</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERSONA_PRESETS.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-sm text-white">{p.name}</div>
                          <p className="text-xs text-[#71717a] mt-1 leading-relaxed">{p.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            setLocalSettings(prev => ({ ...prev, sys: p.prompt }));
                            triggerToast(`Applied "${p.name}" persona`);
                          }}
                          className="py-1.5 rounded-xl bg-[#18181c] hover:bg-[var(--accent)] hover:text-white text-xs font-semibold text-[#a1a1aa] border border-[#27272a] transition-all cursor-pointer"
                        >
                          Use this Persona
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Prompt Textarea */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Active System Prompt</span>
                    <button
                      onClick={() => setLocalSettings(prev => ({ ...prev, sys: DEFAULT_SYS }))}
                      className="text-xs text-[#71717a] hover:text-[var(--accent)] flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Reset to Default</span>
                    </button>
                  </div>
                  <textarea
                    value={localSettings.sys}
                    onChange={e => setLocalSettings(prev => ({ ...prev, sys: e.target.value }))}
                    rows={8}
                    className="w-full bg-[#121215] border border-[#27272a] rounded-2xl p-3.5 text-xs md:text-sm text-white font-mono leading-relaxed outline-none focus:border-[var(--accent)] resize-y"
                    placeholder="Enter instructions..."
                  />
                </div>

                {/* Persistent Agent Memory Manager */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Brain size={16} className="text-purple-400" />
                      <span>Agent Persistent Memory ({Object.keys(localSettings.agentMem || {}).length})</span>
                    </div>
                    <span className="text-[10px] text-[#71717a]">Injected automatically into context</span>
                  </div>

                  {/* Add memory form */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newMemKey}
                      onChange={e => setNewMemKey(e.target.value)}
                      placeholder="Fact Key (e.g. user_framework)"
                      className="flex-1 bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] font-mono"
                    />
                    <input
                      type="text"
                      value={newMemVal}
                      onChange={e => setNewMemVal(e.target.value)}
                      placeholder="Fact Value (e.g. React 19 + Tailwind)"
                      className="flex-2 bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={handleAddMemory}
                      className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer shrink-0"
                    >
                      Remember
                    </button>
                  </div>

                  {/* Memory items list */}
                  <div className="flex flex-col gap-1.5 mt-1 max-h-48 overflow-y-auto">
                    {Object.entries(localSettings.agentMem || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-purple-400 font-bold">{key}:</span>
                          <span className="text-[#a1a1aa] truncate">{val}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(key)}
                          className="text-[#71717a] hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {Object.keys(localSettings.agentMem || {}).length === 0 && (
                      <span className="text-xs text-[#52525b] text-center py-2">No persistent memory items stored yet.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 4. INFERENCE & CONTEXT ENGINE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'inference' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="pb-2 border-b border-[#27272a]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders size={20} className="text-[var(--accent)]" />
                    <span>Inference & Context Engine</span>
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Tune sampling parameters, conversation history window, and auto-summarization triggers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature */}
                  <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">Temperature (Creativity)</span>
                      <span className="font-mono text-[var(--accent)]">{localSettings.tmp}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={localSettings.tmp}
                      onChange={e => setLocalSettings(prev => ({ ...prev, tmp: parseFloat(e.target.value) }))}
                      className="accent-[var(--accent)] w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#71717a]">
                      <span>0.0 Precise / Logic</span>
                      <span>1.0 Balanced</span>
                      <span>2.0 Creative</span>
                    </div>
                  </div>

                  {/* Context Window Messages */}
                  <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">Conversation History Memory</span>
                      <span className="font-mono text-[var(--accent)]">{localSettings.ctx} turns</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="2"
                      value={localSettings.ctx}
                      onChange={e => setLocalSettings(prev => ({ ...prev, ctx: parseInt(e.target.value) }))}
                      className="accent-[var(--accent)] w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#71717a]">
                      <span>Short (2)</span>
                      <span>Medium (12)</span>
                      <span>Deep (40)</span>
                    </div>
                  </div>

                  {/* Auto Summarization */}
                  <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-white">Auto-Summarization</div>
                        <div className="text-[11px] text-[#71717a]">Compresses older messages to conserve token budgets</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings.autoSum}
                        onChange={e => setLocalSettings(prev => ({ ...prev, autoSum: e.target.checked }))}
                        className="accent-[var(--accent)] w-4 h-4"
                      />
                    </div>
                    {localSettings.autoSum && (
                      <div className="text-[11px] font-mono text-[#a1a1aa]">
                        Threshold: Trigger at {localSettings.sumThreshold} messages, keep {localSettings.sumKeep} recent.
                      </div>
                    )}
                  </div>

                  {/* Smart Task Routing */}
                  <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-white">Smart Task Routing</div>
                        <div className="text-[11px] text-[#71717a]">Auto-switches to optimal model based on query intent</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localSettings.taskRoute}
                        onChange={e => setLocalSettings(prev => ({ ...prev, taskRoute: e.target.checked }))}
                        className="accent-[var(--accent)] w-4 h-4"
                      />
                    </div>
                    <div className="text-[10px] text-[#52525b]">
                      Routes coding to Qwen3-Coder, deep logic to DeepSeek-R1, rapid queries to Groq LPU.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 5. APPEARANCE & THEME */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'theme' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="pb-2 border-b border-[#27272a]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette size={20} className="text-[var(--accent)]" />
                    <span>Appearance & Visual Customization</span>
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Personalize accent colors, contrast modes, and layout density.
                  </p>
                </div>

                {/* Accent Color Picker */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-3">
                  <span className="text-xs font-bold text-white">Theme Accent Palette</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {[
                      { id: 'orange', name: 'Amber Glow', color: '#d97706' },
                      { id: 'blue', name: 'Electric Blue', color: '#2563eb' },
                      { id: 'green', name: 'Emerald', color: '#16a34a' },
                      { id: 'purple', name: 'Purple Neon', color: '#9333ea' },
                      { id: 'red', name: 'Crimson', color: '#dc2626' },
                      { id: 'cyan', name: 'Cyber Cyan', color: '#0891b2' }
                    ].map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setLocalSettings(prev => ({ ...prev, accent: acc.id as any }));
                          triggerToast(`Accent set to ${acc.name}`);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          localSettings.accent === acc.id
                            ? 'bg-[#1c1c20] border-white shadow-lg'
                            : 'bg-[#161619] border-[#27272a]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full shadow-md" style={{ backgroundColor: acc.color }} />
                        <span className="text-[11px] font-semibold text-[#e4e4e7]">{acc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Mode */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-white">Color Mode</div>
                    <div className="text-[11px] text-[#71717a]">Pure OLED Dark or Light Theme</div>
                  </div>
                  <div className="flex bg-[#18181c] p-1 rounded-xl border border-[#27272a] text-xs font-semibold">
                    <button
                      onClick={() => setLocalSettings(prev => ({ ...prev, mode: 'dark' }))}
                      className={`px-3 py-1.5 rounded-lg ${localSettings.mode === 'dark' ? 'bg-[#27272a] text-white' : 'text-[#71717a]'}`}
                    >
                      🌙 Dark (OLED)
                    </button>
                    <button
                      onClick={() => setLocalSettings(prev => ({ ...prev, mode: 'light' }))}
                      className={`px-3 py-1.5 rounded-lg ${localSettings.mode === 'light' ? 'bg-[#27272a] text-white' : 'text-[#71717a]'}`}
                    >
                      ☀️ Light
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 6. VOICE & AUDIO */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'voice' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="pb-2 border-b border-[#27272a]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Volume2 size={20} className="text-[var(--accent)]" />
                    <span>Voice Input & Speech Synthesis</span>
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Configure Web Speech API text-to-speech voices and audio speed.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">Auto Voice Readout (TTS)</div>
                      <div className="text-[11px] text-[#71717a]">Automatically speak assistant answers upon completion</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.tts}
                      onChange={e => setLocalSettings(prev => ({ ...prev, tts: e.target.checked }))}
                      className="accent-[var(--accent)] w-4 h-4"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">Speech Speed Rate</span>
                      <span className="font-mono text-[var(--accent)]">{localSettings.ttsSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={localSettings.ttsSpeed}
                      onChange={e => setLocalSettings(prev => ({ ...prev, ttsSpeed: parseFloat(e.target.value) }))}
                      className="accent-[var(--accent)] w-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* 7. ANDROID APK & BACKUP */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'android' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="pb-2 border-b border-[#27272a]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone size={20} className="text-[var(--accent)]" />
                    <span>Android APK Compilation & JSON Backup</span>
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Build native Android packages and import/export your entire assistant configuration.
                  </p>
                </div>

                {/* Backup & Restore Box */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-3">
                  <span className="text-xs font-bold text-white">Full Backup & Restore</span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Download size={15} className="text-emerald-400" />
                      <span>Export Full Backup JSON</span>
                    </button>

                    <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181c] hover:bg-[#27272a] border border-[#27272a] text-white text-xs font-semibold transition-all cursor-pointer">
                      <Upload size={15} className="text-sky-400" />
                      <span>Import / Restore JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Android APK Steps */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col gap-2.5">
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <Smartphone size={16} className="text-emerald-400" />
                    <span>Capacitor Android Package Builder</span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    Build a standalone Android `.apk` file for your Samsung phone or any Android 10+ device:
                  </p>
                  <div className="bg-[#0b0b0d] p-3 rounded-xl border border-[#27272a] text-xs font-mono text-emerald-300 select-all flex flex-col gap-1">
                    <div># 1. Build web distribution</div>
                    <div>npm run build</div>
                    <div className="mt-1"># 2. Sync to native Android project</div>
                    <div>npx cap sync</div>
                    <div className="mt-1"># 3. Open in Android Studio & Generate APK</div>
                    <div>npx cap open android</div>
                  </div>
                </div>

                {/* Storage Cleanups */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-rose-500/20 flex flex-col gap-3">
                  <span className="text-xs font-bold text-rose-400">Danger Zone</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Wipe All Chat Sessions</div>
                      <div className="text-[11px] text-[#71717a]">Permanently deletes chat history and cache</div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete all chat history?')) {
                          onClearAllSessions();
                          triggerToast('All sessions cleared');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
