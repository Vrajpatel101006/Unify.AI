/**
 * @unify/platform-commands
 *
 * Enhanced Command Registry with undo/redo, history, groups,
 * keybindings, permissions, and categories.
 */

import type { Disposable } from '@unify/kernel';
import type { WorkspaceContext } from '@unify/platform-context';

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export enum CommandCategory {
  AI = 'AI',
  Git = 'Git',
  Repository = 'Repository',
  Workspace = 'Workspace',
  Navigation = 'Navigation',
  Documentation = 'Documentation',
  Database = 'Database',
  API = 'API',
  Settings = 'Settings',
  Plugins = 'Plugins'
}

export type CommandCapability = 
  | 'RepositoryOpen'
  | 'GitInstalled'
  | 'GitHubConnected'
  | 'AIProviderConfigured'
  | 'DatabaseConnected';

// Stub for the unified workspace session that will be built later
export interface WorkspaceSession {
  // To be expanded
  [key: string]: any;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  duration: number;
  refresh?: string[]; // scopes to refresh
}

export interface Command {
  id: string;
  title: string;
  description: string;
  category: CommandCategory | string;
  keywords?: string[];
  aliases?: string[];
  icon?: string;
  keybinding?: string; // e.g. 'ctrl+k'
  shortcut?: string; // alias for display purposes e.g. '⌘K'
  priority?: number;
  requiresConfirmation?: boolean;
  estimatedDuration?: 'instant' | 'short' | 'long';
  requiredCapabilities?: CommandCapability[];
  /** Context expression — command is only available when this evaluates to true. */
  when?: string;
  /** Required permission to execute this command. */
  permission?: string;
  isEnabled?: (context?: WorkspaceSession) => boolean;
  execute(context?: WorkspaceSession, ...args: unknown[]): Promise<CommandResult | void | unknown>;
}

export interface UndoableCommand extends Command {
  undo(): Promise<void>;
  redo(): Promise<void>;
}

export interface CommandGroup {
  id: string;
  title: string;
  order?: number;
}

export interface CommandHistoryEntry {
  commandId: string;
  timestamp: number;
  args?: unknown[];
  undone: boolean;
}

// ---------------------------------------------------------------------------
// Command Registry Interface
// ---------------------------------------------------------------------------

export interface ICommandRegistry extends Disposable {
  // Registration
  register(command: Command): Disposable;
  registerGroup(group: CommandGroup): void;

  // Execution
  execute(id: string, context?: WorkspaceContext, ...args: unknown[]): Promise<unknown>;
  executeUndoable(command: UndoableCommand): Promise<void>;

  // Undo/Redo
  undo(): Promise<void>;
  redo(): Promise<void>;
  canUndo(): boolean;
  canRedo(): boolean;

  // Query
  getCommand(id: string): Command | undefined;
  getCommands(category?: string): Command[];
  getGroups(): CommandGroup[];
  getHistory(): CommandHistoryEntry[];

  // Keybindings
  bindKey(commandId: string, keybinding: string): void;
  getKeybinding(commandId: string): string | undefined;
  getCommandByKeybinding(keybinding: string): Command | undefined;

  // Lifecycle
  dispose(): void;
}
