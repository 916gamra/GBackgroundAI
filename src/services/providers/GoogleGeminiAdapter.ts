import { AIProviderAdapter, ModelInfo, ProviderHealth } from './types';
import { unifiedChatStream, ChatRequestPayload, StreamEvent } from '../streamEngine';

export class GoogleGeminiAdapter implements AIProviderAdapter {
  id = 'google';
  name = 'Google AI Gemini Official API';

  async validate(apiKey: string, _endpoint: string): Promise<ProviderHealth> {
    const start = performance.now();
    try {
      const cleanKey = apiKey.trim();
      if (!cleanKey) {
        return { status: 'error', message: 'API key is required for Google Gemini' };
      }

      // First test via Native Google API
      try {
        const resKey = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        if (resKey.ok) {
          const dataKey = await resKey.json();
          const modelsKey = dataKey.models || [];
          return {
            status: 'connected',
            latency: Math.round(performance.now() - start),
            message: 'Connection successful (Google Gemini Native API)',
            modelCount: modelsKey.length
          };
        }
      } catch {}

      // Second test via OpenAI-compatible endpoint
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/models`, {
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json'
        }
      });

      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        const models = data.data || [];
        return {
          status: 'connected',
          latency,
          message: 'Connection successful (Google OpenAI Compatible)',
          modelCount: models.length
        };
      }

      let msg = await res.text();
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.error?.message || msg;
      } catch {}
      return { status: 'error', message: `[HTTP ${res.status}] ${msg}` };
    } catch (err: any) {
      return { status: 'error', message: err.message || 'Network error connecting to Google Gemini' };
    }
  }

  async listModels(apiKey: string, _endpoint: string): Promise<ModelInfo[]> {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("API key is required to fetch Google Gemini models.");

    let lastError = 'Failed to fetch models from Google Gemini API.';

    // 1. Try Native Google API Endpoint (Best for CORS and key authentication)
    try {
      const resNative = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (resNative.ok) {
        const dataNative = await resNative.json();
        const rawListNative = dataNative.models || [];
        const filteredNative = rawListNative
          .map((m: any) => (m.name || '').replace(/^models\//, ''))
          .filter((id: string) => id && id.toLowerCase().includes('gemini') && !id.includes('embedding') && !id.includes('aqa') && !id.includes('imagen'))
          .map((id: string): ModelInfo => ({
            id,
            name: this.formatModelName(id),
            providerId: this.id,
            contextWindow: id.includes('1.5') || id.includes('2.5') || id.includes('2.0') ? 1048576 : 128000,
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: id.includes('pro') || id.includes('2.5'),
            category: id.includes('pro') ? 'think' : 'fast',
            source: 'remote',
            description: `Google Gemini official model (${id})`
          }));

        if (filteredNative.length > 0) return filteredNative;
      } else {
         lastError = `Native API Error [HTTP ${resNative.status}]: ${await resNative.text()}`;
      }
    } catch (e: any) {
         lastError = e.message === 'Failed to fetch' ? 'CORS error or network offline on Native API.' : (e.message || 'Network error');
    }

    // 2. Try OpenAI-compatible endpoint
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/models`, {
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const rawList = data.data || [];
        const filtered = rawList
          .map((m: any) => m.id)
          .filter((id: string) => id && !id.includes('embedding') && !id.includes('aqa') && !id.includes('imagen'))
          .map((id: string): ModelInfo => ({
            id,
            name: this.formatModelName(id),
            providerId: this.id,
            contextWindow: id.includes('1.5') || id.includes('2.5') ? 1048576 : 128000,
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: id.includes('pro') || id.includes('2.5'),
            category: id.includes('pro') ? 'think' : 'fast',
            source: 'remote',
            description: `Google Gemini official model (${id})`
          }));

        if (filtered.length > 0) return filtered;
      } else {
         lastError = `OpenAI Compatible API Error [HTTP ${res.status}]: ${await res.text()}`;
      }
    } catch (e: any) {
         lastError = e.message === 'Failed to fetch' ? 'CORS error or network offline on OpenAI Compatible API.' : (e.message || 'Network error');
    }

    throw new Error(`Failed to fetch models: ${lastError}`);
  }


  private formatModelName(id: string): string {
    const parts = id.split('/');
    const last = parts[parts.length - 1];
    return last
      .split('-')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  static readonly DEFAULT_CHAT_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  streamChat(request: ChatRequestPayload): AsyncGenerator<StreamEvent, void, unknown> {
    // Was hard-coded to Google's endpoint, so a custom base URL saved in
    // Settings (a corporate proxy, an AI Studio mirror, a different API version)
    // was silently ignored for Gemini while it worked for every other provider.
    const raw = (request.endpoint || '').trim();
    const endpoint = raw ? GoogleGeminiAdapter.toChatCompletions(raw) : GoogleGeminiAdapter.DEFAULT_CHAT_ENDPOINT;
    return unifiedChatStream({ ...request, endpoint });
  }

  private static toChatCompletions(url: string): string {
    let u = url.replace(/\/+$/, '');
    // Native-style Google base (…/v1beta) → use the OpenAI-compatible path under it.
    if (/generativelanguage\.googleapis\.com\/v1beta(\/openai)?$/.test(u)) {
      return `${u.endsWith('/openai') ? u : u + '/openai'}/chat/completions`;
    }
    if (u.endsWith('/chat/completions')) return u;
    return `${u}/chat/completions`;
  }
}
