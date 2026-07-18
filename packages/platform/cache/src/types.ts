/**
 * @unify/platform-cache — Multi-layer caching: memory, persistent, AI, search, repo.
 */

export interface ICache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  namespaces: string[];
}

export interface ICacheManager {
  getMemoryCache(namespace: string): ICache;
  getPersistentCache(namespace: string): ICache;
  invalidate(namespace: string, key?: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): CacheStats;
}
