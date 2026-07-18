/**
 * CacheManager — Caching system containing Memory and Persistent layers.
 *
 * Supports TTL (Time To Live), namespace isolation, and stats collection.
 */

import type { CacheStats, ICache, ICacheManager } from './types';

interface CacheItem<T> {
  value: T;
  expiresAt?: number;
}

export class MemoryCache implements ICache {
  private readonly _store = new Map<string, CacheItem<unknown>>();
  private _hits = 0;
  private _misses = 0;

  async get<T>(key: string): Promise<T | undefined> {
    const item = this._store.get(key);
    if (!item) {
      this._misses++;
      return undefined;
    }

    if (item.expiresAt && item.expiresAt < Date.now()) {
      this._store.delete(key);
      this._misses++;
      return undefined;
    }

    this._hits++;
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this._store.set(key, { value, expiresAt });
  }

  async has(key: string): Promise<boolean> {
    const item = this._store.get(key);
    if (!item) return false;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this._store.delete(key);
      return false;
    }
    return true;
  }

  async delete(key: string): Promise<void> {
    this._store.delete(key);
  }

  async clear(): Promise<void> {
    this._store.clear();
    this._hits = 0;
    this._misses = 0;
  }

  get stats() {
    return { hits: this._hits, misses: this._misses, size: this._store.size };
  }
}

export class LocalStorageCache implements ICache {
  private readonly _prefix: string;

  constructor(namespace: string) {
    this._prefix = `unify:cache:${namespace}:`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (typeof localStorage === 'undefined') return undefined;

    const data = localStorage.getItem(this._prefix + key);
    if (!data) return undefined;

    try {
      const item = JSON.parse(data) as CacheItem<T>;
      if (item.expiresAt && item.expiresAt < Date.now()) {
        localStorage.removeItem(this._prefix + key);
        return undefined;
      }
      return item.value;
    } catch {
      localStorage.removeItem(this._prefix + key);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    const item: CacheItem<T> = { value, expiresAt };
    localStorage.setItem(this._prefix + key, JSON.stringify(item));
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== undefined;
  }

  async delete(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this._prefix + key);
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this._prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }
}

export class CacheManager implements ICacheManager {
  private readonly _memoryCaches = new Map<string, MemoryCache>();
  private readonly _persistentCaches = new Map<string, ICache>();

  getMemoryCache(namespace: string): ICache {
    if (!this._memoryCaches.has(namespace)) {
      this._memoryCaches.set(namespace, new MemoryCache());
    }
    return this._memoryCaches.get(namespace)!;
  }

  getPersistentCache(namespace: string): ICache {
    if (!this._persistentCaches.has(namespace)) {
      // Falls back to memory cache in Node if localStorage isn't available (e.g. testing)
      if (typeof localStorage === 'undefined') {
        this._persistentCaches.set(namespace, new MemoryCache());
      } else {
        this._persistentCaches.set(namespace, new LocalStorageCache(namespace));
      }
    }
    return this._persistentCaches.get(namespace)!;
  }

  async invalidate(namespace: string, key?: string): Promise<void> {
    if (key) {
      await this._memoryCaches.get(namespace)?.delete(key);
      await this._persistentCaches.get(namespace)?.delete(key);
    } else {
      await this._memoryCaches.get(namespace)?.clear();
      await this._persistentCaches.get(namespace)?.clear();
    }
  }

  async clear(): Promise<void> {
    for (const cache of this._memoryCaches.values()) {
      await cache.clear();
    }
    for (const cache of this._persistentCaches.values()) {
      await cache.clear();
    }
  }

  getStats(): CacheStats {
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;
    const namespaces = Array.from(this._memoryCaches.keys());

    for (const cache of this._memoryCaches.values()) {
      totalHits += cache.stats.hits;
      totalMisses += cache.stats.misses;
      totalSize += cache.stats.size;
    }

    return {
      hits: totalHits,
      misses: totalMisses,
      size: totalSize,
      namespaces,
    };
  }
}
