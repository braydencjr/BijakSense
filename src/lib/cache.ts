// Global data cache — persists across tab switches (module-level, not component state)
// Data loads once, then serves from memory instantly

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number | null;
}

interface CacheOptions {
  ttlMs?: number | null;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 min cache
const STORAGE_PREFIX = 'merchantmind:cache:';

function isExpired(entry: CacheEntry<unknown>) {
  if (entry.ttlMs === null) return false;
  return Date.now() - entry.timestamp > entry.ttlMs;
}

function readStorage<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (isExpired(entry as CacheEntry<unknown>)) {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return null;
    }

    cache[key] = entry as CacheEntry<unknown>;
    return entry;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage failures and continue with memory cache.
  }
}

function deleteCache(key: string) {
  delete cache[key];

  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore storage failures.
  }
}

export function getCached<T>(key: string): T | null {
  const entry = cache[key] ?? readStorage<T>(key);
  if (!entry) return null;
  if (isExpired(entry)) {
    deleteCache(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, options: CacheOptions = {}): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs: options.ttlMs ?? DEFAULT_TTL,
  };

  cache[key] = entry;
  writeStorage(key, entry);
}

export function isCached(key: string): boolean {
  return getCached(key) !== null;
}
