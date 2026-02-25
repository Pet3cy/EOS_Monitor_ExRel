export class CacheService<T> {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private getKey(hash: string): string {
    return `${this.prefix}_${hash}`;
  }

  async generateHash(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  get(hash: string): T | null {
    if (typeof sessionStorage === 'undefined') return null;
    const item = sessionStorage.getItem(this.getKey(hash));
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn('Failed to parse cache item:', e);
      return null;
    }
  }

  set(hash: string, data: T): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(this.getKey(hash), JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }
}
