/**
 * @unify/platform-ai
 *
 * AI Abstraction Layer — Full pipeline:
 * Task → Router → PromptBuilder → Memory → Provider → Validator → Formatter → Response
 *
 * Never hardcode a provider. Every module uses IAIProvider.
 */

import type { Disposable } from '@unify/kernel';
import type { WorkspaceContext } from '@unify/platform-context';

// ---------------------------------------------------------------------------
// AI Provider
// ---------------------------------------------------------------------------

export type AICapability = 'chat' | 'completion' | 'embedding' | 'vision' | 'code' | 'function-calling';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: AICapability[];
  maxTokens: number;
  contextWindow: number;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  custom?: Record<string, unknown>;
}

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AICapability[];

  sendMessage(request: AIRequest): Promise<AIResponse>;
  streamMessage(request: AIRequest): AsyncIterable<AIStreamChunk>;
  getModels(): Promise<AIModel[]>;
  validateConfig(): Promise<boolean>;
  estimateCost(request: AIRequest): CostEstimate;
}

// ---------------------------------------------------------------------------
// AI Request / Response
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  tools?: ToolDefinition[];
  responseFormat?: 'text' | 'json';
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
  latencyMs: number;
}

export interface AIStreamChunk {
  id: string;
  delta: string;
  done: boolean;
  toolCalls?: ToolCall[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  estimatedCost: number;
  currency: string;
  promptTokens: number;
  completionTokens: number;
}

// ---------------------------------------------------------------------------
// AI Router
// ---------------------------------------------------------------------------

export interface IAIRouter {
  route(task: AITask): Promise<IAIProvider>;
  registerProvider(provider: IAIProvider): void;
  removeProvider(id: string): void;
  setDefaultProvider(id: string): void;
  setFallbackChain(providerIds: string[]): void;
  getProviders(): IAIProvider[];
  getDefaultProvider(): IAIProvider | undefined;
}

export interface AITask {
  type: 'chat' | 'code-generation' | 'sql-generation' | 'documentation' | 'analysis' | 'embedding' | 'custom';
  requiredCapabilities?: AICapability[];
  preferredProvider?: string;
  context?: Partial<WorkspaceContext>;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Prompt Engine (Core Service)
// ---------------------------------------------------------------------------

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  variables: PromptVariable[];
  version: string;
}

export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface IPromptEngine {
  registerTemplate(template: PromptTemplate): void;
  getTemplate(id: string): PromptTemplate | undefined;
  buildPrompt(templateId: string, variables: Record<string, unknown>): string;
  getTemplates(category?: string): PromptTemplate[];
  removeTemplate(id: string): void;
}

// ---------------------------------------------------------------------------
// Prompt Builder (Fluent API)
// ---------------------------------------------------------------------------

export interface IPromptBuilder {
  withSystem(content: string): IPromptBuilder;
  withContext(context: Partial<WorkspaceContext>): IPromptBuilder;
  withMemory(memory: ConversationMemory): IPromptBuilder;
  withTemplate(templateId: string, vars: Record<string, unknown>): IPromptBuilder;
  withTools(tools: ToolDefinition[]): IPromptBuilder;
  withMessage(role: AIMessage['role'], content: string): IPromptBuilder;
  build(): AIRequest;
}

export interface ConversationMemory {
  conversationId: string;
  messages: AIMessage[];
  summary?: string;
  tokenCount: number;
}

// ---------------------------------------------------------------------------
// Tool Calling Engine
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler?: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError: boolean;
}

export interface IToolCallingEngine {
  registerTool(tool: ToolDefinition): Disposable;
  executeTool(call: ToolCall): Promise<ToolResult>;
  getTools(): ToolDefinition[];
  getToolsByCapability(capability: string): ToolDefinition[];
  hasTool(name: string): boolean;
}

// ---------------------------------------------------------------------------
// Response Validation & Formatting
// ---------------------------------------------------------------------------

export interface IResponseValidator {
  validate(response: AIResponse, expectedFormat?: string): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface IResponseFormatter {
  format(response: AIResponse, format: 'markdown' | 'json' | 'code' | 'sql' | 'plain'): string;
}
