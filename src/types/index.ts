export interface GeneratedFile {
  id: string;
  name: string;
  type: 'code' | 'image' | 'text' | 'pdf';
  content: string;
  language?: string;
  createdAt: string;
}

export interface ModelConfig {
  name: string;
  pv: string; // 'nvidia' | 'groq' | 'custom' | or any custom provider ID
  t: number;
  p: number;
  /** Total context window in tokens (input + output). NOT the output limit. */
  mk: number;
  /** Max *output* tokens the provider accepts. Sent as max_tokens/max_completion_tokens. */
  mo?: number;
  ex?: any;
  cat: 'code' | 'think' | 'general' | 'fast' | 'vision';
  desc: string;
  speed: number;
  power: number;
  sysPfx?: string;
  mid?: string;
  supportsVision?: boolean;
  supportsThinking?: boolean;
  supportsTools?: boolean;
  isCustom?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  defaultModel?: string;
  isBuiltin?: boolean;
  pvType?: string; // 'openai-compatible' | 'gemini' | 'ollama'
  headers?: Record<string, string>;
  availableModels?: string[];
  status?: 'connected' | 'error' | 'untested';
  latency?: number;
  lastTested?: number;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  mod?: string;
  ts?: number;
  vi?: string | null; // Vision base64/url
  think?: string;
  ag?: boolean;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  error?: boolean;
  /** Inline media produced during the turn (e.g. agent `make_chart` PNG data URLs). */
  images?: { url: string; alt?: string }[];
}

export interface Session {
  id: string;
  title: string;
  date: string;
  history: ChatMessage[];
}

export interface ProjectFile {
  name: string;
  content: string;
  size: number;
  type?: string;
}

export interface Snippet {
  title: string;
  code: string;
}

export interface CustomToolConfig {
  id: string;
  name: string;
  description: string;
  parametersJson: string;
  code: string; // JavaScript execution body
  category?: 'web' | 'code' | 'data' | 'system' | 'custom';
  enabled: boolean;
}

export interface AppSettings {
  mod: string;
  sys: string;
  tmp: number;
  ctx: number;
  maxTok: string;
  agent: boolean;
  webSearch: boolean;
  serper: string;
  summary: string;
  autoSum: boolean;
  sumThreshold: number;
  sumKeep: number;
  taskRoute: boolean;
  tts: boolean;
  ttsVoice: string;
  ttsSpeed: number;
  accent: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'cyan';
  mode: 'dark' | 'light';
  agentMem: Record<string, string>;
  customModels?: Record<string, ModelConfig>;
  enabledTools?: Record<string, boolean>;
  customTools?: CustomToolConfig[];
  pineconeKey?: string;
  pineconeEnv?: string;
  zapierWebhook?: string;
  makeWebhook?: string;
  elevenlabsKey?: string;
  dalleKey?: string;
  githubPat?: string;
}

export interface AgentStepEvent {
  id: string;
  fn: string;
  label: string;
  status: 'running' | 'done' | 'error';
  resultPreview?: string;
}


