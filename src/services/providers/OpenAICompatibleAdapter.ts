import { AIProviderAdapter, ModelInfo, ProviderHealth } from './types';
import { unifiedChatStream, ChatRequestPayload, StreamEvent } from '../streamEngine';

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  id = 'openai-compatible';
  name = 'OpenAI Compatible (Meta AI, NVIDIA, Groq, OpenRouter, DeepSeek)';

  async validate(apiKey: string, endpoint: string): Promise<ProviderHealth> {
    const start = performance.now();
    try {
      const candidateUrls = this.getCandidateEndpoints(endpoint);
      let lastErr = 'Failed to connect';

      for (const base of candidateUrls) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (apiKey && apiKey.trim()) {
            headers['Authorization'] = `Bearer ${apiKey.trim()}`;
          }

          const res = await fetch(`${base}/models`, { headers });
          const latency = Math.round(performance.now() - start);

          if (res.ok) {
            const data = await res.json();
            const models = data.data || data.models || [];
            return {
              status: 'connected',
              latency,
              message: `Connected successfully via ${base}`,
              modelCount: models.length
            };
          } else {
            lastErr = `[HTTP ${res.status}] ${await res.text()}`;
          }
        } catch (e: any) {
          lastErr = e.message || 'Network error';
        }
      }

      return { status: 'error', message: lastErr };
    } catch (err: any) {
      return { status: 'error', message: err.message || 'Network error' };
    }
  }

  async listModels(apiKey: string, endpoint: string): Promise<ModelInfo[]> {
    let lastError = 'Failed to fetch models. Check your API key or network connection.';
    
    try {
      const candidateUrls = this.getCandidateEndpoints(endpoint);
      const cleanKey = (apiKey || '').trim();

      for (const base of candidateUrls) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (cleanKey) {
            headers['Authorization'] = `Bearer ${cleanKey}`;
          }

          const res = await fetch(`${base}/models`, { headers });

          if (res.ok) {
            const data = await res.json();
            const raw = data.data || data.models || [];

            if (Array.isArray(raw) && raw.length > 0) {
              const list = raw.map((m: any): ModelInfo => {
                const id = m.id || m.name || String(m);
                return {
                  id,
                  name: this.formatModelName(id),
                  providerId: this.id,
                  contextWindow: 128000,
                  supportsVision: id.toLowerCase().includes('vision') || id.toLowerCase().includes('vl'),
                  supportsTools: true,
                  supportsStreaming: true,
                  supportsReasoning: id.toLowerCase().includes('r1') || id.toLowerCase().includes('nemotron') || id.toLowerCase().includes('think') || id.toLowerCase().includes('reason'),
                  category: this.categorizeModel(id),
                  source: 'remote',
                  description: `Live fetched from ${base}`
                };
              });

              if (list.length > 0) return list;
            }
          } else {
            lastError = `[HTTP ${res.status}] ${await res.text()}`;
          }
        } catch (e: any) {
          // If it's a TypeError, it might be CORS
          lastError = e.message === 'Failed to fetch' ? 'CORS error or network offline.' : (e.message || 'Network error');
        }
      }

      throw new Error(`Failed to fetch models: ${lastError}`);
    } catch (err: any) {
      throw new Error(err.message || 'Unknown error while fetching models');
    }
  }

  private getCandidateEndpoints(endpoint?: string): string[] {
    if (!endpoint || !endpoint.trim()) {
      return [
        'https://integrate.api.nvidia.com/v1',
        'https://api.nvidia.com/v1',
        'https://api.groq.com/openai/v1',
        'https://openrouter.ai/api/v1',
        'https://api.deepseek.com/v1',
        'https://api.deepseek.com',
        'http://localhost:11434/v1'
      ];
    }

    const norm = this.normalizeBaseUrl(endpoint);
    const candidates = [norm];

    // If Nvidia endpoint, include both integrate and standard api
    if (norm.includes('nvidia.com')) {
      if (norm.includes('integrate.api.nvidia.com')) {
        candidates.push('https://api.nvidia.com/v1');
      } else if (norm.includes('api.nvidia.com')) {
        candidates.push('https://integrate.api.nvidia.com/v1');
      }
    }
    // If DeepSeek
    if (norm.includes('deepseek')) {
      if (!norm.endsWith('/v1')) candidates.push(`${norm}/v1`);
      candidates.push('https://api.deepseek.com/v1');
      candidates.push('https://api.deepseek.com');
    }
    // If Groq
    if (norm.includes('groq')) {
      candidates.push('https://api.groq.com/openai/v1');
    }
    // If OpenRouter
    if (norm.includes('openrouter')) {
      candidates.push('https://openrouter.ai/api/v1');
    }
    // If Meta AI / Model API
    if (norm.includes('meta.ai') || norm.includes('meta')) {
      candidates.push('https://api.meta.ai/v1');
    }

    return Array.from(new Set(candidates));
  }

  private formatModelName(id: string): string {
    if (!id) return 'Unknown Model';
    const parts = id.split('/');
    const last = parts[parts.length - 1];
    return last
      .split('-')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }


  streamChat(request: ChatRequestPayload): AsyncGenerator<StreamEvent, void, unknown> {
    // Inject the exact endpoint correctly. If they provide baseUrl, append /chat/completions
    const endpoint = this.normalizeChatEndpoint(request.endpoint);
    return unifiedChatStream({ ...request, endpoint });
  }

  private normalizeBaseUrl(url: string): string {
    let u = url.trim().replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) {
      return u.replace(/\/chat\/completions$/, '');
    }
    return u;
  }

  private normalizeChatEndpoint(url: string): string {
    let u = url.trim().replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) {
      return u;
    }
    return `${u}/chat/completions`;
  }

  private categorizeModel(id: string): 'fast' | 'code' | 'think' | 'vision' | 'general' {
    const lower = id.toLowerCase();
    if (lower.includes('vision')) return 'vision';
    if (lower.includes('coder') || lower.includes('code')) return 'code';
    if (lower.includes('r1') || lower.includes('nemotron') || lower.includes('think') || lower.includes('reason') || lower.includes('muse')) return 'think';
    if (lower.includes('flash') || lower.includes('nano') || lower.includes('8b') || lower.includes('mini')) return 'fast';
    return 'general';
  }
}
