/**
 * @unify/platform-notifications — Toast notifications and notification center.
 */

import type { Disposable } from '@unify/kernel';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  action: () => void;
  isPrimary?: boolean;
}

export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss ms. 0 = sticky.
  actions?: NotificationAction[];
  source?: string;  // Plugin ID or module name
  timestamp?: number;
}

export interface INotificationService {
  show(notification: Notification): string;
  dismiss(id: string): void;
  getHistory(): Notification[];
  clearHistory(): void;
  onNotification(handler: (n: Notification) => void): Disposable;
  dispose(): void;
}
