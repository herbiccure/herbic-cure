import { Redis } from '@upstash/redis';

// Interface for unified Redis operations
export interface ICacheClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number; px?: number; nx?: boolean }): Promise<any>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
}

// In-memory fallback client when Upstash credentials are not set (e.g. local dev / testing)
class MemoryCacheClient implements ICacheClient {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number; px?: number; nx?: boolean }): Promise<'OK' | null> {
    if (options?.nx && this.store.has(key)) {
      const existing = this.store.get(key);
      if (!existing?.expiresAt || Date.now() <= existing.expiresAt) {
        return null;
      }
    }

    let expiresAt: number | undefined;
    if (options?.ex) expiresAt = Date.now() + options.ex * 1000;
    if (options?.px) expiresAt = Date.now() + options.px;

    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const cur = await this.get<number>(key) || 0;
    const next = cur + 1;
    await this.set(key, next);
    return next;
  }
}

const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis: ICacheClient = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : new MemoryCacheClient();
