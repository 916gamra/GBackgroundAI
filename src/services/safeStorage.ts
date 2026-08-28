/**
 * localStorage helpers that survive the two failure modes this app actually hits
 * on a phone: JSON blow-ups from a long session, and the 5 MB quota.
 *
 * Before this, a quota error was only console.warn'ed, so the user lost the
 * conversation silently and kept seeing the app "work".
 */

export interface PersistOptions {
  /**
   * Called when the first write fails, e.g. to drop the oldest artifacts and
   * return a trimmed payload. Return undefined to give up.
   */
  recover?: () => unknown;
  label?: string;
}

const enc = new TextEncoder();

export function byteSize(value: string): number {
  return enc.encode(value).length;
}

/** Write JSON, with one recovery attempt on quota errors. Returns true on success. */
export function setJson(key: string, value: unknown, opts: PersistOptions = {}): boolean {
  const label = opts.label || key;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err: any) {
    const quota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (quota && opts.recover) {
      try {
        const trimmed = opts.recover();
        if (trimmed !== undefined) {
          localStorage.setItem(key, JSON.stringify(trimmed));
          console.warn(`[storage] ${label}: over quota, saved a trimmed snapshot instead of losing it.`);
          return true;
        }
      } catch {
        /* fall through to the warning below */
      }
    }
    console.warn(
      quota
        ? `[storage] ${label}: browser storage is full. Older chats/artifacts may not be saved — export or clear them in Settings.`
        : `[storage] ${label}: failed to persist (${err?.message || err}).`
    );
    return false;
  }
}

/** Read + parse JSON, never throwing. */
export function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Rough total used by our own keys, so the UI can warn before it hits the wall. */
export function estimateStorageBytes(prefixes: string[] = ['gbai_', 'gsoul_']): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !prefixes.some(p => k.startsWith(p))) continue;
      total += byteSize(k) + byteSize(localStorage.getItem(k) || '');
    }
  } catch {
    /* private mode */
  }
  return total;
}

/** Drop the oldest `fraction` of an array-shaped store (newest-first arrays keep index 0). */
export function trimOldest<T>(list: T[], fraction = 0.25, minKeep = 5): T[] {
  if (!Array.isArray(list) || list.length <= minKeep) return list;
  const dropCount = Math.max(1, Math.floor(list.length * fraction));
  return list.slice(0, Math.max(minKeep, list.length - dropCount));
}
