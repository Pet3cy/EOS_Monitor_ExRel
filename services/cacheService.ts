export class CacheService<T> {
  private prefix: string;
  private maxSize: number;
  private memoryCache: Map<string, T>;

  constructor(prefix: string, maxSize: number = 50) {
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.memoryCache = new Map<string, T>();
  }

  async generateHash(content: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `${this.prefix}${hashHex}`;
    }

    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${this.prefix}${hash}`;
  }

  get(key: string): T | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) || null;
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        const item = sessionStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          this.memoryCache.set(key, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn('Error reading from sessionStorage:', e);
      }
    }
    return null;
  }

  set(key: string, data: T): void {
    if (this.memoryCache.size >= this.maxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, data);

    // SECURITY: Use sessionStorage instead of localStorage to ensure sensitive data
    // is cleared when the session ends (e.g. tab closed).
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save to sessionStorage:', e);
      }
    }
  }
}
