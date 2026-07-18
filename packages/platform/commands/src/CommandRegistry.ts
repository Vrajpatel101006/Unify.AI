/**
 * CommandRegistry — Enhanced command system with undo/redo and keybindings.
 */

import type { Disposable } from '@unify/kernel';
import type {
  Command,
  CommandGroup,
  CommandHistoryEntry,
  ICommandRegistry,
  UndoableCommand,
} from './types';

export class CommandRegistry implements ICommandRegistry {
  private readonly _commands = new Map<string, Command>();
  private readonly _groups = new Map<string, CommandGroup>();
  private readonly _keybindings = new Map<string, string>(); // keybinding → commandId
  private readonly _reverseKeybindings = new Map<string, string>(); // commandId → keybinding
  private readonly _undoStack: UndoableCommand[] = [];
  private readonly _redoStack: UndoableCommand[] = [];
  private readonly _history: CommandHistoryEntry[] = [];
  private static readonly MAX_HISTORY = 100;
  private _disposed = false;

  register(command: Command): Disposable {
    this._ensureNotDisposed();
    this._commands.set(command.id, command);

    if (command.keybinding) {
      this.bindKey(command.id, command.keybinding);
    }

    return {
      dispose: () => {
        this._commands.delete(command.id);
        if (command.keybinding) {
          this._keybindings.delete(command.keybinding);
          this._reverseKeybindings.delete(command.id);
        }
      },
    };
  }

  registerGroup(group: CommandGroup): void {
    this._ensureNotDisposed();
    this._groups.set(group.id, group);
  }

  async execute(id: string, ...args: unknown[]): Promise<unknown> {
    this._ensureNotDisposed();
    const command = this._commands.get(id);
    if (!command) {
      throw new Error(`[CommandRegistry] Command not found: "${id}"`);
    }

    const result = await command.execute(...args);

    this._addToHistory({
      commandId: id,
      timestamp: Date.now(),
      args,
      undone: false,
    });

    return result;
  }

  async executeUndoable(command: UndoableCommand): Promise<void> {
    this._ensureNotDisposed();
    await command.execute();
    this._undoStack.push(command);
    // Clear redo stack when new undoable command is executed
    this._redoStack.length = 0;

    this._addToHistory({
      commandId: command.id,
      timestamp: Date.now(),
      undone: false,
    });
  }

  async undo(): Promise<void> {
    const command = this._undoStack.pop();
    if (!command) return;

    await command.undo();
    this._redoStack.push(command);
  }

  async redo(): Promise<void> {
    const command = this._redoStack.pop();
    if (!command) return;

    await command.redo();
    this._undoStack.push(command);
  }

  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  getCommand(id: string): Command | undefined {
    return this._commands.get(id);
  }

  getCommands(category?: string): Command[] {
    const all = Array.from(this._commands.values());
    if (!category) return all;
    return all.filter((c) => c.category === category);
  }

  getGroups(): CommandGroup[] {
    return Array.from(this._groups.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getHistory(): CommandHistoryEntry[] {
    return [...this._history];
  }

  bindKey(commandId: string, keybinding: string): void {
    this._ensureNotDisposed();
    // Remove old binding if exists
    const oldBinding = this._reverseKeybindings.get(commandId);
    if (oldBinding) {
      this._keybindings.delete(oldBinding);
    }

    this._keybindings.set(keybinding, commandId);
    this._reverseKeybindings.set(commandId, keybinding);
  }

  getKeybinding(commandId: string): string | undefined {
    return this._reverseKeybindings.get(commandId);
  }

  getCommandByKeybinding(keybinding: string): Command | undefined {
    const commandId = this._keybindings.get(keybinding);
    if (!commandId) return undefined;
    return this._commands.get(commandId);
  }

  dispose(): void {
    if (this._disposed) return;
    this._commands.clear();
    this._groups.clear();
    this._keybindings.clear();
    this._reverseKeybindings.clear();
    this._undoStack.length = 0;
    this._redoStack.length = 0;
    this._history.length = 0;
    this._disposed = true;
  }

  private _addToHistory(entry: CommandHistoryEntry): void {
    this._history.push(entry);
    if (this._history.length > CommandRegistry.MAX_HISTORY) {
      this._history.shift();
    }
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[CommandRegistry] Cannot use a disposed CommandRegistry.');
    }
  }
}
