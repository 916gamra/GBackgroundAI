import { AIProviderAdapter } from './types';
import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter';

// Singleton instances of adapters
const adapters: Record<string, AIProviderAdapter> = {
  'openai-compatible': new OpenAICompatibleAdapter(),
  // More can be added here later: 'gemini', 'ollama', etc.
};

export function getAdapterForProvider(providerType: string = 'openai-compatible'): AIProviderAdapter {
  return adapters[providerType] || adapters['openai-compatible'];
}

export * from './types';
export * from './OpenAICompatibleAdapter';
