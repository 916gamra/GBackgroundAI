/**
 * Zero-dependency logic tests.
 *
 * `npm test` bundles this file with esbuild (already a dev dependency) and runs
 * it in node, so CI does not need a browser, jsdom or a test framework. These
 * tests exist because the app ships real behaviour that used to be silently
 * broken (max_tokens=2M sent to providers, settings.ctx read nowhere, simulated
 * tools advertised to the model, aborted runs stacking side effects).
 */
import {
  resolveMaxOutputTokens,
  buildCtx,
  parseThink,
  normalizeChatEndpoint,
  sanitizeApiKey,
  detectTask,
  countTokens
} from '../src/services/aiService';
import {
  isToolEnabled,
  isToolSimulated,
  annotateToolResult,
  toolHasKey
} from '../src/services/toolPolicy';
import { getActiveAgentTools, AGENT_TOOLS } from '../src/services/agentTools';
import { unifiedChatStream } from '../src/services/streamEngine';
import { AgentOrchestrator } from '../src/services/orchestrator/AgentOrchestrator';
import { buildLocalDigest } from '../src/services/summarizeHistory';
import { syncWorkspace, getProjectFileContent, listProjectFilesMemory, setProjectFileContent } from '../src/services/projectMemory';

let passed = 0;
const failures: string[] = [];

