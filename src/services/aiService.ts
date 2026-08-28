import { ModelConfig, ChatMessage, AppSettings, Provider, ProjectFile, GeneratedFile, AgentStepEvent } from '../types';
import {
  AGENT_TOOLS,
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
  makeChart
} from './agentTools';

export const EP = {
  nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  meta: 'https://api.meta.ai/v1/chat/completions'
};

export function sanitizeApiKey(key?: string): string {
  if (!key) return '';
  let k = key.trim();
  // Remove wrapping single or double quotes
  k = k.replace(/^["']|["']$/g, '').trim();
  // Strip redundant 'Bearer ' or 'bearer ' if present
  if (k.toLowerCase().startsWith('bearer ')) {
    k = k.slice(7).trim();
  }
  return k;
}

export function normalizeChatEndpoint(url: string): string {
  if (!url) return EP.nvidia;
  let u = url.trim().replace(/\/+$/, '');
  if (u.endsWith('/chat/completions')) {
    return u;
  }
  return `${u}/chat/completions`;
}

export const DEFAULT_SYS = `You are GBackgroundAI, an expert AI assistant specialized in programming, data analysis, and technical problem-solving. 

Core behaviors:
- Always provide complete, working, production-ready code.
- For HTML/CSS/JS: write self-contained files that work immediately.
- Support both Arabic and English seamlessly.
- When writing code, include all required logic, types, and styling.
- For complex tasks, break them down methodically.`;

export const MODELS: Record<string, ModelConfig> = {
  // Google Gemini Official Models
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 1048576,
    cat: 'fast',
    desc: 'Google Gemini 2.5 Flash • 1M Context • Ultra Fast & Versatile',
    speed: 10,
    power: 9,
    supportsVision: true,
    supportsTools: true
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 2097152,
    cat: 'think',
    desc: 'Google Gemini 2.5 Pro • SOTA Multimodal Reasoning & Complex Coding',
    speed: 8,
    power: 10,
    supportsVision: true,
    supportsTools: true
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 1048576,
    cat: 'fast',
    desc: 'Next-gen real-time Gemini model with 1M context',
    speed: 10,
    power: 8,
    supportsVision: true,
    supportsTools: true
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 1048576,
    cat: 'general',
    desc: 'High precision 1M token context reasoning model',
    speed: 7,
    power: 9,
    supportsVision: true,
    supportsTools: true
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 1048576,
    cat: 'fast',
    desc: 'Lightweight fast response Gemini model',
    speed: 9,
    power: 8,
    supportsVision: true,
    supportsTools: true
  },

  // OpenAI
  'gpt-4o': {
    name: 'GPT-4o',
    pv: 'custom',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'general',
    desc: 'OpenAI Omni flagship multimodal model',
    speed: 8,
    power: 10,
    supportsVision: true,
    supportsTools: true
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    pv: 'custom',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'fast',
    desc: 'Fast, efficient, affordable OpenAI model',
    speed: 9,
    power: 8,
    supportsVision: true,
    supportsTools: true
  },
  'o3-mini': {
    name: 'o3-mini',
    pv: 'custom',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'think',
    desc: 'OpenAI STEM reasoning model',
    speed: 7,
    power: 9,
    supportsThinking: true
  },

  // DeepSeek Official
  'deepseek-chat': {
    name: 'DeepSeek V3 (Chat)',
    pv: 'deepseek',
    t: 0.6,
    p: 0.95,
    mk: 64000,
    cat: 'code',
    desc: 'DeepSeek V3 Chat API • SOTA Open Weights',
    speed: 8,
    power: 9,
    supportsTools: true
  },
  'deepseek-reasoner': {
    name: 'DeepSeek R1 (Reasoner)',
    pv: 'deepseek',
    t: 0.6,
    p: 0.95,
    mk: 64000,
    cat: 'think',
    desc: 'DeepSeek R1 Reasoning engine with chain of thought',
    speed: 6,
    power: 10,
    supportsThinking: true
  },

  // Groq LPU
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'general',
    desc: 'Ultra-fast Llama 3.3 70B running on Groq LPUs',
    speed: 10,
    power: 9,
    supportsTools: true
  },
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'fast',
    desc: 'Instant latency Llama 3.1 8B on Groq',
    speed: 10,
    power: 7
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.9,
    mk: 32768,
    cat: 'general',
    desc: 'MoE 32K context with blazing Groq throughput',
    speed: 9,
    power: 7
  },

  // OpenRouter & Anthropic
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    pv: 'openrouter',
    t: 0.7,
    p: 0.95,
    mk: 200000,
    cat: 'code',
    desc: 'Industry leader in coding, reasoning and agentic tasks',
    speed: 8,
    power: 10,
    supportsVision: true,
    supportsTools: true
  },
  'meta-llama/llama-3.3-70b-instruct': {
    name: 'Llama 3.3 70B Instruct',
    pv: 'openrouter',
    t: 0.7,
    p: 0.95,
    mk: 128000,
    cat: 'general',
    desc: 'Open-weights flagship model across OpenRouter',
    speed: 8,
    power: 9,
    supportsTools: true
  },

  // Meta Model API (Official)
  'muse-spark-1.2': {
    name: 'Muse Spark 1.2',
    pv: 'meta',
    t: 1.0,
    p: 1.0,
    mk: 128000,
    cat: 'think',
    desc: 'Meta Model API • Advanced internal reasoning model with developer instructions',
    speed: 8,
    power: 10,
    supportsThinking: true,
    supportsTools: true
  },
  'muse-spark-1.1': {
    name: 'Muse Spark 1.1',
    pv: 'meta',
    t: 1.0,
    p: 1.0,
    mk: 128000,
    cat: 'think',
    desc: 'Meta Model API • High-speed reasoning model for chat and coding',
    speed: 9,
    power: 9,
    supportsThinking: true,
    supportsTools: true
  },

  // NVIDIA NIM
  'deepseek-ai/deepseek-v4-pro-0813': {
    name: 'DeepSeek V4 Pro (NVIDIA)',
    pv: 'nvidia',
    t: 1.0,
    p: 0.95,
    mk: 16384,
    cat: 'think',
    desc: 'DeepSeek V4 Pro high-performance flagship model via NVIDIA NIM',
    speed: 9,
    power: 10,
    supportsThinking: true,
    supportsTools: true
  },
  'deepseek-ai/deepseek-r1': {
    name: 'DeepSeek R1 (NVIDIA)',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 64000,
    cat: 'think',
    desc: 'DeepSeek R1 full reasoning model running on NVIDIA NIM microservices',
    speed: 7,
    power: 10,
    supportsThinking: true,
    supportsTools: true
  },
  'meta/llama-3.3-70b-instruct': {
    name: 'Llama 3.3 70B (NVIDIA)',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 128000,
    cat: 'general',
    desc: 'NVIDIA NIM enterprise microservice',
    speed: 8,
    power: 9,
    supportsTools: true
  },
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    name: 'Llama 3.1 Nemotron 70B',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 128000,
    cat: 'think',
    desc: 'NVIDIA custom tuned Nemotron 70B reasoning model',
    speed: 7,
    power: 9
  },

  // Ollama
  'llama3:latest': {
    name: 'Llama 3 (Ollama)',
    pv: 'ollama',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'general',
    desc: 'Local Ollama instance model',
    speed: 8,
    power: 7
  }
};

