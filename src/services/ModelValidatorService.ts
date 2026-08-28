import Dexie, { type Table } from 'dexie';
import { ModelHealth, ProviderConfig } from '../types/ProviderHealthTypes';
import { getAdapterForProvider } from './providers';

class HealthDB extends Dexie {
  modelHealth!: Table<ModelHealth>;
  constructor() {
    super('BeastHealthDB');
    this.version(1).stores({
      modelHealth: 'id, provider, status, lastChecked'
    });
  }
}

let dbInstance: HealthDB | null = null;
function getDB(): HealthDB {
  if (!dbInstance) {
    dbInstance = new HealthDB();
  }
  return dbInstance;
}

const TTL_MS = 10 * 60 * 1000; // 10 min
const PING_PROMPT = "ping";
const TIMEOUT_MS = 8000;
const CONCURRENCY = 5;

export function getProviderCandidateUrls(provider: ProviderConfig): string[] {
  if (provider.baseUrls && provider.baseUrls.length > 0) {
    return provider.baseUrls;
  }

  const id = (provider.id || '').toLowerCase();
  const label = (provider.label || '').toLowerCase();

  if (id.includes('google') || id.includes('gemini') || label.includes('google') || label.includes('gemini')) {
    return ['https://generativelanguage.googleapis.com/v1beta/openai', 'https://generativelanguage.googleapis.com/v1beta'];
  }
  if (id.includes('groq') || label.includes('groq')) {
    return ['https://api.groq.com/openai/v1'];
  }
  if (id.includes('openrouter') || label.includes('openrouter')) {
    return ['https://openrouter.ai/api/v1'];
  }
  if (id.includes('deepseek') || label.includes('deepseek')) {
    return ['https://api.deepseek.com/v1', 'https://api.deepseek.com'];
  }
  if (id.includes('ollama') || label.includes('ollama')) {
    return ['http://localhost:11434/v1'];
  }
  if (id.includes('meta') || label.includes('meta') || id.includes('muse')) {
    return ['https://api.meta.ai/v1'];
  }
  if (id.includes('nvidia') || label.includes('nvidia') || id === 'nv-builtin') {
    return ['https://integrate.api.nvidia.com/v1', 'https://api.nvidia.com/v1'];
  }

  return ['https://integrate.api.nvidia.com/v1', 'https://api.nvidia.com/v1'];
}

export async function validateSingleModel(
  provider: ProviderConfig,
  modelId: string,
  signal?: AbortSignal
): Promise<ModelHealth> {
  const start = performance.now();
  const db = getDB();

  // Handle Google Gemini ping
  const isGoogle = provider.id.toLowerCase().includes('google') || provider.id.toLowerCase().includes('gemini');
  if (isGoogle && provider.apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: PING_PROMPT }],
          max_tokens: 5,
          temperature: 0
        }),
        signal: combinedSignal
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const result: ModelHealth = {
          id: modelId,
          provider: provider.id,
          status: 'alive',
          latencyMs,
          lastChecked: Date.now(),
          isDeprecated: false,
          baseUrlUsed: 'https://generativelanguage.googleapis.com'
        };
        try { await db.modelHealth.put(result); } catch {}
        return result;
      }
    } catch {}
  }

  const baseUrls = getProviderCandidateUrls(provider);

  // Try candidate baseUrls for general providers
  for (const baseUrl of baseUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (provider.apiKey && provider.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${provider.apiKey.trim()}`;
      }

      const res = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: PING_PROMPT }],
          max_tokens: 5,
          temperature: 0
        }),
        signal: combinedSignal
      });
      
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const result: ModelHealth = {
          id: modelId,
          provider: provider.id,
          status: 'alive',
          latencyMs,
          lastChecked: Date.now(),
          isDeprecated: false,
          baseUrlUsed: cleanUrl
        };
        try { await db.modelHealth.put(result); } catch {}
        return result;
      }

      const errorText = await res.text();
      const status = res.status;

      if (status === 429) {
        const result: ModelHealth = {
          id: modelId,
          provider: provider.id,
          status: 'rate_limited',
          latencyMs,
          errorCode: '429',
          lastChecked: Date.now(),
          isDeprecated: false
        };
        try { await db.modelHealth.put(result); } catch {}
        return result;
      }
      if (status === 404 || errorText.includes('model_not_found') || errorText.includes('invalid_model')) {
        continue;
      }
      if (status === 403) {
        const result: ModelHealth = {
          id: modelId,
          provider: provider.id,
          status: 'dead',
          latencyMs,
          errorCode: '403_scope',
          lastChecked: Date.now(),
          isDeprecated: true
        };
        try { await db.modelHealth.put(result); } catch {}
        return result;
      }

    } catch (e: any) {
      if (e.name === 'AbortError') {
        const result: ModelHealth = {
          id: modelId,
          provider: provider.id,
          status: 'dead',
          latencyMs: TIMEOUT_MS,
          errorCode: 'timeout',
          lastChecked: Date.now(),
          isDeprecated: false
        };
        try { await db.modelHealth.put(result); } catch {}
        return result;
      }
      continue;
    }
  }

  // All baseUrls failed
  const finalResult: ModelHealth = {
    id: modelId,
    provider: provider.id,
    status: 'dead',
    latencyMs: Math.round(performance.now() - start),
    errorCode: '404_not_found',
    lastChecked: Date.now(),
    isDeprecated: true
  };
  try { await db.modelHealth.put(finalResult); } catch {}
  return finalResult;
}

export async function fetchModelsWithValidation(provider: ProviderConfig) {
  const db = getDB();

  // 1. Fetch live models using specific provider adapter
  let rawModels: string[] = [];
  try {
    const adapter = getAdapterForProvider(provider.id);
    const candidateUrls = getProviderCandidateUrls(provider);
    const modelInfos = await adapter.listModels(provider.apiKey || '', candidateUrls[0] || '');
    rawModels = modelInfos.map(m => m.id);
  } catch {}

  // 2. Check cache in Dexie
  let cached: ModelHealth[] = [];
  try {
    cached = await db.modelHealth.where('provider').equals(provider.id).toArray();
  } catch {}
  
  const now = Date.now();
  const aliveFromCache = new Map(cached.filter(c => now - c.lastChecked < TTL_MS).map(c => [c.id, c]));

  // 3. Validate missing/expired
  const toCheck = rawModels.filter(id => !aliveFromCache.has(id));
  const validated = await validateInBatches(provider, toCheck);

  // 4. Persist
  try {
    await db.modelHealth.bulkPut([...aliveFromCache.values(), ...validated]);
  } catch {}

  // 5. Filter
  const all = [...aliveFromCache.values(), ...validated];
  return {
    all,
    alive: all.filter(m => m.status === 'alive' || m.status === 'unknown'),
    dead: all.filter(m => m.status === 'dead')
  };
}

async function validateInBatches(provider: ProviderConfig, ids: string[]) {
  const results: ModelHealth[] = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(id => validateSingleModel(provider, id)));
    results.push(...batchResults);
  }
  return results;
}
