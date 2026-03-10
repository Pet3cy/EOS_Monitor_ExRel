/**
 * Service for caching API responses using sessionStorage.
 * Using sessionStorage ensures data is cleared when the tab/window is closed,
 * which is more secure than localStorage for sensitive data.
 */

export class CacheService {
  private static PREFIX = 'gemma_cache_';
  // Optional: Add a version or max size limit if needed

  /**
   * Generates a hash for a string to use as a cache key.
   * Uses FNV-1a inspired approach with two independent hashes to reduce collisions.
   */
  static generateKey(data: string): string {
    // For large inputs (e.g. base64 file data), sample instead of hashing every char
    const MAX_HASH_CHARS = 8192;
    let input = data;
    if (data.length > MAX_HASH_CHARS) {
      const half = MAX_HASH_CHARS / 2;
      input = data.slice(0, half) + data.slice(-half);
    }

    let h1 = 0x811c9dc5; // FNV offset basis
    let h2 = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      h1 = h1 ^ char;
      h1 = Math.imul(h1, 0x01000193); // FNV prime
      h2 = (h2 << 5) - h2 + char;
      h2 = h2 | 0; // coerce to 32-bit integer
    }
    // Include original length to differentiate inputs that share head/tail
    return (h1 >>> 0).toString(36) + '_' + (h2 >>> 0).toString(36) + '_' + data.length.toString(36);
  }

  static get<T>(key: string): T | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      return parsed as T;
    } catch (e) {
      console.warn('Failed to read from cache:', e);
      return null;
    }
  }

  static set(key: string, value: any): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      try {
        sessionStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      } catch (e) {
        // If quota exceeded, clear our cache and try again once
        this.clear();
        sessionStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('Failed to write to cache:', e);
    }
  }

  static remove(key: string): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.removeItem(this.PREFIX + key);
    } catch (e) {
      console.warn('Failed to remove from cache:', e);
    }
  }

  static clear(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }
}
