import { StreamEvent, ChatRequestPayload } from '../streamEngine';

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsReasoning: boolean;
  category: 'fast' | 'code' | 'think' | 'vision' | 'general';
  source: 'remote' | 'manual' | 'ollama';
  speed?: number;
  power?: number;
  description?: string;
}

export interface ProviderHealth {
  status: 'connected' | 'error' | 'untested';
  latency?: number;
  message?: string;
  modelCount?: number;
}

export interface AIProviderAdapter {
  id: string; // 'openai-compatible', 'gemini', 'ollama'
  name: string;
  
  // Test connection and measure latency
  validate(apiKey: string, endpoint: string): Promise<ProviderHealth>;
  
  // Fetch available models from the provider dynamically
  listModels(apiKey: string, endpoint: string): Promise<ModelInfo[]>;
  
  // Stream a chat request (uses the normalized StreamEngine events)
  streamChat(request: ChatRequestPayload): AsyncGenerator<StreamEvent, void, unknown>;
}