export const ROUTE_MAP: Record<string, string[]> = {
  code: ['gemini-2.5-pro', 'anthropic/claude-3.5-sonnet', 'deepseek-chat', 'gpt-4o'],
  think: ['gemini-2.5-pro', 'deepseek-reasoner', 'o3-mini', 'nvidia/llama-3.1-nemotron-70b-instruct'],
  fast: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gpt-4o-mini', 'llama-3.1-8b-instant'],
  write: ['gemini-2.5-flash', 'gpt-4o', 'meta-llama/llama-3.3-70b-instruct'],
  general: ['gemini-2.5-flash', 'gpt-4o', 'deepseek-chat']
};

export function detectTask(text: string): 'code' | 'think' | 'fast' | 'write' | 'general' {
  const t = text.toLowerCase();
  if (
    t.includes('```') ||
    /\b(function|class|def |const |let |var |import |async |code|write a? ?program|build|implement|create a? ?component|api|html|css|react|python|javascript|typescript)\b/.test(t)
  ) {
    return 'code';
  }
  if (
    /\b(why|how does|explain|analyze|compare|prove|reason|think step|deep analysis|mathematical|derive)\b/i.test(t) &&
    text.length > 100
  ) {
    return 'think';
  }
  if (text.length < 50) return 'fast';
  if (text.length > 220 || /\b(write an? article|blog|document|report|essay|story|narrative)\b/i.test(t)) {
    return 'write';
  }
  return 'general';
}

export function countTokens(text: string): number {
  return Math.ceil((text || '').length / 3.5);
}

export function parseThink(text: string): { display: string; thinking: string } {
  let th = '';
  const re = /<think>([\s\S]*?)<\/think>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    th += m[1];
  }
  const d = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim();
  return { display: d, thinking: th.trim() };
}

export function normWire(m: ChatMessage): any {
  if (m.role === 'tool') {
    return {
      role: 'tool',
      tool_call_id: m.tool_call_id,
      content: String(m.content ?? '')
    };
  }
  if (m.role === 'assistant' && m.tool_calls) {
    return {
      role: 'assistant',
      content: m.content ?? null,
      tool_calls: m.tool_calls
    };
  }
  if (m.vi) {
    return {
      role: m.role,
      content: [
        { type: 'image_url', image_url: { url: m.vi } },
        ...(m.content ? [{ type: 'text', text: m.content }] : [{ type: 'text', text: 'Describe this image' }])
      ]
    };
  }
  return {
    role: m.role,
    content: m.content
  };
}

