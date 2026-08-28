/**
 * Rolling conversation summary.
 *
 * Settings exposed `autoSum`, `sumThreshold` and `sumKeep` in the UI since v13,
 * and `AppSettings.summary` was read by `buildCtx()` — but nothing ever produced
 * a summary, so long chats simply lost their oldest turns to the token budget and
 * the "Auto-summarize" toggle was a no-op switch.
 *
 * This module implements it for real: after a reply lands, if the session is
 * longer than the threshold, older turns are compressed into a structured digest
 * that `buildCtx()` injects as a system message. It is deliberately
 * non-destructive — the user's history in the UI is never truncated.
 */
import { ChatMessage } from '../types';
import type { AIProviderAdapter } from './providers/types';

export interface SummarizeRequest {
  adapter: AIProviderAdapter;
  endpoint: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

const SUMMARY_INSTRUCTION = `You compress chat history into a handoff digest for the next turn.
Output ONLY these sections, terse bullet points, no preamble:
## Goals
## Decisions & constraints
## Files / code touched
## Open questions
## User facts (preferences, environment)
Keep under 220 words. Preserve exact identifiers, file names and numbers.`;

/** Ask the model for a digest of `messages`. Returns '' when nothing usable came back. */
export async function generateSummary(
  messages: ChatMessage[],
  req: SummarizeRequest
): Promise<string> {
  if (!messages.length) return '';

  const transcript = messages
    .map(m => {
      if (m.role === 'user') return `USER: ${m.content ?? ''}`;
      if (m.role === 'assistant') {
        const tools = m.tool_calls?.map(t => t.function?.name).filter(Boolean).join(', ');
        return `ASSISTANT${tools ? ` [used: ${tools}]` : ''}: ${m.content ?? ''}`;
      }
      return null;
    })
    .filter(Boolean)
    // Bound the payload so summarizing a huge session cannot itself blow the budget.
    .join('\n\n')
    .slice(-14000);

  if (!transcript.trim()) return '';

  let out = '';
  try {
    for await (const ev of req.adapter.streamChat({
      endpoint: req.endpoint,
      apiKey: req.apiKey,
      model: req.model,
      messages: [
        { role: 'system', content: SUMMARY_INSTRUCTION },
        { role: 'user', content: transcript }
      ],
      // Deterministic: a summary should not be creative.
      temperature: 0.2,
      maxTokens: Math.min(req.maxTokens || 700, 1200),
      signal: req.signal
    })) {
      if (ev.type === 'content_delta') out += ev.text || '';
      if (ev.type === 'error') break;
    }
  } catch {
    return '';
  }
  return out.trim().slice(0, 4000);
}

/** Heuristic digest used when no provider call is possible (offline / agent busy). */
export function buildLocalDigest(messages: ChatMessage[]): string {
  const goals: string[] = [];
  const files = new Set<string>();
  const tools = new Set<string>();

  for (const m of messages) {
    if (m.role === 'user' && m.content && goals.length < 6) {
      goals.push(`- ${String(m.content).replace(/\s+/g, ' ').slice(0, 160)}`);
    }
    if (m.role === 'assistant' && m.content) {
      for (const fm of String(m.content).matchAll(/(?:^|\n)\s*(?:\/\/|#|<!--)\s*(?:filename|file):\s*([\w./-]+)/g)) {
        files.add(fm[1]);
      }
      for (const fence of String(m.content).matchAll(/```(\w+)/g)) files.add(`(${fence[1]} block)`);
    }
    m.tool_calls?.forEach(tc => tc.function?.name && tools.add(tc.function.name));
  }

  const parts = [`## Goals\n${goals.join('\n') || '- (none captured)'}`];
  if (files.size) parts.push(`## Files / code touched\n- ${[...files].slice(0, 12).join('\n- ')}`);
  if (tools.size) parts.push(`## Tools used\n- ${[...tools].slice(0, 10).join(', ')}`);
  parts.push('## Open questions\n- (none recorded)');
  return parts.join('\n');
}