const eq = (name: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a === b) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name}\n      got:  ${a}\n      want: ${b}`);
  }
};
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name + (detail ? ` (${detail})` : ''));
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
  }
};

const section = (title: string) => console.log(`\n${title}`);

// ─────────────────────────────────────────────────────────────────────────────
section('max output tokens (regression: cfg.mk is the CONTEXT WINDOW, not max_tokens)');
eq('Gemini 2.5 Pro clamps to 65536 instead of 2097152', resolveMaxOutputTokens('gemini-2.5-pro', ''), 65536);
eq('Groq clamps to 8192', resolveMaxOutputTokens('llama-3.3-70b-versatile', ''), 8192);
eq('NVIDIA clamps to 16384', resolveMaxOutputTokens('meta/llama-3.3-70b-instruct', ''), 16384);
eq('user override is respected', resolveMaxOutputTokens('gemini-2.5-flash', '2048'), 2048);
eq('absurd user override is clamped to provider cap', resolveMaxOutputTokens('llama-3.1-8b-instant', '999999'), 8192);
ok('unknown model id stays sane', resolveMaxOutputTokens('nope', '') >= 512 && resolveMaxOutputTokens('nope', '') <= 8192);
eq('custom models are honoured', resolveMaxOutputTokens('mine', '', {
  mine: { name: 'Mine', pv: 'groq', t: 0.7, p: 1, mk: 8192, cat: 'fast', desc: '', speed: 5, power: 5 }
} as never), 4096);

// ─────────────────────────────────────────────────────────────────────────────
section('key + endpoint hygiene');
eq('sanitizeApiKey strips Bearer', sanitizeApiKey('  Bearer nvapi-abc '), 'nvapi-abc');
eq('sanitizeApiKey strips quotes', sanitizeApiKey('"nvapi-abc"'), 'nvapi-abc');
eq('sanitizeApiKey tolerates undefined', sanitizeApiKey(undefined), '');
eq('normalizeChatEndpoint appends path', normalizeChatEndpoint('https://x.dev/v1'), 'https://x.dev/v1/chat/completions');
eq('normalizeChatEndpoint is idempotent', normalizeChatEndpoint('https://x.dev/v1/chat/completions'), 'https://x.dev/v1/chat/completions');

// ─────────────────────────────────────────────────────────────────────────────
section('reasoning tags');
eq('closed think block removed from display', parseThink('<think>a+b</think>answer').display, 'answer');
eq('unclosed think block hidden while streaming', parseThink('answer<think>draft').display, 'answer');
eq('reasoning accumulated', parseThink('<think>x</think><think>y</think>z').thinking, 'xy');

// ─────────────────────────────────────────────────────────────────────────────
section('tool trust policy');
ok('real tool defaults to enabled', isToolEnabled('web_search', undefined) === true);
ok('simulated tool defaults to disabled', isToolEnabled('device_hardware_overlord', undefined) === false);
ok('explicit disable wins', isToolEnabled('web_search', { web_search: false }) === false);
ok('explicit enable of a simulated tool wins', isToolEnabled('device_hardware_overlord', { device_hardware_overlord: true }) === true);
ok('simulated output carries a warning the model cannot miss',
  annotateToolResult('modbus_titan', 'x').startsWith('[SIMULATED DEMO TOOL'), annotateToolResult('modbus_titan', 'x').slice(0, 40));
eq('real output untouched', annotateToolResult('math_eval', 'x'), 'x');
ok('tool with a missing key is not advertised', toolHasKey('web_search', { serper: '' }) === false);
ok('tool with a key present is advertised', toolHasKey('web_search', { serper: 'k' }) === true);
ok('ungated tools always advertised', toolHasKey('math_eval', {}) === true);

const noKeys = getActiveAgentTools(undefined, undefined, {});
ok('default tool payload is much smaller than the whole registry', noKeys.length < 40 && AGENT_TOOLS.length === 60, `${noKeys.length}/${AGENT_TOOLS.length}`);
ok('no simulated tool is advertised by default', !noKeys.some(t => isToolSimulated(t.function.name)));
ok('custom tools still pass through', getActiveAgentTools(undefined, [{ id: 'my_tool', name: 'My', description: 'd', parametersJson: '{}', enabled: true }], {}).some(t => t.function.name === 'my_tool'));

// ─────────────────────────────────────────────────────────────────────────────
section('buildCtx');
const settings: any = {
  mod: 'gemini-2.5-flash', sys: 'SYS', tmp: 0.7, ctx: 4, maxTok: '', agent: false, summary: '', agentMem: {}, tts: false
};
const hist: any = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `msg ${i}` }));
const wire = buildCtx(hist, settings, [], 'gemini-2.5-flash', false, []);
const nonSystem = wire.filter(m => m.role !== 'system');
eq('settings.ctx caps how many messages are carried back', nonSystem.length, 4);
eq('the newest turn is always kept', nonSystem[nonSystem.length - 1].content, 'msg 29');

const wireBig = buildCtx([], settings, [{ name: 'huge.ts', content: 'x'.repeat(500000), size: 500000 }], 'gemini-2.5-flash', false, []);
ok('a giant workspace file can no longer blow up the prompt', wireBig[0].content.length < 25000, `len=${wireBig[0].content.length}`);
ok('truncation is disclosed to the model', wireBig[0].content.includes('[truncated'));

const wireExtra = buildCtx([], settings, [], 'gemini-2.5-flash', false, [], { extraSystem: 'LIVE WEB: hello' });
ok('injected web-search context reaches the request', wireExtra.some(m => String(m.content).includes('LIVE WEB: hello')));

const wireCustom = buildCtx([], { ...settings, customModels: { mine: { name: 'Mine', pv: 'groq', t: 0.7, p: 1, mk: 128000, cat: 'fast', desc: '', speed: 9, power: 9 } } }, [], 'mine', false, []);
ok('custom/starred models get their provider hint', wireCustom[0].content.includes('Mine (GROQ)'));

const toolUnit: any = [
  { role: 'assistant', content: 'calling', tool_calls: [{ id: '1', type: 'function', function: { name: 'math_eval', arguments: '{}' } }] },
  { role: 'tool', tool_call_id: '1', content: 'Result: 4' }
];
const wireAgent = buildCtx(toolUnit, { ...settings, agent: true }, [], 'gemini-2.5-flash', false, []);
ok('agent mode keeps assistant+tool pairing intact',
  wireAgent[wireAgent.length - 2].tool_calls?.length === 1 && wireAgent[wireAgent.length - 1].role === 'tool');
const wireFlat = buildCtx(toolUnit, { ...settings, agent: false }, [], 'gemini-2.5-flash', false, []);
ok('non-agent mode flattens tool traffic into plain text',
  !wireFlat.some(m => m.role === 'tool') && String(wireFlat[wireFlat.length - 1].content).includes('math_eval'));

// ─────────────────────────────────────────────────────────────────────────────
section('SSE stream parser (mocked fetch)');

const sseResponse = (chunks: string[]) => ({
  ok: true,
  status: 200,
  headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
  body: {
    getReader: () => {
      let i = 0;
      const enc = new TextEncoder();
      return {
        read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true, value: undefined })
      };
    }
  }
});

const collect = async (res: unknown) => {
  const prevFetch = globalThis.fetch;
  globalThis.fetch = (async () => res) as never;
  const events: any[] = [];
  try {
    for await (const ev of unifiedChatStream({ endpoint: 'https://x.dev/v1/chat/completions', apiKey: 'k', model: 'm', messages: [] })) {
      events.push(ev);
    }
  } finally {
    globalThis.fetch = prevFetch as never;
  }
  return events;
};

const deltaEvents = await collect(sseResponse([
  `data: ${JSON.stringify({ choices: [{ delta: { content: 'Hel' } }] })}\n\n`,
  `data: ${JSON.stringify({ choices: [{ delta: { content: 'lo' } }] })}\n\n`,
  `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\n\n`,
  'data: [DONE]\n\n'
]));
eq('content deltas reassemble', deltaEvents.filter(e => e.type === 'content_delta').map(e => e.text).join(''), 'Hello');
ok('stream terminates with message_end', deltaEvents[deltaEvents.length - 1]?.type === 'message_end' || deltaEvents.some(e => e.type === 'message_end'));

// A chunk split across network boundaries must not corrupt or drop text.
const splitEvents = await collect(sseResponse([
  `data: ${JSON.stringify({ choices: [{ delta: { content: 'one' } }] })}\n\nda`,
  `ta: ${JSON.stringify({ choices: [{ delta: { content: 'two' } }] })}\n\ndata: [DONE]\n\n`
]));
eq('partial SSE lines are buffered, not lost', splitEvents.filter(e => e.type === 'content_delta').map(e => e.text).join(''), 'onetwo');

const toolEvents = await collect(sseResponse([
  `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'math_eval', arguments: '{"exp' } }] } }] })}\n\n`,
  `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ression": "1+1"}' } }] } }] })}\n\n`,
  `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'tool_calls' }] })}\n\n`
]));
const toolStart = toolEvents.find(e => e.type === 'tool_start');
eq('streamed tool_call arguments are accumulated', JSON.parse(toolStart?.toolCall?.[0]?.function?.arguments || '{}'), { expression: '1+1' });

