import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from './cacheService';

describe('CacheService', () => {
  const PREFIX = 'test_cache_';
  const MAX_SIZE = 5;
  let cacheService: CacheService<any>;
  let sessionStorageMock: any;

  beforeEach(() => {
    sessionStorageMock = {
      store: {} as Record<string, string>,
      getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        sessionStorageMock.store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete sessionStorageMock.store[key];
      }),
      clear: vi.fn(() => {
        sessionStorageMock.store = {};
      }),
    };
    vi.stubGlobal('sessionStorage', sessionStorageMock);

    cacheService = new CacheService(PREFIX, MAX_SIZE);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a consistent hash', async () => {
    const content = 'test content';
    const hash1 = await cacheService.generateHash(content);
    const hash2 = await cacheService.generateHash(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toContain(PREFIX);
  });

  it('should store and retrieve data from memory cache', () => {
    const key = 'key1';
    const data = { value: 1 };
    cacheService.set(key, data);
    const result = cacheService.get(key);
    expect(result).toEqual(data);
  });

  it('should store and retrieve data from sessionStorage', () => {
    const key = 'key1';
    const data = { value: 1 };
    cacheService.set(key, data);

    // Create new instance to test persistence (simulating page reload or new session)
    // but sharing the same mocked sessionStorage
    const newCacheService = new CacheService(PREFIX, MAX_SIZE);

    const result = newCacheService.get(key);
    expect(result).toEqual(data);
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith(key);
  });

  it('should respect max cache size (eviction from memory)', () => {
    // Fill up the cache
    for (let i = 0; i < MAX_SIZE; i++) {
      cacheService.set(`key${i}`, { value: i });
    }

    // Add one more
    cacheService.set(`key${MAX_SIZE}`, { value: MAX_SIZE });

    // The first item (key0) should be evicted from memory.
    // 'get' checks memory first. If missing, it checks sessionStorage.
    // We want to verify it goes to sessionStorage, implying it's not in memory.

    sessionStorageMock.getItem.mockClear();

    const val0 = cacheService.get('key0');
    expect(val0).toEqual({ value: 0 });
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('key0');

    // The last item (key5) should be in memory
    sessionStorageMock.getItem.mockClear();
    const valMax = cacheService.get(`key${MAX_SIZE}`);
    expect(valMax).toEqual({ value: MAX_SIZE });
    expect(sessionStorageMock.getItem).not.toHaveBeenCalled();
  });

  it('should handle sessionStorage errors gracefully', () => {
     sessionStorageMock.setItem.mockImplementation(() => {
       throw new Error('QuotaExceeded');
     });

     const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

     cacheService.set('key', { data: 'test' });

     expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save'), expect.any(Error));
     consoleSpy.mockRestore();
  });
});
