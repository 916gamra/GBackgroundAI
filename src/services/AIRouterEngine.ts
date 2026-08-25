import { UnifiedModel, RouterConfig } from '../types';

export class AIRouterEngine {
  private config: RouterConfig;

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /**
   * Fetches models from the multi-models endpoint and falls back or merges with the single URL model.
   */
  async fetchAvailableModels(): Promise<UnifiedModel[]> {
    const unifiedList: UnifiedModel[] = [];

    try {
      const response = await fetch(this.config.modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          data.data.forEach((model: any) => {
            unifiedList.push({
              id: model.id,
              name: model.id.split('/').pop() || model.id,
              provider: 'Nvidia / NIM',
              isSingleUrl: false,
            });
          });
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch multi-models list, falling back to direct single URL model:", error);
    }

    // Always include the fallback / single URL model for maximum reliability
    unifiedList.push({
      id: "nvidia/llama-3.1-nemotron-70b",
      name: "Llama 3.1 Nemotron (Direct URL)",
      provider: "Nvidia / NIM",
      isSingleUrl: true,
    });

    return unifiedList;
  }

  /**
   * Routes the chat message to the correct endpoint based on model configuration.
   */
  async sendChatMessage(model: UnifiedModel, messages: any[], temperature: number = 0.5) {
    const targetUrl = model.isSingleUrl && this.config.fallbackSingleUrl
      ? this.config.fallbackSingleUrl
      : `${this.config.modelsUrl}/chat/completions`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error in AIRouterEngine chat request to ${targetUrl}:`, error);
      throw error;
    }
  }
}