const errEvents = await collect({
  ok: false,
  status: 401,
  text: async () => JSON.stringify({ error: { message: 'Invalid API key provided' } }),
  headers: { get: () => 'application/json' }
});
ok('401 surfaces the provider reason plus a hint',
  errEvents[0]?.type === 'error' && /Invalid API key/.test(errEvents[0].message) && /Settings/.test(errEvents[0].message), errEvents[0]?.message);

const jsonEvents = await collect({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content: 'plain answer' }, finish_reason: 'stop' }] }),
  text: async () => '',
  headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) }
});
eq('non-SSE JSON replies are still rendered (Ollama/proxy gateways)',
  jsonEvents.filter(e => e.type === 'content_delta').map(e => e.text).join(''), 'plain answer');

// ─────────────────────────────────────────────────────────────────────────────
section('agent loop');
const fakeAdapter = (turns: any[][]) => ({
  id: 'test',
  name: 'test',
  calls: 0,
  async validate() { return { status: 'connected' as const }; },
  async listModels() { return []; },
  async *streamChat() {
    const events = turns[Math.min(this.calls, turns.length - 1)] || [];
    this.calls++;
    for (const e of events) yield e;
  }
});

const toolCall = { id: 't1', type: 'function', function: { name: 'math_eval', arguments: '{"expression":"2+2"}' } };

