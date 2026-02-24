export class CacheService {
  private cache: Map<string, any>;
  private prefix: string;
  private maxEntries: number;

  constructor(prefix: string = 'gemini_cache_', maxEntries: number = 50) {
    this.prefix = prefix;
    this.maxEntries = maxEntries;
    this.cache = new Map();
    this.loadFromSession();
  }

  private loadFromSession() {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }

      keys.forEach(key => {
         try {
           const item = JSON.parse(sessionStorage.getItem(key) || 'null');
           if (item) {
             this.cache.set(key, item);
           }
         } catch (e) {
           console.warn('Failed to parse cache item', key, e);
         }
      });
    } catch (e) {
      console.warn('Session storage access failed', e);
    }
  }

  async generateKey(data: any): Promise<string> {
    const str = JSON.stringify(data);
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return this.prefix + hashHex;
    }

    // Fallback for non-browser environments
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return this.prefix + (hash >>> 0).toString(16);
  }

  get<T>(key: string): T | null {
    if (this.cache.has(key)) {
      const val = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, val);
      return val as T;
    }
    return null;
  }

  set<T>(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(firstKey);
        }
      }
    }

    this.cache.set(key, value);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to save to session storage', e);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    if (typeof sessionStorage !== 'undefined') {
       const keys: string[] = [];
       for (let i = 0; i < sessionStorage.length; i++) {
         const key = sessionStorage.key(i);
         if (key && key.startsWith(this.prefix)) {
           keys.push(key);
         }
       }
       keys.forEach(k => sessionStorage.removeItem(k));
    }
  }
}
