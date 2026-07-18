import { describe, it, expect, vi } from 'vitest';
import { SettingsManager, SettingsScope } from '../src';

describe('SettingsManager', () => {
  it('should support registering schemas and reading default values', () => {
    const manager = new SettingsManager();
    manager.registerSchema({
      key: 'editor.tabSize',
      title: 'Tab Size',
      description: 'Size of editor tabs',
      type: 'number',
      defaultValue: 4,
      category: 'editor',
    });

    expect(manager.get<number>('editor.tabSize')).toBe(4);
  });

  it('should resolve settings based on scope hierarchy', () => {
    const manager = new SettingsManager();
    manager.registerSchema({
      key: 'theme',
      title: 'Theme',
      description: 'Color theme',
      type: 'string',
      defaultValue: 'dark',
      category: 'appearance',
    });

    // Default: 'dark'
    expect(manager.get<string>('theme')).toBe('dark');

    // Override at User scope
    manager.set('theme', 'light', SettingsScope.User);
    expect(manager.get<string>('theme')).toBe('light');

    // Override at Workspace scope (highest precedence)
    manager.set('theme', 'custom-dark', SettingsScope.Workspace);
    expect(manager.get<string>('theme')).toBe('custom-dark');

    // Resetting workspace scope falls back to user scope
    manager.reset('theme', SettingsScope.Workspace);
    expect(manager.get<string>('theme')).toBe('light');
  });

  it('should trigger change listeners only on resolved value change', () => {
    const manager = new SettingsManager();
    manager.registerSchema({
      key: 'enableTelemetry',
      title: 'Telemetry',
      description: 'Enable telemetry',
      type: 'boolean',
      defaultValue: false,
      category: 'telemetry',
    });

    const mockListener = vi.fn();
    manager.onDidChange('enableTelemetry', mockListener);

    // Setting same value doesn't trigger
    manager.set('enableTelemetry', false, SettingsScope.User);
    expect(mockListener).not.toHaveBeenCalled();

    // Setting different value triggers
    manager.set('enableTelemetry', true, SettingsScope.User);
    expect(mockListener).toHaveBeenCalledWith(true);
  });
});