/** Drain an async generator, returning { events, value }. */
const drain = async (gen: AsyncGenerator<any, any, unknown>) => {
  const events: any[] = [];
  let r = await gen.next();
  while (!r.done) {
    events.push(r.value);
    r = await gen.next();
  }
  return { events, value: r.value };
};
{
  const adapter = fakeAdapter([
    [{ type: 'tool_start', toolCall: [toolCall] }, { type: 'message_end', finishReason: 'tool_calls' }],
    [{ type: 'content_delta', text: 'The answer is 4' }, { type: 'message_end', finishReason: 'stop' }]
  ]);
  const executed: string[] = [];
  const ctx = {
    history: [{ role: 'user', content: 'what is 2+2' }] as never, // AgentContext.history
    executeTool: async (tc: any) => { executed.push(tc.function.name); return 'Result: 4'; },
    adapter: adapter as never,
    requestTemplate: { endpoint: 'e', apiKey: 'k', model: 'm', messages: [] as never },
    maxIterations: 4
  };
  const { value: out } = await drain(AgentOrchestrator.runAgentLoop(ctx));
  eq('tool was executed once', executed, ['math_eval']);
  eq('assistant tool_call is recorded before its result', out[1].role + ':' + out[2].role, 'assistant:tool');
  eq('tool result content is fed back to the model', out[2].content, 'Result: 4');
  eq('the tool message is linked to its call id', out[2].tool_call_id, 't1');
  eq('final assistant text is appended', out[3].content, 'The answer is 4');
  eq('no orphan tool message left after the answer', out.length, 4);
}
{
  // Stop pressed mid-loop -> no further model calls.
  const ctrl = new AbortController();
  const adapter = fakeAdapter([
    [{ type: 'tool_start', toolCall: [toolCall] }, { type: 'message_end', finishReason: 'tool_calls' }],
    [{ type: 'content_delta', text: 'SHOULD NOT HAPPEN' }]
  ]);
  const ctx = {
    history: [{ role: 'user', content: 'go' }] as never,
    executeTool: async () => { ctrl.abort(); return 'Result: 4'; },
    adapter: adapter as never,
    requestTemplate: { endpoint: 'e', apiKey: 'k', model: 'm', messages: [] as never, signal: ctrl.signal },
    maxIterations: 4
  };
  const { value: hist2 } = await drain(AgentOrchestrator.runAgentLoop(ctx));
  ok('aborting during a tool call stops the loop', adapter.calls === 1, `adapter called ${adapter.calls}x`);
  ok('no "SHOULD NOT HAPPEN" text after abort', !JSON.stringify(hist2).includes('SHOULD NOT HAPPEN'));
}
{
  // A model that keeps asking for tools forever must be cut off after maxIterations.
  const loopingAdapter = {
    id: 'test',
    name: 'test',
    calls: 0,
    async validate() { return { status: 'connected' as const }; },
    async listModels() { return []; },
    async *streamChat() {
      this.calls++;
      yield { type: 'tool_start', toolCall: [{ ...toolCall, id: `t${this.calls}` }] };
      yield { type: 'message_end', finishReason: 'tool_calls' };
    }
  };
  const ctx = {
    history: [{ role: 'user', content: 'loop forever' }] as never,
    executeTool: async () => 'ok',
    adapter: loopingAdapter as never,
    requestTemplate: { endpoint: 'e', apiKey: 'k', model: 'm', messages: [] as never },
    maxIterations: 3
  };
  const { events } = await drain(AgentOrchestrator.runAgentLoop(ctx));
  ok('a tool-calling loop is cut off with an explicit error, not an infinite spend',
    events.some(e => e?.type === 'error'));
  eq('the loop stops exactly at maxIterations', loopingAdapter.calls, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
section('offline summary + workspace memory');
const digest = buildLocalDigest([
  { role: 'user', content: 'fix the login bug in src/auth.ts' },
  { role: 'assistant', content: '```ts\n// filename: src/auth.ts\nexport const x = 1;\n```', tool_calls: [toolCall] }
] as never);
void 0;
ok('local digest captures goals', digest.includes('fix the login bug'));
ok('local digest lists the file touched', digest.includes('src/auth.ts'));
ok('local digest lists tools used', digest.includes('math_eval'));

syncWorkspace([{ name: 'src/demo.ts', content: 'export const a = 1;' }], 'workspace');
eq('workspace files are readable by the self-inspection tools', getProjectFileContent('src/demo.ts')?.lines, 1);
eq('path lookups tolerate a leading slash', !!getProjectFileContent('/src/demo.ts'), true);
setProjectFileContent('src/new.ts', 'line1\nline2');
eq('agent writes are visible to the lister', listProjectFilesMemory(undefined, 'ts').some(f => f.path === 'src/new.ts'), true);
syncWorkspace([], 'workspace');
ok('deleted workspace files stop being advertised', !listProjectFilesMemory().some(f => f.path === 'src/demo.ts'));

section('end-to-end request shape (what actually leaves the app)');
{
  // This is the wiring that used to be broken: App -> buildCtx -> adapter -> body.
  const prevFetch = globalThis.fetch;
  let sentBody: any = null;
  let sentHeaders: any = null;
  globalThis.fetch = (async (_url: string, init: any) => {
    sentBody = JSON.parse(init.body);
    sentHeaders = init.headers;
    return {
      ok: true,
      status: 200,
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
      body: {
        getReader: () => {
          let done = false;
          const enc = new TextEncoder();
          const payload = `data: ${JSON.stringify({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`;
          return { read: async () => (done ? { done: true, value: undefined } : ((done = true), { done: false, value: enc.encode(payload) })) };
        }
      }
    };
  }) as never;

  const e2eSettings: any = {
    mod: 'gemini-2.5-pro', sys: 'SYS', tmp: 0.5, ctx: 2, maxTok: '', agent: false, summary: '', agentMem: {}, tts: false
  };
  const messages = buildCtx(
    [{ role: 'user', content: 'hi' }] as never,
    e2eSettings,
    [{ name: 'a.ts', content: 'x'.repeat(90000), size: 90000 }],
    'gemini-2.5-pro',
    false,
    [],
    { extraSystem: 'GSoul memory + web results' }
  );
  const { getAdapterForProvider } = await import('../src/services/providers');
  const adapter = getAdapterForProvider('google');
  const events: any[] = [];
  for await (const ev of adapter.streamChat({
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKey: 'secret-key',
    model: 'gemini-2.5-pro',
    messages,
    temperature: 0.5,
    maxTokens: resolveMaxOutputTokens('gemini-2.5-pro', ''),
    signal: undefined
  })) events.push(ev);

  globalThis.fetch = prevFetch as never;

  ok('request completes with content', events.some(e => e.type === 'content_delta' && e.text === 'ok'));
  ok('max_tokens is an OUTPUT limit, not the 2M context window', sentBody?.max_tokens === 65536, `sent ${sentBody?.max_tokens}`);
  ok('system prompt is bounded despite a 90k-char file', JSON.stringify(sentBody.messages[0]).length < 30000, `${JSON.stringify(sentBody.messages[0]).length} chars`);
  ok('injected memory/web context is sent', JSON.stringify(sentBody.messages).includes('GSoul memory'));
  ok('ctx honoured: one user message in, one out', sentBody.messages.filter((m: any) => m.role !== 'system').length === 1);
  ok('temperature forwarded', sentBody.temperature === 0.5);
  ok('api key sent as a Bearer header', sentHeaders?.Authorization === 'Bearer secret-key', JSON.stringify(sentHeaders));
  ok('stream mode requested', sentBody.stream === true);
}

section('misc');
eq('task router detects code', detectTask('write a react component with html and css'), 'code');
eq('short prompts route to a fast model', detectTask('hi'), 'fast');
ok('token estimate is monotonic', countTokens('aaaa') < countTokens('aaaa'.repeat(10)));

console.log(`\n${'─'.repeat(60)}\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : `ALL ${passed} ASSERTIONS PASSED`}`);
process.exit(failures.length ? 1 : 0);
