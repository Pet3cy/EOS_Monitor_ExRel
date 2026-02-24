import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from './cacheService';

// Mock sessionStorage
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; }
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage
});

describe('CacheService', () => {
  let cacheService: CacheService<any>;
  const PREFIX = 'test_cache_';

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    cacheService = new CacheService(PREFIX, 3); // Max size 3 for testing
  });

  it('should store and retrieve values', async () => {
    await cacheService.set('key1', { data: 'value1' });
    const result = await cacheService.get('key1');
    expect(result).toEqual({ data: 'value1' });
  });

  it('should return null for missing keys', async () => {
    const result = await cacheService.get('missing');
    expect(result).toBeNull();
  });

  it('should persist to sessionStorage', async () => {
    await cacheService.set('key1', 'value1');
    const stored = sessionStorage.getItem(PREFIX + 'key1');
    expect(stored).toBe(JSON.stringify('value1'));
  });

  it('should load from sessionStorage on initialization', async () => {
    sessionStorage.setItem(PREFIX + 'existing', JSON.stringify('loaded'));
    const newService = new CacheService(PREFIX);
    const result = await newService.get('existing');
    expect(result).toBe('loaded');
  });

  it('should respect maxSize and evict oldest (LRU)', async () => {
    await cacheService.set('1', 'one');
    await cacheService.set('2', 'two');
    await cacheService.set('3', 'three');

    // All 3 should be present
    expect(await cacheService.get('1')).toBe('one');
    expect(await cacheService.get('2')).toBe('two');
    expect(await cacheService.get('3')).toBe('three');

    // Access '1' to make it MRU
    await cacheService.get('1');
    // Order: 2, 3, 1 (MRU)

    // Add '4'. Should evict '2' (LRU)
    await cacheService.set('4', 'four');

    expect(await cacheService.get('2')).toBeNull(); // Evicted
    expect(await cacheService.get('1')).toBe('one'); // Kept
    expect(await cacheService.get('3')).toBe('three'); // Kept
    expect(await cacheService.get('4')).toBe('four'); // Added
  });

  it('should generate consistent keys', async () => {
    const key1 = await cacheService.generateKey({ a: 1, b: 2 });
    const key2 = await cacheService.generateKey({ a: 1, b: 2 });
    expect(key1).toBe(key2);
  });

  it('should handle non-string keys via generateKey', async () => {
    const obj = { id: 123, type: 'event' };
    const key = await cacheService.generateKey(obj);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });
});
