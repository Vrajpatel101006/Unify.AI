import { describe, it, expect } from 'vitest';
import { NotificationService } from '../src';

describe('NotificationService', () => {
  it('should show notifications and broadcast them to listeners', () => {
    const svc = new NotificationService();
    const events: any[] = [];
    svc.onNotification((n) => {
      events.push(n);
    });

    const id = svc.show({
      type: 'success',
      title: 'Database connection established',
    });

    expect(id).toBeDefined();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe(id);
    expect(events[0].type).toBe('success');
    expect(svc.getHistory().length).toBe(1);
  });
});
