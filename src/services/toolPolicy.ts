/**
 * Tool trust policy — single source of truth for what the agent is allowed to
 * claim it can actually do.
 *
 * Three tiers:
 *  • REAL      — performs a genuine side effect (network, Pyodide, Web Crypto…)
 *  • HYBRID    — real browser/device APIs, but with fabricated fallback values
 *  • SIMULATED — pure canned JSON, no real effect (demo/theatre)
 *
 * Why this exists:
 * `AGENT_TOOLS` is shipped to the model as JSON schema on every agentic request.
 * When 60 tools (many of them fake) are advertised, three bad things happen:
 *   1. 10–20k tokens of schemas are paid for on every turn,
 *   2. the model trusts the fabricated `[SIMULATED]` payloads and reports them to
 *      the user as if they were real PLC/hardware/root-shell results,
 *   3. a "success" string like `exit_code: 0` can never be distinguished from a
 *      real one.
 *
 * Policy: SIMULATED tools are NOT advertised by default and their output is
 * always prefixed with an explicit warning so the model can never present it as
 * ground truth. Users can still opt them in from Settings → AI Tools.
 */

/** Tools that fabricate their output (no real system/PLC/hardware interaction). */
export const SIMULATED_TOOLS: ReadonlySet<string> = new Set([
  'modbus_controller',
  'modbus_titan',
  'opc_ua_bridge',
  'gmao_ciob_connector',
  'cad_analyzer',
  'pdf_technical_parser',
  'camera_vision_ai',
  'voice_cloner',
  'agent_swarm',
  'memory_timeline',
  'internet_ghost',
  'workflow_automator',
  'knowledge_distiller',
  'predictive_maintenance_brain',
  'offline_sync_quantum',
  'ben10_consciousness_core',
  'self_tool_forger',
  'self_model_switcher',
  'self_healer',
  'termux_root_executor',
  'device_hardware_overlord',
  'local_llm_runner',
  'file_system_titan',
  'multi_repo_orchestrator',
  'live_code_sandbox',
  'generate_image', // only builds a third-party URL, it does not verify an image exists
  'web_repo_cloner_sim',
  'chat_analytics'
]);

/** Tools that use real browser/device APIs but may fall back to invented values. */
export const HYBRID_TOOLS: ReadonlySet<string> = new Set([
  'termux_bridge',
  'free_tts_stt',
  'elevenlabs_tts'
]);

/** Tools that cost money / need a third-party secret to be useful. */
export const KEY_GATED_TOOLS: ReadonlyRecord<string, string> = {
  web_search: 'serper',
  vector_rag_search: 'pineconeKey',
  elevenlabs_tts: 'elevenlabsKey',
  zapier_action: 'zapierWebhook',
  make_webhook: 'makeWebhook',
  github_publisher: 'githubPat',
  github_code_search: 'githubPat'
};

/**
 * Prefix prepended to any simulated tool result so the model is instructed to
 * treat it as a mock — and so the UI can flag it visually.
 */
export const SIMULATION_NOTICE =
  '[SIMULATED DEMO TOOL — no real device/network was contacted. Do NOT present this as factual data; tell the user it is a simulation.]';

export const HYBRID_NOTICE =
  '[PARTIAL HARDWARE ACCESS — values below come from browser APIs where available, otherwise they are estimates.]';

type ReadonlyRecord<K extends string, V> = { [P in K]: V };

/** Is this tool one that fakes its result? */
export function isToolSimulated(id: string): boolean {
  return SIMULATED_TOOLS.has(id);
}

/**
 * Default-on for everything real, default-off for everything simulated.
 * `enabledMap` from user settings always wins.
 */
export function isToolEnabled(
  id: string,
  enabledMap?: Record<string, boolean>
): boolean {
  if (enabledMap && enabledMap[id] !== undefined) return !!enabledMap[id];
  return !isToolSimulated(id);
}

/** Tag a result string with the right honesty notice. */
export function annotateToolResult(id: string, result: string): string {
  if (isToolSimulated(id)) {
    return result.startsWith(SIMULATION_NOTICE) ? result : `${SIMULATION_NOTICE}\n${result}`;
  }
  if (HYBRID_TOOLS.has(id)) {
    return result.startsWith(HYBRID_NOTICE) ? result : `${HYBRID_NOTICE}\n${result}`;
  }
  return result;
}

/** Is a key-gated tool usable with the settings the user provided? */
export function toolHasKey(toolId: string, settings?: Record<string, any> | null): boolean {
  const keyName = (KEY_GATED_TOOLS as any)[toolId];
  if (!keyName) return true; // not key gated
  const val = settings?.[keyName];
  return typeof val === 'string' && val.trim().length > 0;
}
