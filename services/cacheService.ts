export class CacheService<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  private storageKey: string;
  private ttl: number; // Time to live in ms
  private maxEntries: number;

  constructor(storageKey: string, ttl: number = 3600000, maxEntries: number = 50) { // Default 1 hour, 50 entries
    this.storageKey = storageKey;
    this.ttl = ttl;
    this.maxEntries = maxEntries;
    this.loadFromStorage();
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  }

  private loadFromStorage() {
    if (!this.isStorageAvailable()) return;

    const stored = sessionStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Filter out expired entries on load
        const validEntries = (parsed as [string, { value: T; timestamp: number }][])
          .filter(([, item]) => now - item.timestamp <= this.ttl);
        this.cache = new Map(validEntries);
      } catch (e) {
        console.warn('Failed to parse cache', e);
      }
    }
  }

  private saveToStorage() {
    if (!this.isStorageAvailable()) return;

    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      sessionStorage.setItem(this.storageKey, serialized);
    } catch (e) {
      console.warn('Failed to save cache to sessionStorage', e);
    }
  }

  private evictOldest() {
    if (this.cache.size <= this.maxEntries) return;

    // Evict oldest entries until we're under the limit
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    while (entries.length > this.maxEntries) {
      const [key] = entries.shift()!;
      this.cache.delete(key);
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return item.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
    this.evictOldest();
    this.saveToStorage();
  }

  async generateKey(data: any): Promise<string> {
    const str = JSON.stringify(data);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback handled below
      }
    }

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'simple-' + hash.toString(16);
  }
}
