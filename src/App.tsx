import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  ChatMessage,
  Session,
  AppSettings,
  Provider,
  ProjectFile,
  Snippet,
  AgentStepEvent,
  GeneratedFile,
  ModelConfig
} from './types';
import { ArtifactsPanel } from './components/Chat/ArtifactsPanel';
import {
  DEFAULT_SYS,
  MODELS,
  EP,
  normalizeChatEndpoint,
  sanitizeApiKey,
  buildCtx,
  parseThink,
  detectTask,
  ROUTE_MAP,
  countTokens,
  resolveMaxOutputTokens
} from './services/aiService';
import { generateSummary, buildLocalDigest } from './services/summarizeHistory';
import { getAdapterForProvider } from './services/providers';
import { StreamEvent } from './services/streamEngine';
import { AgentOrchestrator } from './services/orchestrator/AgentOrchestrator';
import {
  getActiveAgentTools,
  webSearch,
  fetchURL,
  runPython,
  execJS,
  mathEval,
  wikiSearch,
  jsonTool,
  regexTest,
  encodeText,
  hashText,
  toolNow,
  agentAnalyze,
  makeChart,
  zapierAction,
  makeWebhook,
  vectorRagSearch,
  generateImageTool,
  elevenLabsTTS,
  chatAnalytics,
  executeDataAnalyst,
  executePdfAnalyzer,
  triggerN8nAutomation,
  freeTTSSTT,
  executeSandboxedCustomTool,
  executeModbusTool,
  executeTermuxBridge,
  fetchGitHubTree,
  readGitHubFile,
  searchGitHubCode,
  publishToGitHub,
  analyzeCodePro,
  simulateCloneAndAnalyze,
  executeAgentToolUniversal
} from './services/agentTools';
import { gSoulEngine } from './services/GSoulEngine';
import { annotateToolResult } from './services/toolPolicy';
import { setJson, getJson, trimOldest } from './services/safeStorage';
import { syncWorkspace } from './services/projectMemory';
import { APP_VERSION_LABEL, APP_NAME, STORAGE } from './version';
import { PremiumAvatar } from './components/PremiumAvatar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { resolveAgentBehavior } from './bot';
import { ChatPage } from './components/Chat/ChatPage';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { SessionsModal } from './components/Modals/SessionsModal';
import { ModelPickerModal } from './components/Modals/ModelPickerModal';
import { ProviderPickerModal } from './components/Modals/ProviderPickerModal';
import { ProjectModal } from './components/Modals/ProjectModal';
import { SnippetsModal } from './components/Modals/SnippetsModal';
const SettingsPage = lazy(() => import('./components/Pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const DeveloperDocsPage = lazy(() => import('./components/Pages/DeveloperDocsPage').then(m => ({ default: m.DeveloperDocsPage })));
import { WelcomeView } from './components/Pages/WelcomeView';
import { speakText, stopSpeech } from './services/speechUtils';

const DEFAULT_SETTINGS: AppSettings = {
  mod: 'gemini-2.5-flash',
  sys: DEFAULT_SYS,
  tmp: 0.7,
  ctx: 12,
  maxTok: '',
  agent: false,
  webSearch: false,
  serper: '',
  summary: '',
  autoSum: true,
  sumThreshold: 20,
  sumKeep: 6,
  taskRoute: false,
  tts: false,
  ttsVoice: '',
  ttsSpeed: 1,
  accent: 'orange',
  mode: 'dark',
  agentMem: {}
};

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'google-builtin',
    name: 'Google AI (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKey: '',
    model: 'gemini-2.5-flash',
    isBuiltin: true,
    pvType: 'google'
  },
  {
    id: 'nv-builtin',
    name: 'NVIDIA NIM (Built-in)',
    baseUrl: EP.nvidia,
    apiKey: '',
    model: 'meta/llama-3.3-70b-instruct',
    isBuiltin: true,
    pvType: 'nvidia'
  },
  {
    id: 'gq-builtin',
    name: 'Groq LPU (Built-in)',
    baseUrl: EP.groq,
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    isBuiltin: true,
    pvType: 'groq'
  },
  {
    id: 'meta-builtin',
    name: 'Meta AI (Model API)',
    baseUrl: EP.meta,
    apiKey: '',
    model: 'muse-spark-1.2',
    isBuiltin: true,
    pvType: 'meta'
  }
];

