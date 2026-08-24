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

  const body = {
    model,
    messages,
    temperature: temperature ?? 0.7,
    top_p: topP ?? 1,
    max_tokens: maxTokens ?? 4096,
    stream: true,
    tools,
    tool_choice: tools?.length ? 'auto' : undefined
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const errText = await res.text();
      yield { type: 'error', message: `[HTTP ${res.status}] ${errText}` };
      return;
    }

    yield { type: 'message_start' };

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
    if (err.name === 'AbortError') {
      yield { type: 'message_end', finishReason: 'abort' };
    } else {
      yield { type: 'error', message: err.message || 'Unknown network error' };
    }
  }
}
