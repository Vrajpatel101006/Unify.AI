import { describe, it, expect, vi } from 'vitest';
import { TaskManager } from '../src';
import type { BackgroundTask } from '../src/types';

describe('TaskManager', () => {
  it('should run background tasks and track progress', async () => {
    const manager = new TaskManager();
    const mockProgress = vi.fn();

    const task: BackgroundTask<number> = {
      id: 'task.add',
      title: 'Adding numbers',
      cancellable: true,
      execute: async (progress) => {
        progress.report({ percentage: 50, message: 'Halfway' });
        return 10 + 20;
      }
    };

    const handle = manager.run(task);
    handle.onProgress(mockProgress);

    const result = await handle.promise;
    expect(result).toBe(30);
    expect(mockProgress).toHaveBeenCalledWith({ percentage: 50, message: 'Halfway' });
  });

  it('should support task cancellation', async () => {
    const manager = new TaskManager();
    const mockCancelCb = vi.fn();

    const task: BackgroundTask<void> = {
      id: 'task.cancel',
      title: 'Cancellable Task',
      cancellable: true,
      execute: async (progress, token) => {
        token.onCancelled(mockCancelCb);
        // Wait or loop
        while (!token.isCancelled) {
          await new Promise((r) => setTimeout(r, 5));
        }
      }
    };

    const handle = manager.run(task);
    setTimeout(() => {
      handle.cancel();
    }, 10);

    await expect(handle.promise).rejects.toThrow();
    expect(mockCancelCb).toHaveBeenCalledTimes(1);
    expect(manager.getTask('task.cancel')?.status).toBe('cancelled');
  });
});
