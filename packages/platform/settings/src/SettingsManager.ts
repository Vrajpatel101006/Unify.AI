/**
 * SettingsManager — Layered configuration management.
 *
 * Scopes: Default → User (Global) → Workspace (Local Project settings).
 * Settings are validated against a registered schema.
 */

import type { Disposable } from '@unify/kernel';
import type { ISettingsManager, SettingsSchema } from './types';
import { SettingsScope } from './types';

export class SettingsManager implements ISettingsManager {
  private readonly _schemas = new Map<string, SettingsSchema>();
  private readonly _values = new Map<SettingsScope, Map<string, unknown>>();
  private readonly _listeners = new Map<string, Set<(value: unknown) => void>>();

  constructor() {
    this._values.set(SettingsScope.Default, new Map());
    this._values.set(SettingsScope.User, new Map());
    this._values.set(SettingsScope.Workspace, new Map());
  }

  registerSchema(schema: SettingsSchema): void {
    this._schemas.set(schema.key, schema);
    // Set default value in the default scope map
    this._values.get(SettingsScope.Default)!.set(schema.key, schema.defaultValue);
  }

  get<T>(key: string): T {
    // Resolve layered values: Workspace (highest priority) -> User -> Default (lowest)
    const workspaceVal = this._values.get(SettingsScope.Workspace)!.get(key);
    if (workspaceVal !== undefined) return workspaceVal as T;

    const userVal = this._values.get(SettingsScope.User)!.get(key);
    if (userVal !== undefined) return userVal as T;

    const defaultVal = this._values.get(SettingsScope.Default)!.get(key);
    if (defaultVal !== undefined) return defaultVal as T;

    throw new Error(`[SettingsManager] Configuration key not registered: "${key}"`);
  }

  set(key: string, value: unknown, scope: SettingsScope = SettingsScope.User): void {
    const schema = this._schemas.get(key);
    if (!schema) {
      throw new Error(`[SettingsManager] Cannot set unregistered setting: "${key}"`);
    }

    // Validate type and custom validation if present
    if (!this._validateType(value, schema.type)) {
      throw new Error(`[SettingsManager] Type mismatch for setting "${key}". Expected ${schema.type}.`);
    }
    if (schema.enumValues && !schema.enumValues.includes(value as string)) {
      throw new Error(`[SettingsManager] Value "${value}" not allowed for enum setting "${key}". Allowed: ${schema.enumValues.join(', ')}`);
    }
    if (schema.validation && !schema.validation(value)) {
      throw new Error(`[SettingsManager] Validation failed for setting "${key}" with value: ${JSON.stringify(value)}`);
    }

    const previousValue = this.get(key);
    this._values.get(scope)!.set(key, value);
    const newValue = this.get(key);

    // Notify listeners if resolved value changed
    if (previousValue !== newValue) {
      const handlers = this._listeners.get(key);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(newValue);
          } catch (err) {
            console.error(`[SettingsManager] Error in change listener for "${key}":`, err);
          }
        }
      }
    }
  }

  reset(key: string, scope: SettingsScope = SettingsScope.User): void {
    const previousValue = this.get(key);
    this._values.get(scope)!.delete(key);
    const newValue = this.get(key);

    if (previousValue !== newValue) {
      const handlers = this._listeners.get(key);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(newValue);
          } catch {
            // Swallow
          }
        }
      }
    }
  }

  getSchema(): SettingsSchema[] {
    return Array.from(this._schemas.values());
  }

  onDidChange(key: string, handler: (value: unknown) => void): Disposable {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    const handlers = this._listeners.get(key)!;
    handlers.add(handler);

    return {
      dispose: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this._listeners.delete(key);
        }
      },
    };
  }

  getScope(key: string): SettingsScope {
    if (this._values.get(SettingsScope.Workspace)!.has(key)) return SettingsScope.Workspace;
    if (this._values.get(SettingsScope.User)!.has(key)) return SettingsScope.User;
    return SettingsScope.Default;
  }

  export(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of this._schemas.keys()) {
      result[key] = this.get(key);
    }
    return result;
  }

  import(settings: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(settings)) {
      if (this._schemas.has(key)) {
        try {
          this.set(key, value, SettingsScope.User);
        } catch (err) {
          console.warn(`[SettingsManager] Failed to import setting "${key}":`, err);
        }
      }
    }
  }

  private _validateType(value: unknown, type: string): boolean {
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    if (type === 'enum') return typeof value === 'string';
    return typeof value === type;
  }
}
