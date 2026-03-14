export class CacheService {
  private static memoryCache = new Map<string, unknown>();

  static get<T>(key: string): T | null {
  static get<T>(key: string): T | null {
    if (typeof sessionStorage !== 'undefined') {
      const item = sessionStorage.getItem(key);
      if (item) {
        try {
          return JSON.parse(item);
        } catch (e) {
          console.warn('Failed to parse cached item', e);
        }
      }
    }
    return this.memoryCache.has(key) ? this.memoryCache.get(key) : null;
  }

  static set(key: string, value: unknown): void {
    if (value === undefined) return;

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to save to sessionStorage', e);
        this.memoryCache.set(key, value);
      }
    } else {
      this.memoryCache.set(key, value);
    }
  }

  static async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback (simple hash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
