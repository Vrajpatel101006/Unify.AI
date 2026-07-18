import { describe, it, expect, vi } from 'vitest';
import { AIRouter, PromptEngine, ToolCallingEngine } from '../src';
import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate } from '../src/types';

class MockProvider implements IAIProvider {
  constructor(public id: string, public name: string, public capabilities: any[]) {}
  async sendMessage(req: AIRequest): Promise<AIResponse> {
    return {
      id: 'mock-resp',
      content: 'Hello World',
      model: 'mock-model',
      provider: this.id,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      finishReason: 'stop',
      latencyMs: 100
    };
  }
  async *streamMessage(req: AIRequest): AsyncIterable<AIStreamChunk> {
    yield { id: 'chunk', delta: 'Hello', done: false };
    yield { id: 'chunk', delta: ' World', done: true };
  }
  async getModels(): Promise<AIModel[]> { return []; }
  async validateConfig(): Promise<boolean> { return true; }
  estimateCost(req: AIRequest): CostEstimate {
    return { estimatedCost: 0.001, currency: 'USD', promptTokens: 10, completionTokens: 10 };
  }
}

describe('AIRouter', () => {
  it('should route to the preferred provider if registered', async () => {
    const router = new AIRouter();
    const p1 = new MockProvider('openai', 'OpenAI', ['chat']);
    const p2 = new MockProvider('claude', 'Anthropic Claude', ['chat']);
    router.registerProvider(p1);
    router.registerProvider(p2);

    const provider = await router.route({ type: 'chat', preferredProvider: 'claude' });
    expect(provider.id).toBe('claude');
  });

  it('should support default routing and capabilities selection', async () => {
    const router = new AIRouter();
    const p1 = new MockProvider('openai', 'OpenAI', ['chat']);
    router.registerProvider(p1);
    router.setDefaultProvider('openai');

    const provider = await router.route({ type: 'chat', requiredCapabilities: ['chat'] });
    expect(provider.id).toBe('openai');
  });
});

describe('PromptEngine', () => {
  it('should build prompt templates replacing variable tokens', () => {
    const engine = new PromptEngine();
    engine.registerTemplate({
      id: 'sql.generate',
      name: 'SQL Generator',
      category: 'sql',
      userPromptTemplate: 'Generate SQL for table {{table}} with schema: {{schema}}',
      variables: [
        { name: 'table', description: 'Table name', required: true },
        { name: 'schema', description: 'Table schema description', required: false, defaultValue: 'id INT' },
      ],
      version: '1.0.0',
    });

    const prompt1 = engine.buildPrompt('sql.generate', { table: 'users', schema: 'id INT, name TEXT' });
    expect(prompt1).toBe('Generate SQL for table users with schema: id INT, name TEXT');

    // Test default fallback
    const prompt2 = engine.buildPrompt('sql.generate', { table: 'users' });
    expect(prompt2).toBe('Generate SQL for table users with schema: id INT');
  });
});

describe('ToolCallingEngine', () => {
  it('should register and execute tool dispatchers', async () => {
    const engine = new ToolCallingEngine();
    const mockHandler = vi.fn().mockResolvedValue({ toolCallId: 'call-1', content: 'Result is 15', isError: false });

    engine.registerTool({
      name: 'add_numbers',
      description: 'Add numbers',
      parameters: [],
      handler: mockHandler,
    });

    const result = await engine.executeTool({ id: 'call-1', name: 'add_numbers', arguments: { a: 5, b: 10 } });
    expect(result.content).toBe('Result is 15');
    expect(mockHandler).toHaveBeenCalledWith({ a: 5, b: 10 });
  });
});
