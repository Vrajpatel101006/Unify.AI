import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src';

describe('EventBus', () => {
  it('should support priority-based handler execution', async () => {
    const bus = new EventBus();
    const order: number[] = [];

    bus.on('test-event', () => { order.push(1); }, { priority: 10 });
    bus.on('test-event', () => { order.push(2); }, { priority: 20 });
    bus.on('test-event', () => { order.push(3); }, { priority: 5 });

    await bus.emit('test-event', {});
    expect(order).toEqual([2, 1, 3]); // 20 -> 10 -> 5
  });

  it('should support cancellation', async () => {
    const bus = new EventBus();
    bus.on('cancellable', (data: { count: number }) => {
      data.count++;
      return false; // Cancel propagation
    });

    const secondHandler = vi.fn();
    bus.on('cancellable', secondHandler);

    const result = await bus.emitCancellable('cancellable', { count: 0 });
    expect(result.cancelled).toBe(true);
    expect(result.data.count).toBe(1);
    expect(secondHandler).not.toHaveBeenCalled();
  });

  it('should support sticky events', async () => {
    const bus = new EventBus();
    bus.emitSticky('sticky-event', 'payload');

    const mockHandler = vi.fn();
    bus.on('sticky-event', mockHandler);

    expect(mockHandler).toHaveBeenCalledWith('payload');
  });

  it('should run middleware', async () => {
    const bus = new EventBus();
    const tracker: string[] = [];

    bus.use({
      name: 'tracker',
      handle: async (event, data, next) => {
        tracker.push('start');
        await next();
        tracker.push('end');
      }
    });

    bus.on('event', () => {
      tracker.push('handler');
    });

    await bus.emit('event', {});
    expect(tracker).toEqual(['start', 'handler', 'end']);
  });
});