export function buildCtx(
  history: ChatMessage[],
  settings: AppSettings,
  projectFiles: ProjectFile[],
  modelId: string,
  forceFlat: boolean = false,
  generatedFiles: GeneratedFile[] = []
): any[] {
  const cfg = MODELS[modelId];
  let sys = settings.sys || DEFAULT_SYS;

  if (settings.agent && !forceFlat) {
    sys +=
      '\n\n🤖 AGENT MODE ACTIVE: You have powerful tools (web_search, fetch_url, run_python, exec_js, make_chart, create_file, math_eval, wiki_search, json_tool, regex_test, encode, hash_text, now, remember, recall, analyze_text). Use them PROACTIVELY — execute code for accurate math, search for fresh facts, save persistent memory. Always give a concise final answer after using tools.';
  }

  if (cfg) {
    sys += `\n\nModel: ${cfg.name} (${cfg.pv.toUpperCase()}). `;
    if (cfg.cat === 'code') sys += 'Excel at complete, working code. ';
    if (cfg.cat === 'think') sys += 'Deep logical reasoning and verification. ';
  }
  if (cfg?.sysPfx) sys = cfg.sysPfx + '\n' + sys;

  if (projectFiles.length) {
    sys += '\n\n📁 Project Files:\n';
    projectFiles.forEach(f => {
      sys += `\n[${f.name}]\n\`\`\`\n${f.content}\n\`\`\`\n`;
    });
  }

  // Include generated artifacts that aren't already listed in projectFiles
  const projectFileNames = new Set(projectFiles.map(pf => pf.name.toLowerCase()));
  const extraArtifacts = (generatedFiles || []).filter(gf => !projectFileNames.has(gf.name.toLowerCase()));
  if (extraArtifacts.length) {
    sys += '\n\n🎨 Created Artifacts / Workspace Files:\n';
    extraArtifacts.forEach(f => {
      sys += `\n[Artifact: ${f.name} (${f.language || 'code'})]\n\`\`\`${f.language || ''}\n${f.content}\n\`\`\`\n`;
    });
  }

  if (settings.agent && settings.agentMem && Object.keys(settings.agentMem).length) {
    sys += '\n\n💾 Your Persistent Memory:\n' + JSON.stringify(settings.agentMem, null, 2);
  }

  const msgs: any[] = [{ role: 'system', content: sys }];
  if (settings.summary) {
    msgs.push({ role: 'system', content: '📚 Earlier Summary:\n' + settings.summary });
  }

  // Group into atomic units: assistant + following tool results NEVER separated
  const units: ChatMessage[][] = [];
  let i = 0;
  while (i < history.length) {
    if (history[i].role === 'assistant' && Array.isArray(history[i].tool_calls)) {
      const group = [history[i]];
      i++;
      while (i < history.length && history[i].role === 'tool') {
        group.push(history[i]);
        i++;
      }
      units.push(group);
    } else {
      units.push([history[i]]);
      i++;
    }
  }

  const mSize = (m: ChatMessage) =>
    countTokens(typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? m.tool_calls ?? '')) +
    (m.vi ? 300 : 0);

  const budget = Math.min(cfg?.mk || 4096, 8000);
  let used = countTokens(sys) + (settings.summary ? countTokens(settings.summary) : 0);
  const picked: ChatMessage[][] = [];

  for (let u = units.length - 1; u >= 0; u--) {
    const unitCost = units[u].reduce((acc, m) => acc + mSize(m), 0);
    if (picked.length && used + unitCost > budget) break;
    picked.unshift(units[u]);
    used += unitCost;
  }

  // If not agent mode or force flat pass (fallback)
  if (!settings.agent || forceFlat) {
    const clean: any[] = [];
    for (const unit of picked) {
      const first = unit[0];
      if (first.role === 'assistant' && Array.isArray(first.tool_calls)) {
        const names = first.tool_calls.map(t => t.function?.name || '?').join(', ');
        const results = unit
          .slice(1)
          .map(t => String(t.content ?? ''))
          .join('\n');
        clean.push({
          role: 'assistant',
          content: `${first.content || ''}\n[Used Tools: ${names}]\n[Results]:\n${results}`.slice(0, 5000)
        });
        continue;
      }
      unit.forEach(m => {
        if (m.role !== 'tool') clean.push(normWire(m));
      });
    }
    return msgs.concat(clean);
  }

  return msgs.concat(picked.flat().map(normWire));
}

export async function fetchRetry(
  url: string,
  opts: RequestInit = {},
  { timeout = 60000, retries = 2, backoff = 1500 } = {}
): Promise<Response> {
  let lastError: any;
  for (let a = 0; a <= retries; a++) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();

    if (opts.signal) {
      if (opts.signal.aborted) {
        controller.abort();
      } else {
        opts.signal.addEventListener('abort', onAbort, { once: true });
      }
    }

    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      if (opts.signal) {
        opts.signal.removeEventListener('abort', onAbort);
      }

      if ((res.status === 429 || res.status === 503) && a < retries) {
        try {
          if (res.body) await res.body.cancel();
        } catch {}
        await new Promise(r => setTimeout(r, backoff * Math.pow(2, a)));
        continue;
      }
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (opts.signal) {
        opts.signal.removeEventListener('abort', onAbort);
      }
      lastError = err;
      if (a < retries && err.name !== 'AbortError') {
        await new Promise(r => setTimeout(r, backoff * Math.pow(2, a)));
      }
    }
  }
  throw lastError;
}
