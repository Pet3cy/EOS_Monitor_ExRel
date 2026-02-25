export class CacheService {
  private static memoryCache = new Map<string, any>();

  static get<T>(key: string): T | null {
    if (typeof sessionStorage !== 'undefined') {
      const item = sessionStorage.getItem(key);
      try {
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn('Failed to parse cached item', e);
        return null;
      }
    }
    return this.memoryCache.get(key) || null;
  }

  static set(key: string, value: any): void {
    if (value === undefined) return;

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to save to sessionStorage', e);
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
