/**
 * @unify/platform-tasks — Background task manager.
 */

import type { Disposable } from '@unify/kernel';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskProgress {
  percentage: number;
  message?: string;
}

export interface ProgressReporter {
  report(progress: TaskProgress): void;
}

export interface CancellationToken {
  isCancelled: boolean;
  onCancelled(callback: () => void): Disposable;
}

export interface BackgroundTask<T = unknown> {
  id: string;
  title: string;
  cancellable: boolean;
  execute(progress: ProgressReporter, token: CancellationToken): Promise<T>;
}

export interface ScheduledTask {
  id: string;
  title: string;
  cronExpression?: string;
  intervalMs?: number;
  execute(): Promise<void>;
}

export interface TaskInfo {
  id: string;
  title: string;
  status: TaskStatus;
  progress?: TaskProgress;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface TaskHandle<T> {
  id: string;
  promise: Promise<T>;
  cancel(): void;
  onProgress(handler: (progress: TaskProgress) => void): Disposable;
}

export interface ITaskManager {
  run<T>(task: BackgroundTask<T>): TaskHandle<T>;
  schedule(task: ScheduledTask): TaskHandle<void>;
  cancel(taskId: string): void;
  getRunningTasks(): TaskInfo[];
  getTask(taskId: string): TaskInfo | undefined;
  onTaskComplete(handler: (info: TaskInfo) => void): Disposable;
  dispose(): void;
}
