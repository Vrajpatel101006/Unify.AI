import { describe, it, expect, vi } from 'vitest';
import { WorkspaceKernel } from '../src/WorkspaceKernel';
import { ServiceContainer } from '../src/ServiceContainer';
import { WorkspaceLifecycle, WorkspacePhase } from '../src/WorkspaceLifecycle';
import { createServiceToken } from '../src/types';

describe('ServiceContainer', () => {
  it('should register and resolve singletons', () => {
    const container = new ServiceContainer();
    const token = createServiceToken<{ value: number }>('test-token');
    
    let calls = 0;
    container.register(token, () => {
      calls++;
      return { value: 42 };
    });

    const instance1 = container.resolve(token);
    const instance2 = container.resolve(token);

    expect(instance1.value).toBe(42);
    expect(instance2).toBe(instance1); // Same instance
    expect(calls).toBe(1);
  });

  it('should resolve transients individually', () => {
    const container = new ServiceContainer();
    const token = createServiceToken<{ value: number }>('test-token');

    let calls = 0;
    container.register(token, () => {
      calls++;
      return { value: Math.random() };
    }, 'transient');

    const instance1 = container.resolve(token);
    const instance2 = container.resolve(token);

    expect(instance1.value).not.toBe(instance2.value);
    expect(calls).toBe(2);
  });

  it('should dispose dispoasable services on container dispose', () => {
    const container = new ServiceContainer();
    const token = createServiceToken<{ dispose: () => void }>('test-disposable');
    
    const mockDispose = vi.fn();
    container.register(token, () => ({
      dispose: mockDispose
    }));

    // Instantiate it
    container.resolve(token);
    container.dispose();

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });
});

describe('WorkspaceLifecycle', () => {
  it('should transition through phases and notify listeners', async () => {
    const lifecycle = new WorkspaceLifecycle();
    const mockCallback = vi.fn();

    lifecycle.onPhaseChange(mockCallback);

    await lifecycle.transitionTo(WorkspacePhase.Loading);
    expect(lifecycle.getCurrentPhase()).toBe(WorkspacePhase.Loading);
    expect(mockCallback).toHaveBeenCalledWith(WorkspacePhase.Loading);
  });
});

describe('WorkspaceKernel', () => {
  it('should transition to Ready phase on boot', async () => {
    const kernel = new WorkspaceKernel();
    expect(kernel.isBooted()).toBe(false);

    await kernel.boot();
    expect(kernel.isBooted()).toBe(true);
    expect(kernel.lifecycle.getCurrentPhase()).toBe(WorkspacePhase.Ready);

    await kernel.shutdown();
    expect(kernel.isBooted()).toBe(false);
    expect(kernel.lifecycle.getCurrentPhase()).toBe(WorkspacePhase.Disposed);
  });
});