export default function App() {
  // Main state
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = getJson<Session[]>(STORAGE.sessions, []);
    if (Array.isArray(saved) && saved.length) return saved;
    return [
      {
        id: `s-${Date.now()}`,
        title: 'New Conversation',
        date: new Date().toISOString(),
        history: []
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('welcome');

  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...getJson<Partial<AppSettings>>(STORAGE.settings, {})
  }));

  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE.providers);
      let parsed: Provider[] | null = null;
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) parsed = p;
      }
      const list = parsed || DEFAULT_PROVIDERS;

      // Key hydration order: stored per-provider key -> validated NVIDIA key ->
      // VITE_* env (dev-only convenience; Vite exposes VITE_-prefixed vars only).
      const env = (import.meta as any).env || {};
      const envKeys: Record<string, string> = {
        'google-builtin': env.VITE_GEMINI_API_KEY || '',
        'nv-builtin': env.VITE_NVIDIA_API_KEY || '',
        'gq-builtin': env.VITE_GROQ_API_KEY || ''
      };
      const storedNvidiaKey = localStorage.getItem(STORAGE.nvidiaKey) || '';

      return list.map(p => {
        if (p.apiKey?.trim()) return p;
        const fromEnv = envKeys[p.id];
        if (fromEnv) return { ...p, apiKey: fromEnv };
        if (p.id === 'nv-builtin' && storedNvidiaKey) return { ...p, apiKey: storedNvidiaKey };
        return p;
      });
    } catch {}
    return DEFAULT_PROVIDERS;
  });

  const [activeProviderId, setActiveProviderId] = useState<string>(() => {
    return providers[0]?.id || 'nv-builtin';
  });

  const handleSelectProvider = (providerId: string, customProvList?: Provider[]) => {
    setActiveProviderId(providerId);
    const list = customProvList || providers;
    const prov = list.find(p => p.id === providerId);
    if (!prov) return;

    setSettings(prev => {
      // If the provider has an explicit `model` configured, use it.
      const configured = prov.model || (prov as any).defaultModel;
      if (configured && configured !== 'auto') {
        return { ...prev, mod: configured };
      }

      // Otherwise, check whether the currently selected model is usable on
      // this provider. If not, fall back to a sensible default instead of
      // silently sending a model id that the new provider doesn't host.
      const allModels: Record<string, any> = { ...MODELS, ...(prev.customModels || {}) };
      const currentCfg = allModels[prev.mod];
      const pType = (prov.pvType || '').toLowerCase();
      const pId = prov.id.toLowerCase();

      const providerSupportsCurrent = currentCfg
        ? currentCfg.pv === pType || currentCfg.pv === pId
        : false;

      if (providerSupportsCurrent) {
        return prev;
      }

      const fallback = (() => {
        if (pType === 'groq' || pId === 'gq-builtin') return 'llama-3.3-70b-versatile';
        if (pType === 'nvidia' || pId === 'nv-builtin') return 'meta/llama-3.3-70b-instruct';
        if (pType === 'google' || pType === 'gemini') return 'gemini-2.5-flash';
        if (pType === 'meta' || pId === 'meta-builtin') return 'muse-spark-1.2';
        return prev.mod;
      })();

      return { ...prev, mod: fallback };
    });
  };

  const handleToggleStarModel = (modelId: string, config: ModelConfig) => {
    setSettings(prev => {
      const currentCustom = { ...(prev.customModels || {}) };
      if (currentCustom[modelId]) {
        delete currentCustom[modelId];
      } else {
        currentCustom[modelId] = {
          ...config,
          isCustom: true
        };
      }
      return { ...prev, customModels: currentCustom };
    });
  };

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(
    () => getJson<ProjectFile[]>(STORAGE.projectFiles, [])
  );
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = getJson<Snippet[]>(STORAGE.snippets, []);
    if (Array.isArray(saved) && saved.length) return saved;
    return [
      { title: 'Modern HTML/Tailwind Applet', code: 'Build a modern, interactive single-page web app in a single self-contained HTML file with Tailwind CSS and vanilla JS.' },
      { title: 'Python Data Analysis', code: 'Write a Python script using pandas and numpy to analyze numeric distributions and output statistics.' }
    ];
  });

  // UI state
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>(() => {
    const saved = getJson<GeneratedFile[]>(STORAGE.artifacts, []);
    if (Array.isArray(saved) && saved.length) return saved;
    return [
      {
        id: 'demo-1',
        name: 'App.tsx',
        type: 'code',
        language: 'typescript',
        content: 'export const SampleWidget = () => {\n  return (\n    <div className="p-4 bg-zinc-900 text-white rounded-xl shadow-lg">\n      <h3 className="text-lg font-bold">Samsung One UI / Claude Artifacts</h3>\n      <p className="text-sm text-zinc-400">Generated artifacts and file manager active.</p>\n    </div>\n  );\n};',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [activeArtifact, setActiveArtifact] = useState<GeneratedFile | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals state
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isProviderPickerOpen, setIsProviderPickerOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSnippetsModalOpen, setIsSnippetsModalOpen] = useState(false);

  // Streaming / Generation execution state
  const [isBusy, setIsBusy] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingThinking, setStreamingThinking] = useState('');
  const [agentSteps, setAgentSteps] = useState<AgentStepEvent[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [typingElapsed, setTypingElapsed] = useState(0);
  const [isJustFinished, setIsJustFinished] = useState(false);
  const [hasRecentError, setHasRecentError] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<any>(null);
  // handleSend is recreated on every render (it closes over most of the app);
  // children get this stable indirection instead so memoised bubbles don't
  // re-render on every unrelated state change.
  const handleSendRef = useRef<(text: string) => void>(() => {});

  // Active agent avatar dynamic behavior resolution
  const currentAgentBehavior = resolveAgentBehavior({
    isBusy,
    isStreaming,
    isAgentRunning,
    typingStatus,
    hasError: hasRecentError,
    isSuccess: isJustFinished
  });

  // Active session helper
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];

  // Splash Screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Apply theme accent & mode
  useEffect(() => {
    const root = document.documentElement;
    const accentColors: Record<string, [string, string, string]> = {
      orange: ['#d97706', '#b45309', 'rgba(217,119,6,0.2)'],
      blue: ['#2563eb', '#1d4ed8', 'rgba(37,99,235,0.2)'],
      green: ['#16a34a', '#15803d', 'rgba(22,163,74,0.2)'],
      purple: ['#9333ea', '#7e22ce', 'rgba(147,51,234,0.2)'],
      red: ['#dc2626', '#b91c1c', 'rgba(220,38,38,0.2)'],
      cyan: ['#0891b2', '#0e7490', 'rgba(8,145,178,0.2)']
    };
    const [acc, hover, light] = accentColors[settings.accent] || accentColors.orange;
    root.style.setProperty('--accent', acc);
    root.style.setProperty('--accent-hover', hover);
    root.style.setProperty('--accent-light', light);

    if (settings.mode === 'light') {
      root.setAttribute('data-mode', 'light');
    } else {
      root.removeAttribute('data-mode');
    }
  }, [settings.accent, settings.mode]);

  // Set when a write hits the storage quota, so the user is told instead of
  // silently losing the newest messages.
  const [storageFull, setStorageFull] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  // Debounced persistence for heavy state objects to prevent frame stalls.
  // A quota error now trims the oldest entries and retries instead of only
  // writing a console warning (which used to lose the newest turn silently).
  useEffect(() => {
    const timer = setTimeout(() => {
      const ok = setJson(STORAGE.sessions, sessions, {
        label: 'sessions',
        recover: () => trimOldest(sessions, 0.25, 3)
      });
      setStorageFull(!ok);
    }, 400);
    return () => clearTimeout(timer);
  }, [sessions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJson(STORAGE.settings, settings, { label: 'settings' });
    }, 400);
    return () => clearTimeout(timer);
  }, [settings]);

  useEffect(() => {
    setJson(STORAGE.providers, providers, { label: 'providers' });
  }, [providers]);

  useEffect(() => {
    setJson(STORAGE.snippets, snippets, { label: 'snippets' });
  }, [snippets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJson(STORAGE.projectFiles, projectFiles, {
        label: 'project files',
        recover: () => trimOldest(projectFiles, 0.4, 2)
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [projectFiles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJson(STORAGE.artifacts, generatedFiles, {
        label: 'artifacts',
        // Artifacts largely duplicate projectFiles, so they are the cheapest to drop.
        recover: () => trimOldest(generatedFiles, 0.4, 3)
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [generatedFiles]);

  // Keyboard shortcuts: ESC closes overlays / stops generation, Ctrl(⌘)+F focuses
  // the in-conversation search that the header button opens.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSessionsModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsModelPickerOpen(false);
        setIsProviderPickerOpen(false);
        setIsProjectModalOpen(false);
        setIsSnippetsModalOpen(false);
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        }
        if (isBusy) {
          handleStopGeneration();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, isSearchOpen]);

  const startTypingTimer = () => {
    const startTime = Date.now();
    setTypingElapsed(0);
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTypingElapsed((Date.now() - startTime) / 1000);
    }, 100);
  };

  const stopTypingTimer = () => {
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };

  const handlePreviewCode = useCallback((code: string) => {
    setPreviewHtml(code);
    setIsPreviewOpen(true);
  }, []);

  const handleQuickSend = useCallback((text: string) => {
    handleSendRef.current(text);
  }, []);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopTypingTimer();
    setIsBusy(false);
    setIsStreaming(false);
    setIsAgentRunning(false);
  };

  // Helper to extract and update preview HTML if generated
  const checkHtmlCodeForPreview = (content: string) => {
    const match = content.match(/```(?:html|htm)\n([\s\S]*?)```/i);
    if (match && match[1]) {
      setPreviewHtml(match[1].trim());
    }
  };

  // Autonomous Tool Runner for Agent Mode
  const executeAgentTool = async (tc: any): Promise<string> => {
    const fn = tc.function?.name || '';

    // The user pressed Stop: do not start (or keep stacking) tool side effects.
    if (abortControllerRef.current?.signal.aborted) {
      return '[Cancelled by user before tool execution]';
    }

    let args: any = {};
    try {
      args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments || '{}') : tc.function.arguments || {};
    } catch {}

    const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const stepLabel = args.query || args.url || args.filename || args.expression || args.key || args.action || (args.code ? 'script' : '');
    
    setAgentSteps(prev => [
      ...prev,
      {
        id: stepId,
        fn,
        label: String(stepLabel).slice(0, 45),
        status: 'running'
      }
    ]);

    try {
      let result = '';
      switch (fn) {
        case 'web_search':
          result = await webSearch(args.query, settings.serper);
          break;
        case 'fetch_url':
          result = await fetchURL(args.url);
          break;
        case 'run_python':
          result = await runPython(args.code, (msg) => setTypingStatus(msg));
          break;
        case 'exec_js':
          result = await execJS(args.code);
          break;
        case 'create_file': {
          const fn = args.filename || `file_${Date.now()}.txt`;
          const ct = args.content || '';
          const ext = fn.split('.').pop()?.toLowerCase() || '';
          const lang = ext === 'tsx' || ext === 'ts' ? 'typescript' : ext === 'jsx' || ext === 'js' ? 'javascript' : ext === 'py' ? 'python' : ext === 'html' || ext === 'htm' ? 'html' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : 'text';

          setGeneratedFiles(prev => {
            const idx = prev.findIndex(f => f.name.toLowerCase() === fn.toLowerCase());
            const art: GeneratedFile = {
              id: idx >= 0 ? prev[idx].id : `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: fn,
              type: 'code',
              language: lang,
              content: ct,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = art;
              return updated;
            }
            return [art, ...prev];
          });

          setProjectFiles(prev => {
            const idx = prev.findIndex(f => f.name.toLowerCase() === fn.toLowerCase());
            const pf: ProjectFile = {
              name: fn,
              size: ct.length,
              content: ct
            };
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = pf;
              return updated;
            }
            return [...prev, pf];
          });

          if (fn.toLowerCase().endsWith('.html') || fn.toLowerCase().endsWith('.htm')) {
            setPreviewHtml(ct);
          }
          result = `File "${fn}" created/updated in Artifacts & Project workspace (${ct.length} chars).`;
          break;
        }
        case 'math_eval':
          result = mathEval(args.expression);
          break;
        case 'wiki_search':
          result = await wikiSearch(args.query, args.lang || 'en');
          break;
        case 'json_tool':
          result = jsonTool(args.action, args.json);
          break;
        case 'regex_test':
          result = regexTest(args.pattern, args.flags || 'g', (args.text || '').slice(0, 50000));
          break;
        case 'encode':
          result = encodeText(args.text, args.mode);
          break;
        case 'hash_text':
          result = await hashText(args.text, args.algo || 'SHA-256');
          break;
        case 'now':
          result = toolNow();
          break;
        case 'remember':
          setSettings(prev => ({
            ...prev,
            agentMem: { ...(prev.agentMem || {}), [args.key]: args.value }
          }));
          gSoulEngine.storeFact({
            category: 'preference',
            title: args.key,
            content: String(args.value),
            keywords: [args.key],
            confidence: 1.0
          }).catch(() => {});
          result = `💾 Saved to GSoul persistent memory: ["${args.key}"] = "${args.value}"`;
          break;
        case 'recall':
          if (args.key) {
            const memoryVal = settings.agentMem?.[args.key];
            if (memoryVal !== undefined) {
              result = memoryVal;
            } else {
              const semanticMatches = await gSoulEngine.searchSemantic(args.key, 2);
              if (semanticMatches.length > 0) {
                result = `[GSoul Semantic Memory Match]\n` + semanticMatches.map(m => `• ${m.title}: ${m.content}`).join('\n');
              } else {
                result = `Key "${args.key}" not found in GSoul memory. Known keys: ${Object.keys(settings.agentMem || {}).join(', ') || 'none'}`;
              }
            }
          } else {
            const allFacts = await gSoulEngine.getAllFacts();
            result = Object.keys(settings.agentMem || {}).length || allFacts.length
              ? JSON.stringify({ localMemory: settings.agentMem, semanticFacts: allFacts.map(f => ({ key: f.title, value: f.content })) }, null, 2)
              : '(Persistent memory is currently empty)';
          }
          break;
        case 'modbus_controller':
          result = await executeModbusTool(args);
          break;
        case 'termux_bridge':
          result = await executeTermuxBridge(args);
          break;
        case 'make_chart':
          result = await makeChart(args, (dataUrl, title) => {
            // Render the chart into the chat instead of only telling the model it worked.
            pendingChartsRef.current.push({ url: dataUrl, alt: title || 'Generated chart' });
          });
          break;
        case 'analyze_text':
          result = agentAnalyze(args.text, args.task);
          break;
        case 'zapier_action':
          result = await zapierAction(args.action, args.params, settings.zapierWebhook);
          break;
        case 'make_webhook':
          result = await makeWebhook(args.scenario, args.payload, settings.makeWebhook);
          break;
        case 'vector_rag_search':
          result = await vectorRagSearch(args.query, args.top_k || 3, settings.pineconeKey, settings.pineconeEnv);
          break;
        case 'generate_image':
          result = generateImageTool(args.prompt, args.style || 'photorealistic');
          break;
        case 'elevenlabs_tts':
          result = await elevenLabsTTS(args.text, args.voice || 'Rachel', settings.elevenlabsKey);
          break;
        case 'chat_analytics':
          result = chatAnalytics();
          break;
        case 'data_analyst':
          result = await executeDataAnalyst(args.filename, args.action, args.query, (msg) => setTypingStatus(msg));
          break;
        case 'pdf_analyzer':
          result = await executePdfAnalyzer(args.filename, args.action, args.page_start || 1, args.page_end, args.keyword, (msg) => setTypingStatus(msg));
          break;
        case 'n8n_automation':
          result = await triggerN8nAutomation(args.webhook_url, args.payload);
          break;
        case 'free_tts_stt':
          result = freeTTSSTT(args.text, args.lang || 'en');
          break;
        case 'github_repo_explorer_v2':
          result = await fetchGitHubTree(args, { githubPat: settings.githubPat, projectFiles });
          break;
        case 'github_code_reader':
          result = await readGitHubFile(args, { githubPat: settings.githubPat, projectFiles });
          break;
        case 'github_code_search':
          result = await searchGitHubCode(args, { githubPat: settings.githubPat, projectFiles });
          break;
        case 'github_publisher':
          result = await publishToGitHub(args, { githubPat: settings.githubPat, projectFiles });
          break;
        case 'code_analyzer_pro':
          result = analyzeCodePro(args);
          break;
        case 'web_repo_cloner_sim':
          result = simulateCloneAndAnalyze({ files: args.files || projectFiles });
          break;
        default:
          try {
            result = await executeAgentToolUniversal(fn, args, { githubPat: settings.githubPat, projectFiles });
          } catch (e: any) {
            // Check custom tools defined in settings executed safely in isolated Web Worker
            const customToolMatch = settings.customTools?.find(ct => ct.id === fn);
            if (customToolMatch) {
              result = await executeSandboxedCustomTool(customToolMatch.code, args, settings);
            } else {
              result = `[Unknown tool: ${fn}] - ${e.message}`;
            }
          }
      }

      // Simulated tools are prefixed with an explicit notice so the model can
      // never pass a fabricated PLC/hardware payload off as real data.
      const annotated = annotateToolResult(fn, String(result));
      setAgentSteps(prev =>
        prev.map(s => (s.id === stepId ? { ...s, status: 'done', resultPreview: annotated.slice(0, 50) } : s))
      );
      return annotated;
    } catch (err: any) {
      setAgentSteps(prev =>
        prev.map(s => (s.id === stepId ? { ...s, status: 'error', resultPreview: err.message } : s))
      );
      return `[Tool ${fn} error: ${err.message}]`;
    }
  };

  const extractArtifacts = (text: string) => {
    if (!text) return;
    const codeBlockRegex = new RegExp('```([a-zA-Z0-9_-]*)\\n([\\s\\S]*?)```', 'g');
    let match;
    let newFiles: GeneratedFile[] = [];
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const lang = match[1] || 'text';
      const content = match[2];
      if (!content.trim()) continue;

      const ext = lang === 'typescript' || lang === 'tsx' ? 'tsx' : lang === 'javascript' || lang === 'jsx' ? 'jsx' : lang === 'python' ? 'py' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : lang === 'json' ? 'json' : 'txt';
      
      const fnMatch = content.match(/(?:\/\/|\/\*|<!--|\#)\s*(?:filename|file|title):\s*([a-zA-Z0-9_\-./]+)/i);
      let fileName = fnMatch ? fnMatch[1].trim() : '';
      if (!fileName) {
        fileName = `artifact_${Date.now().toString().slice(-4)}.${ext}`;
      }

      newFiles.push({
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: fileName,
        type: 'code',
        language: lang,
        content: content,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (newFiles.length > 0) {
      setGeneratedFiles(prev => {
        let updated = [...prev];
        for (const nf of newFiles) {
          const idx = updated.findIndex(f => f.name.toLowerCase() === nf.name.toLowerCase());
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], content: nf.content, language: nf.language, createdAt: nf.createdAt };
          } else {
            updated = [nf, ...updated];
          }
        }
        return updated;
      });

      setProjectFiles(prev => {
        let updated = [...prev];
        for (const nf of newFiles) {
          const idx = updated.findIndex(f => f.name.toLowerCase() === nf.name.toLowerCase());
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], content: nf.content, size: nf.content.length };
          } else {
            updated.push({
              name: nf.name,
              type: 'file',
              size: nf.content.length,
              content: nf.content
            });
          }
        }
        return updated;
      });
    }
  };

  // Charts produced by the `make_chart` agent tool during the current turn.
  const pendingChartsRef = useRef<{ url: string; alt: string }[]>([]);
  // Guards against a second auto-summary starting while one is in flight.
  const summarizingRef = useRef(false);
  // How much of the transcript the last digest already covered.
  const summarizeMarkRef = useRef(0);
  // Latest settings/providers snapshot, so async callbacks never read a stale closure.
  const settingsRef = useRef(settings);
  const providersRef = useRef(providers);
  const activeProviderIdRef = useRef(activeProviderId);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    providersRef.current = providers;
    activeProviderIdRef.current = activeProviderId;
  }, [providers, activeProviderId]);

  // Keep the agent-facing workspace registry in sync with the real files the
  // user/agent have in the session (see services/projectMemory.ts).
  useEffect(() => {
    syncWorkspace(projectFiles.map(f => ({ name: f.name, content: f.content })), 'workspace');
  }, [projectFiles]);

  /**
   * Shared tail for both the standard and the agent path: persist the reply,
   * harvest artifacts, teach GSoul, speak it and roll the conversation summary.
   */
  const finalizeReply = async (args: {
    sessionId: string;
    history: ChatMessage[];
    finalText: string;
    thinking?: string;
    modelId: string;
    agent: boolean;
    userText: string;
    /**
     * 'append'        – plain mode: nothing was stored yet.
     * 'replace-last'  – agent mode: the orchestrator already pushed a bare copy of
     *                   the final message, swap it for the enriched one instead of
     *                   duplicating the assistant turn in the transcript.
     */
    mode?: 'append' | 'replace-last';
  }) => {
    const charts = pendingChartsRef.current.splice(0, pendingChartsRef.current.length);

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: args.finalText,
      think: args.thinking || undefined,
      mod: args.modelId,
      ts: Date.now(),
      ...(args.agent ? { ag: true } : {}),
      ...(charts.length ? { images: charts } : {})
    };

    const last = args.history[args.history.length - 1];
    const replaceLast = args.mode === 'replace-last' && last?.role === 'assistant' && !last.tool_calls;
    const nextHistory = replaceLast ? [...args.history.slice(0, -1), aiMessage] : [...args.history, aiMessage];

    setSessions(prev => prev.map(s => (s.id === args.sessionId ? { ...s, history: nextHistory } : s)));

    extractArtifacts(args.finalText || '');

    // ── Long-term memory (was: never written outside the `remember` tool) ──
    gSoulEngine
      .recordInteraction({
        sessionId: args.sessionId,
        prompt: args.userText,
        reply: args.finalText || '',
        model: args.modelId,
        agent: args.agent,
        toolsUsed: args.history.filter(m => m.tool_calls).flatMap(m => (m.tool_calls || []).map(t => t.function?.name || ''))
      })
      .catch(() => {});
    gSoulEngine.learnFromUserMessage(args.userText).catch(() => {});

    // ── Auto-speak the answer when TTS is on in the composer/settings ──
    const snap = settingsRef.current;
    if (snap.tts && (args.finalText || '').trim()) {
      speakText(args.finalText, undefined, undefined, {
        voiceName: snap.ttsVoice || undefined,
        rate: snap.ttsSpeed || 1
      });
    }

    // ── Rolling summary (settings.autoSum / sumThreshold / sumKeep) ──
    await maybeSummarize(nextHistory);
  };

  /**
   * Compress older turns into `settings.summary` so long chats keep their thread.
   * Takes the fresh history directly — reading `sessions` here would use the
   * closure from the render that started the request and summarize a stale slice.
   */
  const maybeSummarize = async (history: ChatMessage[]) => {
    const snap = settingsRef.current;
    if (!snap.autoSum) return;
    if (summarizingRef.current) return;

    const threshold = Math.max(4, Number(snap.sumThreshold) || 20);
    if (history.length < threshold) return;

    const keep = Math.max(2, Number(snap.sumKeep) || 6);
    const older = history.slice(0, Math.max(0, history.length - keep));
    if (older.length < 2) return;

    // Don't re-summarise every single turn once the threshold is passed — only
    // when enough new material accumulated to be worth another request.
    const lastMark = summarizeMarkRef.current;
    if (older.length - lastMark < 6) return;
    summarizeMarkRef.current = older.length;

    // Chain the previous digest so the summary is rolling, not a snapshot of the
    // last N messages only.
    const carried: ChatMessage[] = snap.summary
      ? [{ role: 'user', content: `[Summary of everything before this point]\n${snap.summary}` }]
      : [];

    const prov = providersRef.current.find(p => p.id === activeProviderIdRef.current) || providersRef.current[0];
    const adapter = getAdapterForProvider(prov?.pvType || 'openai-compatible');
    const cfgAll: Record<string, any> = { ...MODELS, ...(snap.customModels || {}) };
    const cfgForSummary = cfgAll[snap.mod];
    const endpoint = normalizeChatEndpoint(prov?.baseUrl || EP.nvidia);
    const apiKey = sanitizeApiKey(prov?.apiKey || '');
    if (!apiKey) return; // never spend a request we cannot authenticate

    summarizingRef.current = true;
    try {
      const digest =
        (await generateSummary([...carried, ...older], {
          adapter,
          endpoint,
          apiKey,
          model: cfgForSummary?.mid || snap.mod,
          maxTokens: 700
        })) || buildLocalDigest(older);

      if (!digest) return;
      setSettings(prev => {
        if (prev.summary === digest) return prev;
        return { ...prev, summary: digest };
      });
    } finally {
      summarizingRef.current = false;
    }
  };

  // Main Send handler
  const handleSend = async (
    text: string,
    visionFile?: { name: string; url: string },
    overrideSessionId?: string,
    overrideHistory?: ChatMessage[]
  ) => {
    if (isBusy) return;
    const body = (text || '').trim();
    if (!body && !visionFile) return;

    // Stop any playback from the previous answer before generating a new one.
    stopSpeech();
    pendingChartsRef.current = [];

    let targetSId = overrideSessionId || activeSessionId;
    let targetSession = sessions.find(s => s.id === targetSId);

    if (!targetSession) {
      // Reuse an id the caller already announced (WelcomeView quick prompts create a
      // session and pass its id in) instead of minting a second, empty one.
      const newId = targetSId && targetSId !== 'welcome' ? targetSId : `s-${Date.now()}`;
      const newS: Session = {
        id: newId,
        title: body.slice(0, 30) + (body.length > 30 ? '…' : ''),
        date: new Date().toISOString(),
        history: []
      };
      targetSession = newS;
      targetSId = newId;
      setSessions(prev => (prev.some(s => s.id === newId) ? prev : [newS, ...prev]));
      setActiveSessionId(newId);
    }

    let targetModelId = settings.mod;

    // Smart task routing
    if (settings.taskRoute && !visionFile) {
      const task = detectTask(text);
      const candidates = ROUTE_MAP[task] || ROUTE_MAP.general;
      if (candidates[0] && candidates[0] !== settings.mod) {
        targetModelId = candidates[0];
        setSettings(prev => ({ ...prev, mod: candidates[0] }));
      }
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      ts: Date.now(),
      vi: visionFile?.url || null
    };

    const baseHistory = overrideHistory !== undefined ? overrideHistory : (targetSession.history || []);
    const currentHistory = [...baseHistory, userMessage];

    // Update active session with user message
    setSessions(prev => {
      const exists = prev.some(s => s.id === targetSId);
      if (!exists) {
        return [{ ...targetSession!, history: currentHistory }, ...prev];
      }
      return prev.map(s => {
        if (s.id === targetSId) {
          const newTitle = s.history.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '…' : '') : s.title;
          return {
            ...s,
            title: newTitle,
            history: currentHistory
          };
        }
        return s;
      });
    });

    setIsBusy(true);
    startTypingTimer();
    abortControllerRef.current = new AbortController();

    const allModels: Record<string, any> = { ...MODELS, ...(settings.customModels || {}) };
    const cfg = allModels[targetModelId];
    let endpoint = activeProvider?.baseUrl || EP.nvidia;
    let rawApiKey = activeProvider?.apiKey || '';

    // If activeProvider does NOT have an API key configured, search providers for a matching key
    if (!rawApiKey.trim() && cfg) {
      const matchWithKey = providers.find(p => (p.id === cfg.pv || p.pvType === cfg.pv) && p.apiKey?.trim());
      if (matchWithKey) {
        endpoint = matchWithKey.baseUrl || endpoint;
        rawApiKey = matchWithKey.apiKey;
      } else {
        const matchProv = providers.find(p => p.id === cfg.pv || p.pvType === cfg.pv);
        if (matchProv?.baseUrl) {
          endpoint = matchProv.baseUrl;
        }
      }
    }

    if (!endpoint) {
      if (cfg?.pv === 'nvidia') endpoint = EP.nvidia;
      else if (cfg?.pv === 'groq') endpoint = EP.groq;
      else endpoint = EP.nvidia;
    }

    endpoint = normalizeChatEndpoint(endpoint);
    const cleanApiKey = sanitizeApiKey(rawApiKey);

    if (!cleanApiKey) {
      setHasRecentError(true);
      setTimeout(() => setHasRecentError(false), 4000);
      setSessions(prev =>
        prev.map(s =>
          s.id === targetSId
            ? {
                ...s,
                history: [
                  ...currentHistory,
                  {
                    role: 'assistant',
                    content:
                      '⚠️ No API key configured for this provider.\n\nOpen Settings → Providers, paste a key and press Verify — the app will not guess one for you.',
                    error: true,
                    mod: targetModelId,
                    ts: Date.now()
                  }
                ]
              }
            : s
        )
      );
      setIsBusy(false);
      stopTypingTimer();
      return;
    }

    try {
      // ══════ SMART TASK ROUTING & ORCHESTRATION ══════
      let useAgent = settings.agent;
      let finalTargetModelId = targetModelId;

      if (settings.taskRoute && !visionFile) {
        const taskRoute = AgentOrchestrator.classifyTask(text);
        if (taskRoute.requiresAgent) {
          useAgent = true;
        }
      }

      const activeToolsList = getActiveAgentTools(settings.enabledTools, settings.customTools, settings);
      const adapter = getAdapterForProvider(activeProvider?.pvType || 'openai-compatible');

      // ══════ CONTEXT AUGMENTATION (GSoul memory + optional live web search) ══════
      let extraSystem = '';
      try {
        const memory = await gSoulEngine.buildMemoryContext(text);
        if (memory) extraSystem += memory + '\n\n';
      } catch {}

      // The composer's "Web search" toggle used to be decorative: the flag was
      // read only by the agent tool. Now it actually retrieves fresh sources and
      // injects them, in both plain and agent mode.
      if (settings.webSearch && !visionFile) {
        setTypingStatus('🔎 Searching the web...');
        try {
          const hasSerper = !!settings.serper?.trim();
          const hits = await webSearch(text.slice(0, 200), settings.serper);
          if (hits && !hits.startsWith('❌')) {
            extraSystem += hasSerper
              ? `🔎 LIVE WEB SEARCH RESULTS for this turn (cite them when relevant):\n${hits.slice(0, 6000)}`
              : `🔎 WEB RESULTS (Wikipedia fallback only — no Serper key configured, so this is encyclopedic context, not fresh news). Do not claim this is live news:\n${hits.slice(0, 6000)}`;
          }
        } catch (e: any) {
          extraSystem += `🔎 Web search requested but failed: ${e?.message || 'unknown error'}`;
        }
      }

      const requestPayload = {
        endpoint,
        apiKey: cleanApiKey,
        model: cfg?.mid || finalTargetModelId,
        messages: buildCtx(currentHistory, settings, projectFiles, finalTargetModelId, false, generatedFiles, {
          extraSystem
        }),
        temperature: settings.tmp ?? cfg?.t ?? 0.7,
        topP: cfg?.p || 1,
        // NOTE: must be an OUTPUT limit — cfg.mk is the context window and made
        // providers answer 400 Invalid max_tokens for most models.
        maxTokens: resolveMaxOutputTokens(finalTargetModelId, settings.maxTok, settings.customModels),
        signal: abortControllerRef.current.signal,
        tools: useAgent && activeToolsList.length > 0 ? activeToolsList : undefined
      };

      if (useAgent && activeToolsList.length > 0) {
        // ══════ UNIFIED AGENT MULTI-TURN MODE ══════
        setIsAgentRunning(true);
        setAgentSteps([]);
        setTypingStatus('🤖 Agent Thinking...');
        setIsStreaming(true);
        setStreamingContent('');
        setStreamingThinking('');

        const ctx = {
          history: currentHistory,
          executeTool: executeAgentTool,
          adapter,
          requestTemplate: requestPayload,
          buildMessages: (hist: any[]) =>
            buildCtx(hist, settings, projectFiles, finalTargetModelId, false, generatedFiles, { extraSystem }),
          maxIterations: 8
        };

        const generator = AgentOrchestrator.runAgentLoop(ctx);
        let result = await generator.next();
        let currentLoopHistory = [...currentHistory];
        let agentText = '';
        let agentThinking = '';

        while (!result.done) {
           const event = result.value as StreamEvent;
           if (event.type === 'error') {
              throw new Error(event.message || 'Agent error');
           }
           if (event.type === 'thinking_delta') {
              agentThinking += event.text || '';
              setStreamingThinking(prev => prev + (event.text || ''));
           }
           if (event.type === 'content_delta') {
              agentText += event.text || '';
              setStreamingContent(prev => {
                const newContent = prev + (event.text || '');
                checkHtmlCodeForPreview(newContent);
                return newContent;
              });
           }
           if (event.type === 'tool_start') {
              setTypingStatus(`🔧 Executing tool: ${event.toolCall?.function?.name || 'unknown'}...`);
           }
           result = await generator.next();
        }

        // When done, result.value contains the returned history
        if (Array.isArray(result.value)) {
           currentLoopHistory = result.value;
        }

        // Agent turns previously produced no model tag and no artifacts.
        await finalizeReply({
          sessionId: targetSId,
          history: currentLoopHistory,
          finalText: agentText,
          thinking: agentThinking,
          modelId: finalTargetModelId,
          agent: true,
          userText: text,
          mode: 'replace-last'
        });

        setIsJustFinished(true);
        setTimeout(() => setIsJustFinished(false), 3200);

      } else {
        // ══════ STANDARD STREAMING MODE (Unified Engine) ══════
        setIsStreaming(true);
        setStreamingContent('');
        setStreamingThinking('');
        setTypingStatus('Synthesizing...');

        let fullText = '';
        let fullThinking = '';

        for await (const event of adapter.streamChat(requestPayload)) {
          if (event.type === 'error') {
             throw new Error(event.message || 'Stream error');
          }
          if (event.type === 'thinking_delta') {
             fullThinking += event.text;
             setStreamingThinking(fullThinking);
          }
          if (event.type === 'content_delta') {
             fullText += event.text;
             const { display, thinking } = parseThink(fullText);
             if (thinking) {
                setStreamingThinking(fullThinking + thinking);
             }
             setStreamingContent(display);
             checkHtmlCodeForPreview(display);
          }
        }

        const { display: finalDisplay, thinking: finalThinking } = parseThink(fullText);

        await finalizeReply({
          sessionId: targetSId,
          history: currentHistory,
          finalText: finalDisplay || fullText,
          thinking: fullThinking || finalThinking,
          modelId: finalTargetModelId,
          agent: false,
          userText: text
        });

        setIsJustFinished(true);
        setTimeout(() => setIsJustFinished(false), 3200);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setHasRecentError(true);
        setTimeout(() => setHasRecentError(false), 4000);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ Connection Error: ${err.message}\n\nPlease check your API key and endpoint configuration in Settings.`,
          error: true,
          mod: targetModelId,
          ts: Date.now()
        };
        setSessions(prev =>
          prev.map(s => (s.id === targetSId ? { ...s, history: [...currentHistory, errorMsg] } : s))
        );
        gSoulEngine
          .addEpisode({ sessionId: targetSId, type: 'error', summary: err.message?.slice(0, 300) || 'Generation failed' })
          .catch(() => {});
      }
    } finally {
      setIsBusy(false);
      setIsStreaming(false);
      setIsAgentRunning(false);
      setStreamingContent('');
      setStreamingThinking('');
      stopTypingTimer();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  // A new/cleared conversation must not inherit the previous summary state.
  useEffect(() => {
    summarizeMarkRef.current = 0;
    setAgentSteps([]);
  }, [activeSessionId]);

  const handleCreateSession = () => {
    const newId = `s-${Date.now()}`;
    const newSession: Session = {
      id: newId,
      title: 'New Conversation',
      date: new Date().toISOString(),
      history: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleQuickPrompt = (promptText: string) => {
    const newId = `s-${Date.now()}`;
    const newSession: Session = {
      id: newId,
      title: promptText.slice(0, 30) + (promptText.length > 30 ? '…' : ''),
      date: new Date().toISOString(),
      history: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    handleSend(promptText, undefined, newId);
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return;
    const target = sessions.find(s => s.id === id);
    if (target) {
      // Add to trash for restore
      const trash = JSON.parse(localStorage.getItem(STORAGE.trash) || '[]');
      trash.push(target);
      localStorage.setItem(STORAGE.trash, JSON.stringify(trash.slice(-15)));
    }
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    if (activeSessionId === id) {
      // next can legitimately be empty right after a bulk delete — fall back to
      // the welcome screen instead of reading .id off undefined and crashing.
      setActiveSessionId(next[0]?.id ?? 'welcome');
    }
  };

  const handleRestoreTrash = () => {
    const trash = JSON.parse(localStorage.getItem(STORAGE.trash) || '[]');
    if (!trash.length) {
      alert('Trash is empty.');
      return;
    }
    const restored = trash.pop();
    localStorage.setItem(STORAGE.trash, JSON.stringify(trash));
    setSessions(prev => [restored, ...prev]);
    setActiveSessionId(restored.id);
  };

  const handleClearChat = () => {
    if (!activeSession) return;
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? { ...s, history: [] } : s))
      );
    }
  };

  const handleExportChat = () => {
    if (!activeSession || !activeSession.history.length) return;
    let markdown = `# ${APP_NAME} ${APP_VERSION_LABEL} — ${activeSession.title}\n\n`;
    activeSession.history.forEach(m => {
      if (m.role === 'user') {
        markdown += `### 👤 User\n${m.content}\n\n`;
      } else if (m.role === 'assistant') {
        const modelName = MODELS[m.mod || settings.mod]?.name || 'AI Assistant';
        markdown += `### 🤖 ${modelName}\n${m.content}\n\n---\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeSession.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditResend = (index: number, newText: string) => {
    if (!activeSession) return;
    const trimmedHistory = activeSession.history.slice(0, index);
    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? { ...s, history: trimmedHistory } : s))
    );
    handleSend(newText, undefined, activeSession.id, trimmedHistory);
  };

  const handleDeleteMessage = (index: number) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSession.id) {
          const nextHist = [...s.history];
          nextHist.splice(index, 1);
          return { ...s, history: nextHist };
        }
        return s;
      })
    );
  };

  const handleRetry = () => {
    if (!activeSession) return;
    const lastUserIndex = [...activeSession.history].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;
    const realIndex = activeSession.history.length - 1 - lastUserIndex;
    const lastUserMsg = activeSession.history[realIndex];
    const trimmedHistory = activeSession.history.slice(0, realIndex);
    
    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? { ...s, history: trimmedHistory } : s))
    );
    handleSend(lastUserMsg.content || '', undefined, activeSession.id, trimmedHistory);
  };

  const handleSpeak = useCallback((text: string) => {
    const snap = settingsRef.current;
    speakText(text, undefined, undefined, {
      voiceName: snap.ttsVoice || undefined,
      rate: snap.ttsSpeed || 1
    });
  }, []);

  const MAX_CONTEXT_FILE_BYTES = 1.5 * 1024 * 1024; // files are inlined into the prompt
  const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

  const handleAddProjectFiles = (fileList: FileList) => {
    const skipped: string[] = [];
    Array.from(fileList).forEach(file => {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        skipped.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB > limit)`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onerror = () => skipped.push(file.name);
      reader.onload = e => {
        const raw = (e.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (isImage) {
          // Images belong in the artifacts panel as previews — reading them as
          // text used to store binary garbage in the prompt.
          setGeneratedFiles(prev => [
            {
              id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              type: 'image',
              content: raw,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            ...prev.filter(f => f.name.toLowerCase() !== file.name.toLowerCase())
          ]);
          return;
        }

        const truncated = file.size > MAX_CONTEXT_FILE_BYTES;
        const content = truncated
          ? raw.slice(0, MAX_CONTEXT_FILE_BYTES) + '\n…[file truncated for context; open the original on disk]'
          : raw;
        const lang = ext === 'tsx' || ext === 'ts' ? 'typescript' : ext === 'jsx' || ext === 'js' ? 'javascript' : ext === 'py' ? 'python' : ext === 'html' || ext === 'htm' ? 'html' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : ext === 'md' ? 'markdown' : 'text';

        setProjectFiles(prev => [
          ...prev.filter(f => f.name.toLowerCase() !== file.name.toLowerCase()),
          { name: file.name, content, size: file.size }
        ]);

        setGeneratedFiles(prev => [
          {
            id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: 'code',
            language: lang,
            content: content,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev.filter(f => f.name.toLowerCase() !== file.name.toLowerCase())
        ]);
      };

      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

    if (skipped.length) {
      setFlashMessage(`⚠️ Skipped ${skipped.length} file(s): ${skipped.join(', ').slice(0, 160)}`);
      setTimeout(() => setFlashMessage(''), 6000);
    }
  };

  const totalSessionTokens = useMemo(
    () =>
      (activeSession?.history || []).reduce(
        (acc, m) => acc + countTokens(typeof m.content === 'string' ? m.content : ''),
        0
      ),
    [activeSession?.history]
  );

  const handleExportProject = async () => {
    if (!projectFiles.length) return;
    // jszip + file-saver are ~100 KB and only needed when someone presses Export,
    // so they are fetched on demand instead of blocking app start.
    const [{ default: JSZip }, { saveAs }] = await Promise.all([import('jszip'), import('file-saver')]);
    const zip = new JSZip();
    projectFiles.forEach(f => {
      zip.file(f.name, f.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'project-workspace.zip');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-[#f4f4f5] overflow-hidden">
      {/* Splash Screen */}
      {showSplashScreen && (
        <div className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center gap-6 animate-fadeIn transition-opacity duration-500">
          <div className="relative flex items-center justify-center">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[var(--accent)] to-purple-600 animate-pulse blur-2xl opacity-50 absolute" />
            <PremiumAvatar
              status="idle"
              className="w-20 h-20 !rounded-3xl shadow-2xl shadow-[var(--accent-light)] relative z-10 border border-[var(--accent)]/50"
            />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-2xl font-black text-white tracking-wider">GBG AI STUDIO</h1>
            <span className="text-xs text-[#a1a1aa] font-mono tracking-widest uppercase">{APP_VERSION_LABEL} • Next Generation AI</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        onToggleSessions={() => setIsSessionsModalOpen(true)}
        onGoWelcome={() => setActiveSessionId('welcome')}
        onToggleSearch={() => {
          setIsSearchOpen(prev => {
            if (prev) setSearchQuery('');
            return !prev;
          });
        }}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchDisabled={activeSessionId === 'welcome'}
        onTogglePreview={() => setIsPreviewOpen(prev => !prev)}
        isPreviewOpen={isPreviewOpen}
        onToggleArtifacts={() => setIsArtifactsOpen(prev => !prev)}
        isArtifactsOpen={isArtifactsOpen}
        artifactCount={generatedFiles.length}
        onExportChat={handleExportChat}
        onClearChat={handleClearChat}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenProject={() => setIsProjectModalOpen(true)}
        projectCount={projectFiles.length}
        agentStatus={currentAgentBehavior.state}
      />

      {/* Transient notice (skipped attachments etc.) */}
      {flashMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[130px] z-[60] px-4 py-2 rounded-2xl bg-[#18181b] border border-amber-500/40 text-amber-200 text-[11px] font-mono shadow-2xl animate-fadeIn max-w-[92vw] select-text">
          {flashMessage}
        </div>
      )}

      {/* Storage pressure warning: the user must learn that saves are being trimmed */}
      {storageFull && (
        <div className="fixed left-0 right-0 z-40 mt-[54px] px-3 py-2 bg-amber-500/15 border-b border-amber-500/30 backdrop-blur flex items-center gap-2 text-[11px] text-amber-200 animate-fadeIn">
          <span className="flex-1 select-text">
            ⚠️ Local storage is full — older chats and artifacts were trimmed so the newest ones could be saved.
            Export important conversations, then clear them in the sessions panel.
          </span>
          <button
            onClick={() => setStorageFull(false)}
            className="shrink-0 px-2 py-0.5 rounded-md border border-amber-500/30 hover:bg-amber-500/20 font-mono transition-colors cursor-pointer"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Main Content Area: Welcome Screen or Chat Page */}
      <ErrorBoundary fallbackTitle="Application Workspace Render Error">
        <main className={`flex-1 ${isSearchOpen ? 'mt-[96px]' : 'mt-[58px]'} ${activeSessionId === 'welcome' ? 'mb-0' : 'mb-[110px]'} relative overflow-hidden flex flex-col transition-[margin] duration-200`}>
          {activeSessionId === 'welcome' ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <WelcomeView
                sessions={sessions}
                activeProvider={activeProvider}
                settings={settings}
                onStartNewChat={handleCreateSession}
                onSelectSession={id => setActiveSessionId(id)}
                onDeleteSession={handleDeleteSession}
                onQuickPrompt={handleQuickPrompt}
                onOpenProviderPicker={() => setIsProviderPickerOpen(true)}
                onOpenModelPicker={() => setIsModelPickerOpen(true)}
              />
              {/* Live Code Preview Sandbox */}
              <LivePreview
                htmlCode={previewHtml}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onRefresh={() => setPreviewHtml(prev => prev + ' ')}
              />
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden relative">
              <ChatPage
                history={activeSession ? activeSession.history : []}
                streamingContent={streamingContent}
                streamingThinking={streamingThinking}
                isStreaming={isStreaming}
                agentSteps={agentSteps}
                isAgentRunning={isAgentRunning}
                typingStatus={typingStatus}
                typingElapsed={typingElapsed}
                currentModelId={settings.mod}
                onQuickPrompt={handleQuickSend}
                onPreviewCode={handlePreviewCode}
                onRetry={handleRetry}
                onEditResend={handleEditResend}
                onDeleteMessage={handleDeleteMessage}
                onSpeak={handleSpeak}
                searchQuery={isSearchOpen ? searchQuery : ''}
                isPreviewOpen={isPreviewOpen}
              />

              {/* Live Code Preview Sandbox */}
              <LivePreview
                htmlCode={previewHtml}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onRefresh={() => setPreviewHtml(prev => prev + ' ')}
              />

              {/* Artifacts & File Manager Sheet / Floating Viewer */}
              {isArtifactsOpen && (
                <ArtifactsPanel
                  files={generatedFiles}
                  activeFile={activeArtifact}
                  onSelectFile={file => setActiveArtifact(file)}
                  onDeleteFile={(id, e) => {
                    e.stopPropagation();
                    const targetFile = generatedFiles.find(f => f.id === id);
                    setGeneratedFiles(prev => prev.filter(f => f.id !== id));
                    if (targetFile) {
                      setProjectFiles(prev => prev.filter(f => f.name.toLowerCase() !== targetFile.name.toLowerCase()));
                    }
                    if (activeArtifact?.id === id) setActiveArtifact(null);
                  }}
                  onClose={() => {
                    setIsArtifactsOpen(false);
                    setActiveArtifact(null);
                  }}
                />
              )}
            </div>
          )}
        </main>
      </ErrorBoundary>

      {/* Global Bottom Input Area (Hidden on Welcome screen) */}
      {activeSessionId !== 'welcome' && (
        <InputArea
          settings={settings}
          onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
          activeProvider={activeProvider}
          onOpenModelPicker={() => setIsModelPickerOpen(true)}
          onOpenProviderPicker={() => setIsProviderPickerOpen(true)}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
          onOpenSnippetsModal={() => setIsSnippetsModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onTogglePreview={() => setIsPreviewOpen(prev => !prev)}
          isPreviewOpen={isPreviewOpen}
          onSend={handleSend}
          onStop={handleStopGeneration}
          isBusy={isBusy}
          totalSessionTokens={totalSessionTokens}
          projectCount={projectFiles.length}
        />
      )}

      {/* Modals */}
      <SessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={id => setActiveSessionId(id)}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRestoreTrash={handleRestoreTrash}
        onGoWelcome={() => setActiveSessionId('welcome')}
      />

      {/* Provider Picker Modal for Chat Page */}
      <ProviderPickerModal
        isOpen={isProviderPickerOpen}
        onClose={() => setIsProviderPickerOpen(false)}
        providers={providers}
        activeProviderId={activeProviderId}
        onSelectProvider={id => handleSelectProvider(id)}
        onOpenSettingsProviders={() => {
          setIsSettingsModalOpen(true);
        }}
      />

      {/* Full Page Settings Studio (lazy: only needed once the user opens it) */}
      {isSettingsModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#050505]" />}>
        <SettingsPage
          settings={settings}
          providers={providers}
          activeProviderId={activeProviderId}
          onSaveSettings={newS => setSettings(newS)}
          onSaveProviders={(p, activeId) => {
            setProviders(p);
            handleSelectProvider(activeId, p);
          }}
          onBack={() => setIsSettingsModalOpen(false)}
          onClearAllSessions={() => {
            const initial = [
              {
                id: `s-${Date.now()}`,
                title: 'New Conversation',
                date: new Date().toISOString(),
                history: []
              }
            ];
            setSessions(initial);
            setActiveSessionId('welcome');
          }}
        />
        </Suspense>
      )}

      <ModelPickerModal
        isOpen={isModelPickerOpen}
        onClose={() => setIsModelPickerOpen(false)}
        currentModelId={settings.mod}
        onSelectModel={id => setSettings(prev => ({ ...prev, mod: id }))}
        customModels={settings.customModels}
        onToggleStarModel={handleToggleStarModel}
        activeProvider={activeProvider}
        providers={providers}
        onUpdateProvider={updatedProv => {
          const nextProviders = providers.map(p => p.id === updatedProv.id ? updatedProv : p);
          setProviders(nextProviders);
          localStorage.setItem(STORAGE.providers, JSON.stringify(nextProviders));
        }}
        onSwitchProvider={id => handleSelectProvider(id)}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectFiles={projectFiles}
        onAddFiles={handleAddProjectFiles}
        onRemoveFile={index => {
          const fileToRemove = projectFiles[index];
          setProjectFiles(prev => prev.filter((_, i) => i !== index));
          if (fileToRemove) {
            setGeneratedFiles(prev => prev.filter(f => f.name.toLowerCase() !== fileToRemove.name.toLowerCase()));
          }
        }}
        onClearFiles={() => {
          setProjectFiles([]);
          setGeneratedFiles([]);
        }}
        onExportProject={handleExportProject}
      />

      <SnippetsModal
        isOpen={isSnippetsModalOpen}
        onClose={() => setIsSnippetsModalOpen(false)}
        snippets={snippets}
        onAddSnippet={s => setSnippets(prev => [s, ...prev])}
        onDeleteSnippet={idx => setSnippets(prev => prev.filter((_, i) => i !== idx))}
        onUseSnippet={code => handleSend(code)}
      />

      {/* Interactive Developer Documentation & Hardware Hub */}
      {isDocsOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#050505]" />}>
          <div className="fixed inset-0 z-50 flex flex-col bg-[#050505] animate-fadeIn">
            <DeveloperDocsPage onBack={() => setIsDocsOpen(false)} />
          </div>
        </Suspense>
      )}
    </div>
  );
}
