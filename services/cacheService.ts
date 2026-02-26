/**
 * Generic caching service using sessionStorage for persistence.
 * Implements a simple LRU (Least Recently Used) cache with a maximum size.
 * Handles JSON serialization/deserialization and SHA-256 key generation.
 * Falls back to an in-memory Map if sessionStorage is unavailable (e.g., SSR, tests).
 */
export class CacheService<T> {
  private prefix: string;
  private maxSize: number;
  private memoryCache: Map<string, T>;
  private keys: string[];

  constructor(prefix: string, maxSize: number = 50) {
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.memoryCache = new Map<string, T>();
    this.keys = [];
    this.loadKeys();
  }

  /**
   * Loads keys from storage to initialize the LRU list.
   */
  private loadKeys() {
    if (this.isStorageAvailable()) {
      try {
        const storedKeys = sessionStorage.getItem(`${this.prefix}keys`);
        if (storedKeys) {
          this.keys = JSON.parse(storedKeys);
        }
      } catch (e) {
        console.warn('Failed to load cache keys from sessionStorage', e);
        this.keys = [];
      }
    }
  }

  /**
   * Saves the current list of keys to storage.
   */
  private saveKeys() {
    if (this.isStorageAvailable()) {
      try {
        sessionStorage.setItem(`${this.prefix}keys`, JSON.stringify(this.keys));
      } catch (e) {
        console.warn('Failed to save cache keys to sessionStorage', e);
      }
    }
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  /**
   * Generates a SHA-256 hash of the input data to use as a cache key.
   */
  async generateKey(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without crypto.subtle (though unlikely in modern browsers)
    // Simple hash function for non-critical fallback
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  get(key: string): T | null {
    if (!key) return null;

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      this.refreshKey(key);
      return this.memoryCache.get(key) || null;
    }

    // Check sessionStorage
    if (this.isStorageAvailable()) {
      try {
        const item = sessionStorage.getItem(`${this.prefix}${key}`);
        if (item) {
          const value = JSON.parse(item);
          // Sync to memory cache
          this.memoryCache.set(key, value);
          this.refreshKey(key);
          return value;
        }
      } catch (e) {
        console.warn(`Error reading from cache for key ${key}`, e);
      }
    }

    return null;
  }

  set(key: string, value: T): void {
    if (!key) return;

    // Update memory cache
    this.memoryCache.set(key, value);

    // Update LRU keys
    this.refreshKey(key);

    // Persist to sessionStorage
    if (this.isStorageAvailable()) {
      try {
        sessionStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
        this.saveKeys();
        this.enforceMaxSize();
      } catch (e) {
        console.warn(`Error writing to cache for key ${key}`, e);
        // If quota exceeded, we might want to clear some old items aggressively
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
             this.evictOldest();
             try {
                sessionStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
             } catch (retryError) {
                console.error("Cache full, unable to save even after eviction", retryError);
             }
        }
      }
    }
  }

  private refreshKey(key: string) {
    // Move key to the end (most recently used)
    this.keys = this.keys.filter(k => k !== key);
    this.keys.push(key);
  }

  private enforceMaxSize() {
    while (this.keys.length > this.maxSize) {
      this.evictOldest();
    }
  }

  private evictOldest() {
    const oldestKey = this.keys.shift();
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      if (this.isStorageAvailable()) {
        sessionStorage.removeItem(`${this.prefix}${oldestKey}`);
        this.saveKeys();
      }
    }
  }

  clear() {
    this.memoryCache.clear();
    this.keys = [];
    if (this.isStorageAvailable()) {
      // Clear only items with our prefix
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }
}
