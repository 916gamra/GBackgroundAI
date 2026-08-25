
import { StreamEvent, ChatRequestPayload } from '../streamEngine';
import { AIProviderAdapter } from '../providers/types';
import { detectTask } from '../aiService';

export interface TaskRoute {
  taskType: 'code' | 'think' | 'fast' | 'write' | 'general';
  requiresAgent: boolean;
  suggestedModelCategories: string[];
}

export interface AgentContext {
  history: any[];
  executeTool: (toolCall: any) => Promise<string>;
  adapter: AIProviderAdapter;
  requestTemplate: ChatRequestPayload;
  buildMessages?: (history: any[]) => any[];
  maxIterations?: number;
}

export class AgentOrchestrator {
  
  static classifyTask(prompt: string): TaskRoute {
    const taskType = detectTask(prompt);
    
    // Determine if we need agent tools (Smart Routing logic)
    const requiresAgent = 
      /search|fetch|run python|execute js|read file|create file|draw|chart|plot/i.test(prompt) && 
      !/how to|explain/i.test(prompt);

    const suggestedModelCategories = [];
    
    if (taskType === 'code') suggestedModelCategories.push('code', 'general');
    else if (taskType === 'think') suggestedModelCategories.push('think', 'general');
    else if (taskType === 'fast') suggestedModelCategories.push('fast', 'general');
    else suggestedModelCategories.push('general');

    return {
      taskType,
      requiresAgent,
      suggestedModelCategories
    };
  }

  static async *runAgentLoop(ctx: AgentContext): AsyncGenerator<StreamEvent, any[], unknown> {
    const MAX_ITERS = ctx.maxIterations || 8;
    let iteration = 0;
    let currentHistory = [...ctx.history];
    let requestPayload = { ...ctx.requestTemplate };
    
    while (iteration < MAX_ITERS) {
      iteration++;
      
      // Update payload history with system prompt & project context preserved
      if (ctx.buildMessages) {
        requestPayload.messages = ctx.buildMessages(currentHistory);
      } else {
        const sysMsgs = (ctx.requestTemplate.messages || []).filter((m: any) => m.role === 'system');
        requestPayload.messages = [...sysMsgs, ...currentHistory];
      }
      
      // In Agent loop, we generally need the model to NOT stream its tool calls for stability,
      // but since we want to unify, we will listen to events.
      
      let fullText = '';
      let fullThinking = '';
      let currentToolCalls: any[] = [];
      let finalFinishReason = '';

      for await (const event of ctx.adapter.streamChat(requestPayload)) {
        if (event.type === 'error') {
          yield event;
          return;
        }
        
        if (event.type === 'thinking_delta') {
           fullThinking += event.text;
           yield event;
        } else if (event.type === 'content_delta') {
           fullText += event.text;
           yield event;
        } else if (event.type === 'tool_start') {
           // Some adapters stream tools, some give them at once.
           if (Array.isArray(event.toolCall)) {
             currentToolCalls = event.toolCall;
           } else if (event.toolCall) {
             currentToolCalls.push(event.toolCall);
           }
        } else if (event.type === 'message_end') {
           finalFinishReason = event.finishReason || 'stop';
        }
      }

      // If no tool calls were made during the stream, we are done!
      if (!currentToolCalls || currentToolCalls.length === 0) {
         // The stream already yielded the content to the UI, so we just finish.
         yield { type: 'message_end', finishReason: finalFinishReason };
         
         // Push the final assistant message to the history
         currentHistory.push({
           role: 'assistant',
           content: fullText || '(No content generated)',
           think: fullThinking || null,
           ts: Date.now(),
           ag: true
         });
         
         return currentHistory;
      }

      // If we have tool calls, we need to execute them.
      // 1. Yield tool starts for the UI
      for (const tc of currentToolCalls) {
         yield { type: 'tool_start', toolCall: tc };
      }

      // 2. Add assistant's tool_call to history
      currentHistory.push({
        role: 'assistant',
        content: fullText || null,
        tool_calls: currentToolCalls
      });

      // 3. Execute tools in parallel
      const results = await Promise.all(currentToolCalls.map(tc => ctx.executeTool(tc)));

      // 4. Yield tool results and add to history
      for (let i = 0; i < results.length; i++) {
        const resStr = results[i];
        const tc = currentToolCalls[i];
        
        // Validator mechanism: If tool failed, we explicitly tell the LLM to repair it.
        const isError = typeof resStr === 'string' && resStr.startsWith('[Tool ') && resStr.includes('error:');
        const validationPrefix = isError 
           ? `[SYSTEM VALIDATOR: The tool failed. Analyze the error and repair your approach:]\n` 
           : '';

        const finalContent = validationPrefix + String(resStr).slice(0, 12000);
        
        currentHistory.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: finalContent
        });

        yield { type: 'tool_result', toolCallId: tc.id, result: finalContent };
      }
      
      // Loop continues... it will ask the LLM again with the new history.
    }
    
    // If it hit MAX_ITERS, yield an error
    yield { type: 'error', message: 'Agent reached maximum iterations without completing the task.' };
    return currentHistory;
  }
}
