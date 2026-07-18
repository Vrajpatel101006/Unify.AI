/**
 * ToolCallingEngine — Coordinates register and execute cycles of API tools.
 */

import type { Disposable } from '@unify/kernel';
import type { IToolCallingEngine, ToolCall, ToolDefinition, ToolResult } from './types';

export class ToolCallingEngine implements IToolCallingEngine {
  private readonly _tools = new Map<string, ToolDefinition>();

  registerTool(tool: ToolDefinition): Disposable {
    if (this._tools.has(tool.name)) {
      throw new Error(`[ToolCallingEngine] Tool already registered: "${tool.name}"`);
    }

    this._tools.set(tool.name, tool);
    return {
      dispose: () => {
        this._tools.delete(tool.name);
      },
    };
  }

  async executeTool(call: ToolCall): Promise<ToolResult> {
    const tool = this._tools.get(call.name);
    if (!tool) {
      return {
        toolCallId: call.id,
        content: `Error: Tool "${call.name}" not found.`,
        isError: true,
      };
    }

    if (!tool.handler) {
      return {
        toolCallId: call.id,
        content: `Error: Tool "${call.name}" is declared but has no executor handler registered.`,
        isError: true,
      };
    }

    try {
      const result = await tool.handler(call.arguments);
      return result;
    } catch (err) {
      return {
        toolCallId: call.id,
        content: `Error: Tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  }

  getTools(): ToolDefinition[] {
    return Array.from(this._tools.values());
  }

  getToolsByCapability(capability: string): ToolDefinition[] {
    // Basic filter
    return this.getTools();
  }

  hasTool(name: string): boolean {
    return this._tools.has(name);
  }
}
