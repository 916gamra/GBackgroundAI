/**
 * Global Project Memory & In-Memory Code Explorer for Beast v15
 * Bundles local /src files at build time and manages runtime edits.
 */

declare global {
  interface Window {
    __G_PROJECT_FILES__?: Record<string, string>;
  }
}

// Dynamically import all source files as raw text using Vite's eager glob
let rawModules: Record<string, string> = {};

try {
  rawModules = (import.meta as any).glob('/src/**/*.{ts,tsx,js,jsx,css,html,json,md,svg}', {
    query: '?raw',
    import: 'default',
    eager: true
  }) as Record<string, string>;
} catch (e) {
  console.warn('Vite raw glob import fallback:', e);
}

// Also include root configuration files if available
try {
  const rootModules = (import.meta as any).glob(['/*.{json,html,ts,js,config.js,config.ts}', '/public/**/*'], {
    query: '?raw',
    import: 'default',
    eager: true
  }) as Record<string, string>;
  Object.assign(rawModules, rootModules);
} catch {}

/**
 * Initialize window.__G_PROJECT_FILES__ with normalized path keys
 */
export function initProjectMemory(): Record<string, string> {
  if (!window.__G_PROJECT_FILES__) {
    window.__G_PROJECT_FILES__ = {};
  }

  // Populate from Vite eager glob
  for (const [key, content] of Object.entries(rawModules)) {
    if (typeof content === 'string') {
      const cleanKey = key.startsWith('/') ? key.slice(1) : key;
      window.__G_PROJECT_FILES__[cleanKey] = content;
      window.__G_PROJECT_FILES__[key] = content; // keep both /src/App.tsx and src/App.tsx
    }
  }

  return window.__G_PROJECT_FILES__;
}

/**
 * Get normalized project files map
 */
export function getProjectMemory(): Record<string, string> {
  if (!window.__G_PROJECT_FILES__ || Object.keys(window.__G_PROJECT_FILES__).length === 0) {
    return initProjectMemory();
  }
  return window.__G_PROJECT_FILES__;
}

/**
 * Normalize file path for lookup
 */
export function normalizePathKey(filePath: string): string {
  let clean = filePath.trim().replace(/\\/g, '/');
  if (clean.startsWith('./')) clean = clean.slice(2);
  return clean;
}

/**
 * Retrieve content of a specific file from memory
 */
export function getProjectFileContent(filePath: string): { path: string; content: string; lines: number } | null {
  const memory = getProjectMemory();
  const clean = normalizePathKey(filePath);
  const withSlash = clean.startsWith('/') ? clean : '/' + clean;
  const withoutSlash = clean.startsWith('/') ? clean.slice(1) : clean;

  const candidates = [
    clean,
    withoutSlash,
    withSlash,
    'src/' + withoutSlash,
    '/src/' + withoutSlash
  ];

  for (const cand of candidates) {
    if (typeof memory[cand] === 'string') {
      const content = memory[cand];
      return {
        path: cand,
        content,
        lines: content.split('\n').length
      };
    }
  }

  // Case-insensitive fallback lookup
  const lowerClean = withoutSlash.toLowerCase();
  for (const [key, content] of Object.entries(memory)) {
    const kLower = key.toLowerCase();
    if (kLower === lowerClean || kLower.endsWith('/' + lowerClean) || kLower === 'src/' + lowerClean) {
      return {
        path: key,
        content,
        lines: content.split('\n').length
      };
    }
  }

  return null;
}

/**
 * Save / Patch file content in memory
 */
export function setProjectFileContent(filePath: string, content: string): string {
  const memory = getProjectMemory();
  const clean = normalizePathKey(filePath);
  const withoutSlash = clean.startsWith('/') ? clean.slice(1) : clean;

  memory[withoutSlash] = content;
  memory['/' + withoutSlash] = content;
  if (!withoutSlash.startsWith('src/')) {
    memory['src/' + withoutSlash] = content;
  }

  return withoutSlash;
}

/**
 * List all project files in memory with size & lines
 */
export function listProjectFilesMemory(filterQuery?: string, extensionFilter?: string) {
  const memory = getProjectMemory();
  const uniquePaths = new Set<string>();

  const results: { path: string; lines: number; characters: number; sizeKb: string }[] = [];

  const q = (filterQuery || '').toLowerCase();
  const ext = (extensionFilter || '').toLowerCase().replace(/^\./, '');

  for (const [key, content] of Object.entries(memory)) {
    // Normalize to prevent duplicates (prefer relative path e.g. src/App.tsx)
    const normKey = key.startsWith('/') ? key.slice(1) : key;
    if (uniquePaths.has(normKey)) continue;
    uniquePaths.add(normKey);

    if (q && !normKey.toLowerCase().includes(q)) continue;
    if (ext && !normKey.toLowerCase().endsWith('.' + ext)) continue;

    const lines = content.split('\n').length;
    const characters = content.length;
    const sizeKb = (characters / 1024).toFixed(1) + ' KB';

    results.push({
      path: normKey,
      lines,
      characters,
      sizeKb
    });
  }

  return results.sort((a, b) => a.path.localeCompare(b.path));
}

// Auto-initialize on module load
initProjectMemory();
