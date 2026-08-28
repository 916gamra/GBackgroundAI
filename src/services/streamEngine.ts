export type StreamEventType = 
  | 'message_start'
  | 'thinking_delta'
  | 'content_delta'
  | 'tool_start'
  | 'tool_result'
  | 'usage'
  | 'message_end'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  text?: string;
  toolCall?: any;
  toolCallId?: string;
  result?: any;
  usage?: any;
  finishReason?: string;
  message?: string;
}

export interface ChatRequestPayload {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: any[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools?: any[];
  signal?: AbortSignal;
}

export async function* unifiedChatStream(request: ChatRequestPayload): AsyncGenerator<StreamEvent, void, unknown> {
  const { endpoint, apiKey, model, messages, temperature, maxTokens, topP, tools, signal } = request;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const isMeta = endpoint.includes('api.meta.ai') || model.toLowerCase().includes('muse-spark');

  // Format messages: for Meta Model API, convert 'system' to 'developer' role for maximum instruction precedence
  const formattedMessages = (messages || []).map(m => {
    if (isMeta && m.role === 'system') {
      return { ...m, role: 'developer' };
    }
    return m;
  });

  const body: Record<string, any> = {
    model,
    messages: formattedMessages,
    temperature: isMeta ? (temperature ?? 1.0) : (temperature ?? 0.7),
    top_p: isMeta ? (topP ?? 1.0) : (topP ?? 1),
    max_tokens: maxTokens ?? 4096,
    stream: true,
    tools,
    tool_choice: tools?.length ? 'auto' : undefined
  };

  // Support NVIDIA DeepSeek chat template parameters
  if (endpoint.includes('nvidia.com') && model.includes('deepseek')) {
    body.chat_template_kwargs = { thinking: true };
  }

  if (isMeta) {
    body.max_completion_tokens = maxTokens ?? 4096;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const errText = await res.text();
      // Providers wrap real reasons in JSON ("error": {"message": ...}); surfacing the
      // raw body forced users to read a JSON blob inside a chat bubble.
      let reason = errText.trim();
      try {
        const parsed = JSON.parse(errText);
        reason =
          parsed?.error?.message ||
          parsed?.message ||
          parsed?.detail ||
          (Array.isArray(parsed?.errors) ? parsed.errors.map((e: any) => e?.message || JSON.stringify(e)).join('; ') : '') ||
          reason;
      } catch {}
      const hint =
        res.status === 401 || res.status === 403
          ? ' — the API key was rejected. Re-verify it in Settings → Providers.'
          : res.status === 429
          ? ' — rate limit / quota exhausted for this key. Retry in a moment or switch model.'
          : res.status === 404
          ? ' — endpoint or model id not found. Check the base URL and the model id.'
          : res.status >= 500
          ? ' — provider outage, the app already retried twice.'
          : '';
      yield { type: 'error', message: `[HTTP ${res.status}] ${String(reason).slice(0, 600)}${hint}` };
      return;
    }

    yield { type: 'message_start' };

    // Some gateways (Ollama, OpenRouter-compatible shims, local proxies) ignore
    // `stream: true` and answer with a plain JSON body. Without this branch the
    // user saw a completely empty reply.
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('event-stream')) {
      try {
        const json: any = await res.json();
        const choice = json?.choices?.[0];
        const text = choice?.message?.content ?? json?.content ?? '';
        const reasoning = choice?.message?.reasoning_content || choice?.message?.reasoning || '';
        if (reasoning) yield { type: 'thinking_delta', text: String(reasoning) };
        if (text) yield { type: 'content_delta', text: String(text) };
        if (json?.usage) yield { type: 'usage', usage: json.usage };
        if (choice?.message?.tool_calls?.length) {
          yield { type: 'tool_start', toolCall: choice.message.tool_calls };
        }
        yield { type: 'message_end', finishReason: choice?.finish_reason || 'stop' };
      } catch (e: any) {
        yield { type: 'error', message: `Provider returned a non-stream response the app could not parse (${e?.message || 'unknown'}).` };
      }
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      yield { type: 'error', message: 'ReadableStream not supported by response body' };
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedToolCalls: any[] = [];
    let finalFinishReason = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        
        if (trimmed === 'data: [DONE]') {
          if (accumulatedToolCalls.length > 0) {
             yield { type: 'tool_start', toolCall: accumulatedToolCalls };
          }
          yield { type: 'message_end', finishReason: finalFinishReason || 'stop' };
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.substring(6));
            const delta = data.choices?.[0]?.delta;
            
            if (!delta) continue;

            // Handle Reasoning/Thinking
            const reasoning = delta.reasoning_content || delta.reasoning || delta.thinking;
            if (reasoning) {
              yield { type: 'thinking_delta', text: reasoning };
            }

            // Handle Standard Content
            if (delta.content) {
              yield { type: 'content_delta', text: delta.content };
            }

            // Handle Tool Calls (accumulation)
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                 const idx = tc.index;
                 if (!accumulatedToolCalls[idx]) {
                    accumulatedToolCalls[idx] = { 
                      id: tc.id, 
                      type: 'function', 
                      function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' } 
                    };
                 } else {
                    if (tc.function?.arguments) {
                       accumulatedToolCalls[idx].function.arguments += tc.function.arguments;
                    }
                 }
              }
            }

            if (data.choices?.[0]?.finish_reason) {
              finalFinishReason = data.choices[0].finish_reason;
              if (accumulatedToolCalls.length > 0) {
                 // Clean up nulls just in case indices were skipped (rare)
                 accumulatedToolCalls = accumulatedToolCalls.filter(Boolean);
                 yield { type: 'tool_start', toolCall: accumulatedToolCalls };
                 accumulatedToolCalls = []; // clear so we don't yield again
              }
              yield { type: 'message_end', finishReason: finalFinishReason };
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
    
    // Flush remaining buffer
    if (buffer.trim().startsWith('data: ')) {
       try {
          const data = JSON.parse(buffer.trim().substring(6));
          if (data.choices?.[0]?.delta?.content) {
             yield { type: 'content_delta', text: data.choices[0].delta.content };
          }
          if (accumulatedToolCalls.length > 0) {
             yield { type: 'tool_start', toolCall: accumulatedToolCalls.filter(Boolean) };
          }
       } catch(e) {}
    }

  } catch (err: any) {
    if (err?.name === 'AbortError') {
      yield { type: 'message_end', finishReason: 'abort' };
    } else if (err?.name === 'TypeError') {
      yield {
        type: 'error',
        message:
          `Network request failed (${err.message}). In a browser this is usually CORS or the device being offline — ` +
          `the provider must allow this origin, or route the call through the bundled FastAPI proxy (backend/).`
      };
    } else {
      yield { type: 'error', message: err?.message || 'Unknown network error' };
    }
  }
}
