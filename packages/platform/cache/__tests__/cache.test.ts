import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src';

describe('CacheManager', () => {
  it('should support memory cache set/get/has with TTL', async () => {
    const manager = new CacheManager();
    const cache = manager.getMemoryCache('session');

    await cache.set('auth-token', 'xyz-secret');
    expect(await cache.has('auth-token')).toBe(true);
    expect(await cache.get<string>('auth-token')).toBe('xyz-secret');

    // With short TTL
    await cache.set('temp', 'data', 5); // 5ms TTL
    expect(await cache.get<string>('temp')).toBe('data');
    
    // Wait for TTL expiration
    await new Promise((r) => setTimeout(r, 10));
    expect(await cache.get<string>('temp')).toBeUndefined();
    expect(await cache.has('temp')).toBe(false);
  });

  it('should invalidate specific keys or entire namespaces', async () => {
    const manager = new CacheManager();
    const cache = manager.getMemoryCache('api');

    await cache.set('key1', 'val1');
    await cache.set('key2', 'val2');

    await manager.invalidate('api', 'key1');
    expect(await cache.get('key1')).toBeUndefined();
    expect(await cache.get('key2')).toBe('val2');

    await manager.invalidate('api');
    expect(await cache.get('key2')).toBeUndefined();
  });
});
