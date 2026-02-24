export class CacheService<T> {
  private cache: Map<string, T>;
  private prefix: string;
  private maxSize: number;

  constructor(prefix: string, maxSize = 50) {
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.cache = new Map();
    this.loadFromStorage();
  }

  private get storage(): Storage | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage;
    }
    return null;
  }

  private loadFromStorage() {
    const storage = this.storage;
    if (!storage) return;

    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = storage.getItem(key);
          if (value) {
            try {
              this.cache.set(key, JSON.parse(value));
            } catch (e) {
              console.warn(`Failed to parse cache item ${key}`, e);
            }
          }
        }
      }

      // Trim if loaded more than maxSize
      while (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
            this.cache.delete(firstKey);
            storage.removeItem(firstKey);
        }
      }
    } catch (e) {
      console.warn('Error loading from sessionStorage', e);
    }
  }

  async get(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    if (this.cache.has(fullKey)) {
      const value = this.cache.get(fullKey)!;
      // Refresh LRU order (delete and re-add)
      this.cache.delete(fullKey);
      this.cache.set(fullKey, value);
      return value;
    }

    const storage = this.storage;
    if (storage) {
      const value = storage.getItem(fullKey);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          this.cache.set(fullKey, parsed);
          return parsed;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  async set(key: string, value: T): Promise<void> {
    const fullKey = this.prefix + key;

    // Remove if exists to update position (LRU)
    if (this.cache.has(fullKey)) {
        this.cache.delete(fullKey);
    }

    this.cache.set(fullKey, value);

    const storage = this.storage;
    if (storage) {
      try {
        storage.setItem(fullKey, JSON.stringify(value));
      } catch (e) {
        console.warn('SessionStorage full or error', e);
      }
    }

    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        if (storage) {
          storage.removeItem(oldestKey);
        }
      }
    }
  }

  async generateKey(data: string | object): Promise<string> {
    const str = typeof data === 'string' ? data : JSON.stringify(data);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
