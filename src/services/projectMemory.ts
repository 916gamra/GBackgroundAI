/**
 * Runtime project/workspace memory.
 *
 * Backs the self-inspection agent tools (`self_code_editor`, `list_local_files`,
 * `web_repo_cloner_sim`) with the files the user actually added to the workspace
 * plus anything the agent generated in this session.
 *
 * HISTORY / WHY THIS WAS REWRITTEN
 * ---------------------------------------------------------------------------
 * The previous implementation eagerly glob-imported the whole `src` tree with
 * Vite's `import.meta.glob(..., { query: '?raw', eager: true })`, which inlined
 * *the entire application source code* into the production JS bundle as strings
 * (~+400 KB before gzip, and it also pulled in package-lock.json /
 * vite.config.ts). Two concrete problems:
 *   1. Every user downloaded the whole codebase just to chat.
 *   2. The full source was readable by anyone from `window.__G_PROJECT_FILES__`.
 *
 * It is now a plain runtime store: files are registered by App.tsx whenever the
 * workspace or artifact list changes, so the agent still reads/writes real files
 * but nothing is shipped in the bundle.
 */

export interface MemoryFile {
  path: string;
  content: string;
  updatedAt: number;
  origin: 'workspace' | 'artifact' | 'agent';
}

const store = new Map<string, MemoryFile>();

/** Normalize a user/LLM supplied path to the canonical key we store under. */
export function normalizePathKey(filePath: string): string {
  let clean = (filePath || '').trim().replace(/\\/g, '/').replace(/^\.?\//,'');
  while (clean.startsWith('../')) clean = clean.slice(3);
  return clean;
}

function put(path: string, content: string, origin: MemoryFile['origin']): string {
  const key = normalizePathKey(path);
  if (!key) return key;
  const existing = store.get(key);
  // Keep every alias resolvable without duplicating payloads in memory.
  store.set(key, { path: key, content, updatedAt: Date.now(), origin: existing?.origin ?? origin });
  return key;
}

/**
 * Replace the tracked workspace with the app's current project + artifact files.
 * Called from App.tsx in an effect, so the agent always sees the live workspace.
 */
export function syncWorkspace(files: Array<{ name: string; content: string }>, origin: 'workspace' | 'artifact' = 'workspace'): void {
  const seen = new Set<string>();
  for (const f of files || []) {
    if (!f?.name) continue;
    const key = put(f.name, f.content ?? '', origin);
    seen.add(key);
  }
  // Drop stale workspace entries that were deleted by the user.
  for (const [key, entry] of store) {
    if (entry.origin === origin && !seen.has(key)) store.delete(key);
  }
}

/** Register a single file written by the agent itself. */
export function registerAgentFile(path: string, content: string): string {
  return put(path, content ?? '', 'agent');
}

/** Full map (kept for API compatibility with `window.__G_PROJECT_FILES__` users). */
export function getProjectMemory(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, entry] of store) {
    out[key] = entry.content;
    out[`/${key}`] = entry.content;
  }
  return out;
}

export function getProjectFileContent(filePath: string): { path: string; content: string; lines: number } | null {
  const key = normalizePathKey(filePath);
  const direct = store.get(key);
  const hit =
    direct ??
    // tolerate a `src/` prefix the model sometimes invents
    store.get(key.replace(/^src\//, '')) ??
    Array.from(store.values()).find(e => e.path.toLowerCase() === key.toLowerCase()) ??
    null;
  if (!hit) return null;
  return { path: hit.path, content: hit.content, lines: hit.content.split('\n').length };
}

export function setProjectFileContent(filePath: string, content: string): string {
  return put(filePath, content, 'agent');
}

export function listProjectFilesMemory(filterQuery?: string, extensionFilter?: string) {
  const q = (filterQuery || '').toLowerCase();
  const ext = (extensionFilter || '').toLowerCase().replace(/^\./, '');

  return Array.from(store.values())
    .filter(e => (!q || e.path.toLowerCase().includes(q)) && (!ext || e.path.toLowerCase().endsWith('.' + ext)))
    .map(e => ({
      path: e.path,
      lines: e.content.split('\n').length,
      characters: e.content.length,
      sizeKb: (e.content.length / 1024).toFixed(1) + ' KB'
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** No-op kept so older call sites (`initProjectMemory()`) keep compiling. */
export function initProjectMemory(): Record<string, string> {
  return getProjectMemory();
}
