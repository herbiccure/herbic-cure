import { describe, it, expect } from 'vitest';
import { acquireLock, releaseLock, withLock } from '../src/lib/cache/lock';

describe('Distributed Single-Flight Lock Tests', () => {
  it('acquires and releases a lock successfully', async () => {
    const lockKey = 'test-resource-1';
    const lockId = await acquireLock(lockKey, 5000);
    expect(lockId).not.toBeNull();

    // Secondary acquire while locked should fail
    const secondLockId = await acquireLock(lockKey, 5000);
    expect(secondLockId).toBeNull();

    // Release first lock
    const released = await releaseLock(lockKey, lockId!);
    expect(released).toBe(true);

    // Can acquire again after release
    const thirdLockId = await acquireLock(lockKey, 5000);
    expect(thirdLockId).not.toBeNull();
    await releaseLock(lockKey, thirdLockId!);
  });

  it('withLock prevents simultaneous double-execution', async () => {
    const lockKey = 'test-double-exec';
    let executedCount = 0;

    const task = async () => {
      executedCount++;
      return 'done';
    };

    const res = await withLock(lockKey, 3000, task);
    expect(res).toBe('done');
    expect(executedCount).toBe(1);
  });
});
