/**
 * Single source of truth for the app version.
 * metadata.json (AI Studio reads that file) and index.html's <title> must be
 * bumped together with this value; everything in the UI and in storage keys
 * imports from here instead of hard-coding "v13"/"v14"/"v15" per file.
 */
export const APP_VERSION = '15.0';
export const APP_VERSION_LABEL = `Beast v${APP_VERSION}`;
export const APP_NAME = 'GBackgroundAI';

/** Storage namespace. Bump the number when the shape of a store changes. */
export const STORAGE = {
  sessions: 'gbai_sessions_v15',
  settings: 'gbai_settings_v15',
  providers: 'gbai_providers_v15',
  snippets: 'gbai_snippets_v15',
  projectFiles: 'gbai_project_files_v15',
  artifacts: 'gbai_artifacts_v15',
  trash: 'gbai_trash_v15',
  nvidiaKey: 'gbai_nvidia_api_key'
} as const;

/** Legacy keys that were used up to Beast v14, migrated once on first boot. */
export const LEGACY_STORAGE: Record<string, string> = {
  [STORAGE.sessions]: 'gbai_sessions_v13',
  [STORAGE.settings]: 'gbai_settings_v13',
  [STORAGE.providers]: 'gbai_providers_v13',
  [STORAGE.snippets]: 'gbai_snippets_v13',
  [STORAGE.projectFiles]: 'gbai_project_files_v13',
  [STORAGE.artifacts]: 'gbai_artifacts_v13',
  [STORAGE.trash]: 'gbai_trash_v13'
};

/**
 * One-shot migration: copy old `*_v13` keys over to the versioned keys so
 * existing installs do not silently lose their conversations, providers and
 * API keys after the rename.
 */
export function migrateLegacyStorage(): void {
  try {
    for (const [nextKey, oldKey] of Object.entries(LEGACY_STORAGE)) {
      if (localStorage.getItem(nextKey) === null) {
        const legacy = localStorage.getItem(oldKey);
        if (legacy !== null) {
          localStorage.setItem(nextKey, legacy);
        }
      }
    }
  } catch {
    /* private mode / quota — the app still boots with defaults */
  }
}
