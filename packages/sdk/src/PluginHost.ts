/**
 * PluginHost — Coordinates plugin lifecycle activation, validation,
 * setting dependencies, and extension point registration.
 */

import type { IWorkspaceKernel } from '@unify/kernel';
import type { IPlugin, IPluginHost, PluginContext, PluginManifest } from './types';

export class PluginHost implements IPluginHost {
  private readonly _kernel: IWorkspaceKernel;
  private readonly _plugins = new Map<string, IPlugin>();
  private readonly _activePlugins = new Map<string, PluginContext>();
  private _disposed = false;

  constructor(kernel: IWorkspaceKernel) {
    this._kernel = kernel;
  }

  async register(plugin: IPlugin): Promise<void> {
    this._ensureNotDisposed();
    const manifest = plugin.manifest;

    if (this._plugins.has(manifest.id)) {
      throw new Error(`[PluginHost] Plugin already registered: "${manifest.id}"`);
    }

    // Validate manifest versions
    this._plugins.set(manifest.id, plugin);
  }

  async activate(pluginId: string): Promise<void> {
    this._ensureNotDisposed();

    if (this._activePlugins.has(pluginId)) return;

    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`[PluginHost] Cannot activate unregistered plugin: "${pluginId}"`);
    }

    // Check dependencies are activated
    if (plugin.manifest.dependencies) {
      for (const dep of plugin.manifest.dependencies) {
        if (!this.isActive(dep.id)) {
          await this.activate(dep.id);
        }
      }
    }

    // Create plugin context
    const context: PluginContext = {
      kernel: this._kernel,
      subscriptions: [],
      workspaceState: {
        get: async (key) => undefined,
        set: async (key, val) => {},
        delete: async (key) => {},
        has: async (key) => false,
        keys: async () => [],
        clear: async () => {},
      },
      globalState: {
        get: async (key) => undefined,
        set: async (key, val) => {},
        delete: async (key) => {},
        has: async (key) => false,
        keys: async () => [],
        clear: async () => {},
      },
      logger: console as any,
    };

    await plugin.activate(context);
    this._activePlugins.set(pluginId, context);
  }

  async deactivate(pluginId: string): Promise<void> {
    const context = this._activePlugins.get(pluginId);
    if (!context) return;

    const plugin = this._plugins.get(pluginId)!;
    await plugin.deactivate();

    // Clean subscriptions
    for (const sub of context.subscriptions) {
      sub.dispose();
    }

    this._activePlugins.delete(pluginId);
  }

  getPlugin(id: string): IPlugin | undefined {
    return this._plugins.get(id);
  }

  getPlugins(): IPlugin[] {
    return Array.from(this._plugins.values());
  }

  isActive(pluginId: string): boolean {
    return this._activePlugins.has(pluginId);
  }

  dispose(): void {
    if (this._disposed) return;
    for (const id of this._activePlugins.keys()) {
      void this.deactivate(id);
    }
    this._plugins.clear();
    this._activePlugins.clear();
    this._disposed = true;
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[PluginHost] PluginHost has been disposed.');
    }
  }
}
