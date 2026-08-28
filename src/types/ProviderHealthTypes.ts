export type ModelHealthStatus = 
  | 'checking'   // كيْتْشِيكْ دابا
  | 'alive'      // خدام - green dot
  | 'dead'       // ميت - red dot
  | 'rate_limited' // محدود - gray
  | 'unknown';   // باقي ما تشيكاش

export interface ModelHealth {
  id: string;              // e.g. "meta/llama-3.1-405b-instruct"
  provider: string;        // "nvidia" | "openrouter" | "groq"
  status: ModelHealthStatus;
  latencyMs?: number;      // e.g. 240
  errorCode?: string;      // "404" | "403_scope" | "429" | "timeout"
  lastChecked: number;     // Date.now()
  isDeprecated?: boolean;  // true if /v1/models returned old model
  baseUrlUsed?: string;    // which Nvidia endpoint worked
}

export interface ProviderConfig {
  id: string;
  label: string;
  baseUrls: string[]; 
  // Nvidia = 2 URLs:
  // ["https://integrate.api.nvidia.com/v1", "https://api.nvidia.com/v1"]
  apiKey: string;
  enabled?: boolean;
}

export type HealthFilter = 'all_alive' | 'include_dead';
