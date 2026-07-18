import type { Disposable, IWorkspaceKernel } from '@unify/kernel';
import type { IStorageService } from '@unify/platform-storage';
import type { ILogger } from '@unify/platform-logging';

export type PluginCategory = 'editor' | 'ai' | 'database' | 'api' | 'documentation' | 'utility';

export interface PluginDependency {
  id: string;
  version: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon: string;
  category: PluginCategory;
  dependencies?: PluginDependency[];
  platformVersion: string;
}

export interface PluginContext {
  kernel: IWorkspaceKernel;
  subscriptions: Disposable[];
  workspaceState: IStorageService;
  globalState: IStorageService;
  logger: ILogger;
}

export interface IPlugin {
  manifest: PluginManifest;
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
}

export interface IPluginHost {
  register(plugin: IPlugin): Promise<void>;
  activate(pluginId: string): Promise<void>;
  deactivate(pluginId: string): Promise<void>;
  getPlugin(id: string): IPlugin | undefined;
  getPlugins(): IPlugin[];
  isActive(pluginId: string): boolean;
}
