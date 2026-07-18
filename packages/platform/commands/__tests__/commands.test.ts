import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry } from '../src';
import type { UndoableCommand } from '../src/types';

describe('CommandRegistry', () => {
  it('should register and execute commands', async () => {
    const registry = new CommandRegistry();
    const mockFn = vi.fn().mockResolvedValue('success');

    registry.register({
      id: 'cmd.test',
      title: 'Test Command',
      category: 'general',
      execute: mockFn,
    });

    const result = await registry.execute('cmd.test', 1, 2);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith(1, 2);
  });

  it('should support undo/redo', async () => {
    const registry = new CommandRegistry();
    
    let value = 10;
    const undoable: UndoableCommand = {
      id: 'cmd.add',
      title: 'Add',
      category: 'math',
      execute: async () => { value += 5; },
      undo: async () => { value -= 5; },
      redo: async () => { value += 5; },
    };

    await registry.executeUndoable(undoable);
    expect(value).toBe(15);
    expect(registry.canUndo()).toBe(true);

    await registry.undo();
    expect(value).toBe(10);
    expect(registry.canRedo()).toBe(true);

    await registry.redo();
    expect(value).toBe(15);
  });

  it('should manage keybindings', () => {
    const registry = new CommandRegistry();
    registry.register({
      id: 'cmd.save',
      title: 'Save',
      category: 'file',
      keybinding: 'Ctrl+S',
      execute: async () => {},
    });

    expect(registry.getKeybinding('cmd.save')).toBe('Ctrl+S');
    expect(registry.getCommandByKeybinding('Ctrl+S')?.id).toBe('cmd.save');
  });
});
