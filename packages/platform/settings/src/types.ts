/**
 * @unify/platform-settings — Settings architecture with schema, layered scopes, and validation.
 */

import type { Disposable } from '@unify/kernel';

export enum SettingsScope {
  Default = 'default',
  User = 'user',
  Workspace = 'workspace',
}

export type SettingType = 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';

export interface SettingsSchema {
  key: string;
  title: string;
  description: string;
  type: SettingType;
  defaultValue: unknown;
  category: string;
  enumValues?: string[];
  validation?: (value: unknown) => boolean;
}

export interface ISettingsManager {
  get<T>(key: string): T;
  set(key: string, value: unknown, scope?: SettingsScope): void;
  getSchema(): SettingsSchema[];
  registerSchema(schema: SettingsSchema): void;
  onDidChange(key: string, handler: (value: unknown) => void): Disposable;
  reset(key: string, scope?: SettingsScope): void;
  export(): Record<string, unknown>;
  import(settings: Record<string, unknown>): void;
  getScope(key: string): SettingsScope;
}
