/**
 * @unify/platform-commands
 *
 * Enhanced Command Registry with undo/redo, history, groups,
 * keybindings, permissions, and categories.
 */

import type { Disposable } from '@unify/kernel';

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export interface Command {
  id: string;
  title: string;
  category: string;
  icon?: string;
  keybinding?: string;
  /** Context expression — command is only available when this evaluates to true. */
  when?: string;
  /** Required permission to execute this command. */
  permission?: string;
  execute(...args: unknown[]): Promise<unknown>;
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

export interface ICommandRegistry {
  // Registration
  register(command: Command): Disposable;
  registerGroup(group: CommandGroup): void;

  // Execution
  execute(id: string, ...args: unknown[]): Promise<unknown>;
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
