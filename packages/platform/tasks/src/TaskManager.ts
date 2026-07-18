/**
 * TaskManager — Manages and schedules background tasks.
 *
 * Prevents blocking the main UI thread during intensive operations.
 * Supports task progress tracking, cancellation, and cron scheduling.
 */

import type { Disposable } from '@unify/kernel';
import { generateId } from '@unify/shared';
import type {
  BackgroundTask,
  CancellationToken,
  ITaskManager,
  ProgressReporter,
  ScheduledTask,
  TaskHandle,
  TaskInfo,
  TaskProgress,
} from './types';

export class TaskManager implements ITaskManager {
  private readonly _tasks = new Map<string, TaskInfo>();
  private readonly _cancelTokens = new Map<string, { cancel: () => void; token: CancellationToken }>();
  private readonly _progressListeners = new Map<string, Set<(progress: TaskProgress) => void>>();
  private readonly _completeListeners = new Set<(info: TaskInfo) => void>();
  private readonly _scheduledIntervals = new Map<string, NodeJS.Timeout>();
  private _disposed = false;

  run<T>(task: BackgroundTask<T>): TaskHandle<T> {
    this._ensureNotDisposed();

    const taskId = task.id || generateId();
    const progressListeners = new Set<(progress: TaskProgress) => void>();
    this._progressListeners.set(taskId, progressListeners);

    const taskInfo: TaskInfo = {
      id: taskId,
      title: task.title,
      status: 'running',
      startedAt: Date.now(),
      progress: { percentage: 0 },
    };
    this._tasks.set(taskId, taskInfo);

    // Setup cancellation token
    let isCancelled = false;
    const cancelCallbacks = new Set<() => void>();
    const cancelToken: CancellationToken = {
      get isCancelled() {
        return isCancelled;
      },
      onCancelled: (cb) => {
        cancelCallbacks.add(cb);
        return {
          dispose: () => {
            cancelCallbacks.delete(cb);
          },
        };
      },
    };

    const cancel = () => {
      if (isCancelled || taskInfo.status !== 'running') return;
      isCancelled = true;
      taskInfo.status = 'cancelled';
      taskInfo.completedAt = Date.now();
      for (const cb of cancelCallbacks) {
        try {
          cb();
        } catch (err) {
          console.error(`[TaskManager] Error running cancellation callback for task "${taskId}":`, err);
        }
      }
      this._notifyCompletion(taskInfo);
    };

    this._cancelTokens.set(taskId, { cancel, token: cancelToken });

    // Progress reporter
    const reporter: ProgressReporter = {
      report: (progress) => {
        if (taskInfo.status !== 'running') return;
        taskInfo.progress = progress;
        for (const listener of progressListeners) {
          try {
            listener(progress);
          } catch {
            // Swallow
          }
        }
      },
    };

    const promise = (async () => {
      // Defer execution slightly to allow synchronous registration of progress handlers
      await Promise.resolve();

      if (isCancelled) {
        throw new Error('Task was cancelled');
      }

      try {
        const result = await task.execute(reporter, cancelToken);
        
        if (isCancelled || taskInfo.status === 'cancelled') {
          throw new Error('Task was cancelled');
        }

        if (taskInfo.status === 'running') {
          taskInfo.status = 'completed';
          taskInfo.progress = { percentage: 100, message: 'Completed' };
          taskInfo.completedAt = Date.now();
          this._notifyCompletion(taskInfo);
        }
        return result;
      } catch (err) {
        if (isCancelled || taskInfo.status === 'cancelled') {
          // Ensure it rejects on cancellation
          taskInfo.status = 'cancelled';
          this._notifyCompletion(taskInfo);
          throw new Error('Task was cancelled');
        }
        if (taskInfo.status === 'running') {
          taskInfo.status = 'failed';
          taskInfo.error = err instanceof Error ? err.message : String(err);
          taskInfo.completedAt = Date.now();
          this._notifyCompletion(taskInfo);
        }
        throw err;
      } finally {
        this._cleanupTask(taskId);
      }
    })();

    const handle: TaskHandle<T> = {
      id: taskId,
      promise,
      cancel,
      onProgress: (handler) => {
        progressListeners.add(handler);
        return {
          dispose: () => {
            progressListeners.delete(handler);
          },
        };
      },
    };

    return handle;
  }

  schedule(task: ScheduledTask): TaskHandle<void> {
    this._ensureNotDisposed();

    const taskId = task.id || generateId();
    const intervalMs = task.intervalMs || 60000; // Default to 1 min

    const runScheduled = async () => {
      const scheduledBgTask: BackgroundTask<void> = {
        id: `${taskId}-run-${Date.now()}`,
        title: `Scheduled Run: ${task.title}`,
        cancellable: true,
        execute: async () => {
          await task.execute();
        },
      };
      try {
        await this.run(scheduledBgTask).promise;
      } catch (err) {
        console.error(`[TaskManager] Error running scheduled task "${taskId}":`, err);
      }
    };

    const intervalId = setInterval(runScheduled, intervalMs);
    this._scheduledIntervals.set(taskId, intervalId);

    const handle: TaskHandle<void> = {
      id: taskId,
      promise: Promise.resolve(),
      cancel: () => this.cancel(taskId),
      onProgress: () => ({ dispose: () => {} }),
    };

    return handle;
  }

  cancel(taskId: string): void {
    // Check scheduled intervals first
    if (this._scheduledIntervals.has(taskId)) {
      clearInterval(this._scheduledIntervals.get(taskId)!);
      this._scheduledIntervals.delete(taskId);
      return;
    }

    const tokenEntry = this._cancelTokens.get(taskId);
    if (tokenEntry) {
      tokenEntry.cancel();
    }
  }

  getRunningTasks(): TaskInfo[] {
    return Array.from(this._tasks.values()).filter((t) => t.status === 'running');
  }

  getTask(taskId: string): TaskInfo | undefined {
    return this._tasks.get(taskId);
  }

  onTaskComplete(handler: (info: TaskInfo) => void): Disposable {
    this._completeListeners.add(handler);
    return {
      dispose: () => {
        this._completeListeners.delete(handler);
      },
    };
  }

  dispose(): void {
    if (this._disposed) return;

    // Cancel all running tasks
    for (const entry of this._cancelTokens.values()) {
      entry.cancel();
    }

    // Clear all intervals
    for (const interval of this._scheduledIntervals.values()) {
      clearInterval(interval);
    }

    this._tasks.clear();
    this._cancelTokens.clear();
    this._progressListeners.clear();
    this._completeListeners.clear();
    this._scheduledIntervals.clear();
    this._disposed = true;
  }

  private _cleanupTask(taskId: string): void {
    this._cancelTokens.delete(taskId);
    this._progressListeners.delete(taskId);
  }

  private _notifyCompletion(info: TaskInfo): void {
    for (const listener of this._completeListeners) {
      try {
        listener(info);
      } catch {
        // Swallow
      }
    }
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[TaskManager] TaskManager has been disposed.');
    }
  }
}
