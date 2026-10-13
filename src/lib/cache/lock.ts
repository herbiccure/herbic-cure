import crypto from 'crypto';
import { redis } from './redis';

/**
 * Distributed single-flight lock with TTL for coupon redemptions,
 * inventory stock allocations, and critical DB updates.
 */
export async function acquireLock(lockKey: string, ttlMs = 5000): Promise<string | null> {
  const lockId = crypto.randomUUID();
  const key = `lock:${lockKey}`;

  try {
    const result = await redis.set(key, lockId, {
      px: ttlMs,
      nx: true,
    });

    return result === 'OK' ? lockId : null;
  } catch (err) {
    console.warn('[LOCK] Failed to acquire lock:', err);
    return null;
  }
}

export async function releaseLock(lockKey: string, lockId: string): Promise<boolean> {
  const key = `lock:${lockKey}`;
  try {
    const current = await redis.get<string>(key);
    if (current === lockId) {
      await redis.del(key);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[LOCK] Failed to release lock:', err);
    return false;
  }
}

/**
 * Runs a critical task with an exclusive distributed lock.
 */
export async function withLock<T>(
  lockKey: string,
  ttlMs: number,
  task: () => Promise<T>
): Promise<T> {
  const lockId = await acquireLock(lockKey, ttlMs);
  if (!lockId) {
    throw new Error('CONCURRENCY_CONFLICT: Another transaction is currently processing this resource. Please retry.');
  }

  try {
    return await task();
  } finally {
    await releaseLock(lockKey, lockId);
  }
}
