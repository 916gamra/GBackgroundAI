import { AIProviderAdapter } from './types';
import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter';
import { GoogleGeminiAdapter } from './GoogleGeminiAdapter';

// Singleton instances of adapters
const googleAdapter = new GoogleGeminiAdapter();
const openaiAdapter = new OpenAICompatibleAdapter();

const adapters: Record<string, AIProviderAdapter> = {
  'openai-compatible': openaiAdapter,
  'google': googleAdapter,
  'gemini': googleAdapter,
  'nvidia': openaiAdapter,
  'groq': openaiAdapter,
  'openrouter': openaiAdapter,
  'deepseek': openaiAdapter,
  'ollama': openaiAdapter,
  'meta': openaiAdapter,
  'meta-ai': openaiAdapter,
  'muse': openaiAdapter
};

export function getAdapterForProvider(providerType: string = 'openai-compatible'): AIProviderAdapter {
  const type = (providerType || 'openai-compatible').toLowerCase();
  return adapters[type] || adapters['openai-compatible'];
}

export * from './types';
export * from './OpenAICompatibleAdapter';
export * from './GoogleGeminiAdapter';
