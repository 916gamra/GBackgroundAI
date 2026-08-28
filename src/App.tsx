import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Sparkles } from 'lucide-react';
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
  fetchRetry,
  parseThink,
  detectTask,
  ROUTE_MAP,
  countTokens
} from './services/aiService';
import { getAdapterForProvider } from './services/providers';
import { StreamEvent } from './services/streamEngine';
import { AgentOrchestrator } from './services/orchestrator/AgentOrchestrator';
import {
  AGENT_TOOLS,
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
import { SettingsPage } from './components/Pages/SettingsPage';
import { WelcomeView } from './components/Pages/WelcomeView';
import { DeveloperDocsPage } from './components/Pages/DeveloperDocsPage';
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
    try {
      const saved = localStorage.getItem('gbai_sessions_v13');
      if (saved) return JSON.parse(saved);
    } catch {}
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

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('gbai_settings_v13');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const saved = localStorage.getItem('gbai_providers_v13');
      let parsed: Provider[] | null = null;
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p)) parsed = p;
      }
      const list = parsed || DEFAULT_PROVIDERS;
      // Hydrate the built-in NVIDIA provider with the validated key (if any)
      try {
        const storedNvidiaKey = localStorage.getItem('gbai_nvidia_api_key');
        if (storedNvidiaKey) {
          return list.map(p =>
            p.id === 'nv-builtin' && !p.apiKey?.trim()
              ? { ...p, apiKey: storedNvidiaKey }
              : p
          );
        }
      } catch {}
      return list;
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

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    try {
      const saved = localStorage.getItem('gbai_project_files_v13');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem('gbai_snippets_v13');
      if (saved) return JSON.parse(saved);
    } catch {}
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
    try {
      const saved = localStorage.getItem('gbai_artifacts_v13');
      if (saved) return JSON.parse(saved);
    } catch {}
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

  // Debounced persistence for heavy state objects to prevent frame stalls
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('gbai_sessions_v13', JSON.stringify(sessions));
      } catch (e) {
        console.warn('Failed to persist sessions:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sessions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('gbai_settings_v13', JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to persist settings:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('gbai_providers_v13', JSON.stringify(providers));
    } catch (e) {
      console.warn('Failed to persist providers:', e);
    }
  }, [providers]);

  useEffect(() => {
    try {
      localStorage.setItem('gbai_snippets_v13', JSON.stringify(snippets));
    } catch (e) {
      console.warn('Failed to persist snippets:', e);
    }
  }, [snippets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('gbai_project_files_v13', JSON.stringify(projectFiles));
      } catch (e) {
        console.warn('Failed to persist project files:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [projectFiles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('gbai_artifacts_v13', JSON.stringify(generatedFiles));
      } catch (e) {
        console.warn('Failed to persist artifacts:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [generatedFiles]);

  // Keyboard shortcut listener (ESC to close modals and stop generation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSessionsModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsModelPickerOpen(false);
        setIsProviderPickerOpen(false);
        setIsProjectModalOpen(false);
        setIsSnippetsModalOpen(false);
        if (isBusy) {
          handleStopGeneration();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy]);

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

          if (fn.endsWith('.html') || fn.endsWith('.htm')) {
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
          result = await makeChart(args);
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

      setAgentSteps(prev =>
        prev.map(s => (s.id === stepId ? { ...s, status: 'done', resultPreview: String(result).slice(0, 50) } : s))
      );
      return String(result);
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

  // Main Send handler
  const handleSend = async (
    text: string,
    visionFile?: { name: string; url: string },
    overrideSessionId?: string,
    overrideHistory?: ChatMessage[]
  ) => {
    if (isBusy) return;

    let targetSId = overrideSessionId || activeSessionId;
    let targetSession = sessions.find(s => s.id === targetSId);

    if (!targetSession || targetSId === 'welcome') {
      const newS: Session = {
        id: `s-${Date.now()}`,
        title: text.slice(0, 30) + (text.length > 30 ? '…' : ''),
        date: new Date().toISOString(),
        history: []
      };
      targetSession = newS;
      targetSId = newS.id;
      setSessions(prev => [newS, ...prev]);
      setActiveSessionId(newS.id);
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

      const activeToolsList = getActiveAgentTools(settings.enabledTools, settings.customTools);
      const adapter = getAdapterForProvider(activeProvider?.pvType || 'openai-compatible');

      const requestPayload = {
        endpoint,
        apiKey: cleanApiKey,
        model: cfg?.mid || finalTargetModelId,
        messages: buildCtx(currentHistory, settings, projectFiles, finalTargetModelId, false, generatedFiles),
        temperature: settings.tmp ?? cfg?.t ?? 0.7,
        topP: cfg?.p || 1,
        maxTokens: parseInt(settings.maxTok) || cfg?.mk || 4096,
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
          buildMessages: (hist: any[]) => buildCtx(hist, settings, projectFiles, finalTargetModelId, false, generatedFiles),
          maxIterations: 8
        };

        const generator = AgentOrchestrator.runAgentLoop(ctx);
        let result = await generator.next();
        let currentLoopHistory = [...currentHistory];

        while (!result.done) {
           const event = result.value as StreamEvent;
           if (event.type === 'error') {
              throw new Error(event.message || 'Agent error');
           }
           if (event.type === 'thinking_delta') {
              setStreamingThinking(prev => prev + (event.text || ''));
           }
           if (event.type === 'content_delta') {
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

        setSessions(prev =>
          prev.map(s => (s.id === targetSId ? { ...s, history: currentLoopHistory } : s))
        );

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
                fullThinking += thinking;
                setStreamingThinking(fullThinking);
             }
             setStreamingContent(display);
             checkHtmlCodeForPreview(display);
          }
        }

        const { display: finalDisplay, thinking: finalThinking } = parseThink(fullText);
        const finalAiMessage: ChatMessage = {
          role: 'assistant',
          content: finalDisplay || fullText,
          think: finalThinking || fullThinking,
          mod: finalTargetModelId,
          ts: Date.now()
        };

        checkHtmlCodeForPreview(finalAiMessage.content || '');
        extractArtifacts(finalAiMessage.content || '');

        setSessions(prev =>
          prev.map(s => (s.id === targetSId ? { ...s, history: [...currentHistory, finalAiMessage] } : s))
        );

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
      const trash = JSON.parse(localStorage.getItem('gbai_trash_v13') || '[]');
      trash.push(target);
      localStorage.setItem('gbai_trash_v13', JSON.stringify(trash.slice(-15)));
    }
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    if (activeSessionId === id) {
      setActiveSessionId(next[0].id);
    }
  };

  const handleRestoreTrash = () => {
    const trash = JSON.parse(localStorage.getItem('gbai_trash_v13') || '[]');
    if (!trash.length) {
      alert('Trash is empty.');
      return;
    }
    const restored = trash.pop();
    localStorage.setItem('gbai_trash_v13', JSON.stringify(trash));
    setSessions(prev => [restored, ...prev]);
    setActiveSessionId(restored.id);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? { ...s, history: [] } : s))
      );
    }
  };

  const handleExportChat = () => {
    if (!activeSession.history.length) return;
    let markdown = `# GBackgroundAI Beast v13 — ${activeSession.title}\n\n`;
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

  const handleSpeak = (text: string) => {
    speakText(text);
  };

  const handleAddProjectFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const lang = ext === 'tsx' || ext === 'ts' ? 'typescript' : ext === 'jsx' || ext === 'js' ? 'javascript' : ext === 'py' ? 'python' : ext === 'html' || ext === 'htm' ? 'html' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : 'text';

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
      reader.readAsText(file);
    });
  };

  const totalSessionTokens = activeSession.history.reduce(
    (acc, m) => acc + countTokens(typeof m.content === 'string' ? m.content : ''),
    0
  );

  const handleExportProject = async () => {
    if (!projectFiles.length) return;
    const zip = new JSZip();
    projectFiles.forEach(f => {
      zip.file(f.name, f.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'project-workspace.zip');
  };

  const storageUsageBytes = JSON.stringify(sessions).length * 2;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-[#f4f4f5] overflow-hidden select-none">
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
            <span className="text-xs text-[#a1a1aa] font-mono tracking-widest uppercase">Beast v13 • Next Generation AI</span>
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
        onToggleSearch={() => setIsSearchOpen(prev => !prev)}
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

      {/* Main Content Area: Welcome Screen or Chat Page */}
      <ErrorBoundary fallbackTitle="Application Workspace Render Error">
        <main className={`flex-1 mt-[58px] ${activeSessionId === 'welcome' ? 'mb-0' : 'mb-[110px]'} relative overflow-hidden flex flex-col`}>
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
                onQuickPrompt={text => handleSend(text)}
                onPreviewCode={code => {
                  setPreviewHtml(code);
                  setIsPreviewOpen(true);
                }}
                onRetry={handleRetry}
                onEditResend={handleEditResend}
                onDeleteMessage={handleDeleteMessage}
                onSpeak={handleSpeak}
                searchQuery={searchQuery}
                isPreviewOpen={isPreviewOpen}
                settings={settings}
                onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
                activeProvider={activeProvider}
                onOpenModelPicker={() => setIsModelPickerOpen(true)}
                onOpenProviderPicker={() => setIsProviderPickerOpen(true)}
                onOpenProjectModal={() => setIsProjectModalOpen(true)}
                onOpenSnippetsModal={() => setIsSnippetsModalOpen(true)}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                onTogglePreview={() => setIsPreviewOpen(prev => !prev)}
                onSend={handleSend}
                onStop={handleStopGeneration}
                isBusy={isBusy}
                totalSessionTokens={totalSessionTokens}
                projectCount={projectFiles.length}
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

      {/* Full Page Settings Studio */}
      {isSettingsModalOpen && (
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
          localStorage.setItem('gbai_providers_v13', JSON.stringify(nextProviders));
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#050505] animate-fadeIn">
          <DeveloperDocsPage onBack={() => setIsDocsOpen(false)} />
        </div>
      )}
    </div>
  );
}
