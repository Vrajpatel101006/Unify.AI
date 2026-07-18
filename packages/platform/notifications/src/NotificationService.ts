/**
 * NotificationService — coordinates toast notifications.
 */

import type { Disposable } from '@unify/kernel';
import { generateId } from '@unify/shared';
import type { INotificationService, Notification } from './types';

export class NotificationService implements INotificationService {
  private readonly _history: Notification[] = [];
  private readonly _listeners = new Set<(notification: Notification) => void>();
  private _disposed = false;
  private static readonly MAX_HISTORY = 200;

  show(notification: Notification): string {
    this._ensureNotDisposed();

    const id = notification.id || generateId();
    const entry: Notification = {
      ...notification,
      id,
      timestamp: notification.timestamp || Date.now(),
    };

    this._history.push(entry);
    if (this._history.length > NotificationService.MAX_HISTORY) {
      this._history.shift();
    }

    // Trigger listeners
    for (const listener of this._listeners) {
      try {
        listener(entry);
      } catch {
        // Swallow
      }
    }

    return id;
  }

  dismiss(id: string): void {
    const idx = this._history.findIndex((n) => n.id === id);
    if (idx !== -1) {
      // In a real toast app we trigger a dismiss animation; here we just flag it
      this._history.splice(idx, 1);
    }
  }

  getHistory(): Notification[] {
    return [...this._history];
  }

  clearHistory(): void {
    this._history.length = 0;
  }

  onNotification(handler: (n: Notification) => void): Disposable {
    this._listeners.add(handler);
    return {
      dispose: () => {
        this._listeners.delete(handler);
      },
    };
  }

  dispose(): void {
    if (this._disposed) return;
    this._history.length = 0;
    this._listeners.clear();
    this._disposed = true;
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[NotificationService] NotificationService has been disposed.');
    }
  }
}
