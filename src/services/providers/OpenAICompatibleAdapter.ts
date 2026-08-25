import { AIProviderAdapter, ModelInfo, ProviderHealth } from './types';
import { unifiedChatStream, ChatRequestPayload, StreamEvent } from '../streamEngine';

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  id = 'openai-compatible';
  name = 'OpenAI Compatible (NVIDIA, Groq, OpenRouter, DeepSeek)';

  async validate(apiKey: string, endpoint: string): Promise<ProviderHealth> {
    const start = performance.now();
    try {
      const normalizedEndpoint = this.normalizeBaseUrl(endpoint);
      const res = await fetch(`${normalizedEndpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const latency = Math.round(performance.now() - start);

      if (!res.ok) {
        let msg = await res.text();
        try {
           const parsed = JSON.parse(msg);
           msg = parsed.error?.message || msg;
        } catch {}
        return { status: 'error', message: `[HTTP ${res.status}] ${msg}` };
      }

      const data = await res.json();
      const models = data.data || [];

      return { 
        status: 'connected', 
        latency,
        message: 'Connection successful',
        modelCount: models.length
      };
    } catch (err: any) {
      return { status: 'error', message: err.message || 'Network error' };
    }
  }

  async listModels(apiKey: string, endpoint: string): Promise<ModelInfo[]> {
    try {
      const normalizedEndpoint = this.normalizeBaseUrl(endpoint);
      const res = await fetch(`${normalizedEndpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) return this.getDefaultModels();
      
      const data = await res.json();
      const list = (data.data || []).map((m: any): ModelInfo => ({
        id: m.id,
        name: m.id,
        providerId: this.id,
        contextWindow: 8192,
        supportsVision: m.id.toLowerCase().includes('vision'),
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: m.id.toLowerCase().includes('deepseek-r1') || m.id.toLowerCase().includes('nemotron') || m.id.toLowerCase().includes('think'),
        category: this.categorizeModel(m.id),
        source: 'remote',
        description: `Dynamically fetched from ${endpoint}`
      }));
      return list.length > 0 ? list : this.getDefaultModels();
    } catch (err) {
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        name: 'Llama 3.1 Nemotron 70B Instruct',
        providerId: this.id,
        contextWindow: 131072,
        supportsVision: false,
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: true,
        category: 'think',
        source: 'remote',
        description: 'Default high-performance reasoning model'
      },
      {
        id: 'deepseek-ai/deepseek-r1',
        name: 'DeepSeek R1',
        providerId: this.id,
        contextWindow: 64000,
        supportsVision: false,
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: true,
        category: 'think',
        source: 'remote',
        description: 'Advanced reasoning model'
      },
      {
        id: 'meta/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        providerId: this.id,
        contextWindow: 128000,
        supportsVision: false,
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: false,
        category: 'general',
        source: 'remote',
        description: 'State of the art open model'
      }
    ];
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
    if (lower.includes('r1') || lower.includes('nemotron') || lower.includes('think') || lower.includes('reason')) return 'think';
    if (lower.includes('flash') || lower.includes('nano') || lower.includes('8b') || lower.includes('mini')) return 'fast';
    return 'general';
  }
}
