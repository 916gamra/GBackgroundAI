import { ModelConfig, ChatMessage, AppSettings, Provider, ProjectFile, AgentStepEvent } from '../types';
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
  groq: 'https://api.groq.com/openai/v1/chat/completions'
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
  'qwen/qwen3-coder-480b-a35b-instruct': {
    name: 'Qwen3-Coder 480B',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 8192,
    cat: 'code',
    desc: 'Largest MoE coding model — top accuracy',
    speed: 4,
    power: 10
  },
  'qwen/qwen3-coder-30b-a3b-instruct': {
    name: 'Qwen3-Coder 30B',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 8192,
    cat: 'code',
    desc: 'Fast and responsive coding model',
    speed: 8,
    power: 7
  },
  'qwen/qwen3.5-397b-a17b': {
    name: 'Qwen3.5 397B',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 16384,
    ex: { chat_template_kwargs: { enable_thinking: true } },
    cat: 'think',
    desc: 'Thinking reasoning • 16K context',
    speed: 4,
    power: 9
  },
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': {
    name: 'Nemotron Super 49B',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 65536,
    sysPfx: '/think',
    cat: 'think',
    desc: '65K context • Deep logic /think',
    speed: 5,
    power: 8
  },
  'nvidia/nemotron-3-nano-30b-a3b': {
    name: 'Nemotron Nano 30B',
    pv: 'nvidia',
    t: 1,
    p: 1,
    mk: 16384,
    ex: { reasoning_budget: 16384, chat_template_kwargs: { enable_thinking: true } },
    cat: 'think',
    desc: 'Fast reasoning engine',
    speed: 7,
    power: 6
  },
  'deepseek-ai/deepseek-v4-flash-0731': {
    name: 'DeepSeek V4 Flash',
    pv: 'nvidia',
    t: 1,
    p: 0.95,
    mk: 16384,
    ex: { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } },
    cat: 'think',
    desc: 'DeepSeek V4 Flash on NVIDIA NIM • 16K reasoning',
    speed: 9,
    power: 10
  },
  'deepseek-ai/deepseek-r1': {
    name: 'DeepSeek R1',
    pv: 'nvidia',
    t: 0.6,
    p: 0.95,
    mk: 16384,
    ex: { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } },
    cat: 'think',
    desc: 'DeepSeek R1 reasoning on NVIDIA NIM',
    speed: 4,
    power: 10
  },
  'deepseek-ai/deepseek-v3.1-terminus': {
    name: 'DeepSeek Terminus',
    pv: 'nvidia',
    t: 0.2,
    p: 0.7,
    mk: 8192,
    ex: { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } },
    cat: 'think',
    desc: 'High precision and mathematical clarity',
    speed: 3,
    power: 10
  },
  'deepseek-ai/deepseek-v3.2': {
    name: 'DeepSeek V3.2',
    pv: 'nvidia',
    t: 1,
    p: 0.95,
    mk: 8192,
    ex: { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } },
    cat: 'think',
    desc: 'Mathematics and complex algorithms',
    speed: 4,
    power: 9
  },
  'moonshotai/kimi-k2.5': {
    name: 'Kimi K2.5',
    pv: 'nvidia',
    t: 1,
    p: 1,
    mk: 16384,
    ex: { chat_template_kwargs: { thinking: true } },
    cat: 'think',
    desc: 'Moonshot AI • 16K thinking window',
    speed: 4,
    power: 8
  },
  'z-ai/glm5': {
    name: 'GLM-5',
    pv: 'nvidia',
    t: 1,
    p: 1,
    mk: 16384,
    ex: { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } },
    cat: 'think',
    desc: 'Z-AI • 16K deep reasoning',
    speed: 5,
    power: 8
  },
  'z-ai/glm4.7': {
    name: 'GLM-4.7',
    pv: 'nvidia',
    t: 1,
    p: 1,
    mk: 16384,
    ex: { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } },
    cat: 'think',
    desc: 'Rapid GLM thinking variant',
    speed: 7,
    power: 7
  },
  'minimaxai/minimax-m3': {
    name: 'MiniMax M3',
    pv: 'nvidia',
    t: 1,
    p: 0.95,
    mk: 8192,
    cat: 'general',
    desc: 'MiniMax M3 model on NVIDIA NIM • 8K tokens',
    speed: 7,
    power: 9
  },
  'minimaxai/minimax-m2.1': {
    name: 'MiniMax M2.1',
    pv: 'nvidia',
    t: 1,
    p: 0.95,
    mk: 8192,
    cat: 'general',
    desc: 'Balanced chat and structured writing',
    speed: 6,
    power: 7
  },
  'openai/gpt-oss-120b': {
    name: 'GPT-OSS 120B (NVIDIA)',
    pv: 'nvidia',
    t: 0.7,
    p: 1,
    mk: 8192,
    cat: 'general',
    desc: 'Open-weight GPT architecture on NVIDIA NIM',
    speed: 5,
    power: 8
  },
  'openai/gpt-oss-20b': {
    name: 'GPT-OSS 20B (NVIDIA)',
    pv: 'nvidia',
    t: 1,
    p: 1,
    mk: 4096,
    cat: 'general',
    desc: 'NVIDIA NIM • Open-weight GPT 20B reasoning model',
    speed: 9,
    power: 7
  },
  'mistralai/mistral-large-3-675b-instruct-2512': {
    name: 'Mistral Large 3',
    pv: 'nvidia',
    t: 0.15,
    p: 1,
    mk: 2048,
    cat: 'general',
    desc: '675B flagship Mistral model',
    speed: 3,
    power: 9
  },
  'mistralai/mixtral-8x22b-instruct-v0.1': {
    name: 'Mixtral 8×22B',
    pv: 'nvidia',
    t: 0.5,
    p: 1,
    mk: 1024,
    cat: 'general',
    desc: 'MoE speed • 80+ human languages',
    speed: 8,
    power: 6
  },
  'google/gemma-3n-e2b-it': {
    name: 'Gemma 3N E2B',
    pv: 'nvidia',
    t: 0.2,
    p: 0.7,
    mk: 512,
    cat: 'general',
    desc: 'Lightweight and ultra quick response',
    speed: 10,
    power: 4
  },
  'groq/gpt-oss-120b': {
    name: 'GPT-OSS 120B (Groq)',
    pv: 'groq',
    mid: 'openai/gpt-oss-120b',
    t: 1,
    p: 1,
    mk: 8192,
    ex: { reasoning_effort: 'high' },
    cat: 'fast',
    desc: 'Groq LPU Engine • Ultra-fast inference',
    speed: 10,
    power: 8
  },
  'groq/gpt-oss-20b': {
    name: 'GPT-OSS 20B (Groq)',
    pv: 'groq',
    mid: 'openai/gpt-oss-20b',
    t: 1,
    p: 1,
    mk: 8192,
    ex: { reasoning_effort: 'high' },
    cat: 'fast',
    desc: 'Lightning-fast Groq LPU responses',
    speed: 10,
    power: 5
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'fast',
    desc: 'Google Next-Gen multimodal intelligence with 1M context',
    speed: 10,
    power: 9
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'think',
    desc: 'Google Flagship deep reasoning and complex coding model',
    speed: 6,
    power: 10
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'fast',
    desc: 'Real-time ultra low latency multimodal flash',
    speed: 10,
    power: 8
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'general',
    desc: 'Google 2M context window foundation model',
    speed: 7,
    power: 9
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    pv: 'google',
    t: 0.7,
    p: 0.95,
    mk: 8192,
    cat: 'fast',
    desc: 'Cost-efficient and fast lightweight Gemini',
    speed: 9,
    power: 7
  },
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.9,
    mk: 8192,
    cat: 'general',
    desc: 'Meta Llama 3.3 70B on Groq LPU Ultra-fast',
    speed: 10,
    power: 9
  },
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.9,
    mk: 8192,
    cat: 'fast',
    desc: 'Ultra instant 8B response on Groq',
    speed: 10,
    power: 6
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B (Groq)',
    pv: 'groq',
    t: 0.7,
    p: 0.9,
    mk: 8192,
    cat: 'general',
    desc: 'MoE 32K context with blazing Groq throughput',
    speed: 9,
    power: 7
  }
};

export const ROUTE_MAP: Record<string, string[]> = {
  code: ['qwen/qwen3-coder-480b-a35b-instruct', 'qwen/qwen3-coder-30b-a3b-instruct', 'deepseek-ai/deepseek-v3.2'],
  think: ['deepseek/deepseek-r1', 'deepseek-ai/deepseek-v3.1-terminus', 'qwen/qwen3.5-397b-a17b'],
  fast: ['groq/gpt-oss-20b', 'groq/gpt-oss-120b', 'google/gemma-3n-e2b-it'],
  write: ['nvidia/llama-3.3-nemotron-super-49b-v1.5', 'minimaxai/minimax-m2.1', 'openai/gpt-oss-120b'],
  general: ['qwen/qwen3-coder-480b-a35b-instruct', 'openai/gpt-oss-120b', 'minimaxai/minimax-m2.1']
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
  forceFlat: boolean = false
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
