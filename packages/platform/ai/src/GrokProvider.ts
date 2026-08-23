import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate, AICapability } from './types';

export class GrokProvider implements IAIProvider {
  readonly id = 'grok';
  readonly name = 'xAI Grok';
  readonly capabilities: AICapability[] = ['chat', 'code'];
  
  private readonly _apiKey: string;
  private readonly _defaultModel = 'grok-beta';

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = request.model || this._defaultModel;
    const url = 'https://api.x.ai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        top_p: request.topP ?? 0.95
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Grok API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    return {
      id: data.id || `grok-${Date.now()}`,
      content: message,
      model: data.model || model,
      provider: this.name,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      finishReason: 'stop',
      latencyMs: Date.now() - startTime
    };
  }

  async *streamMessage(_request: AIRequest): AsyncIterable<AIStreamChunk> {
    throw new Error('Streaming is not fully implemented in this MVP for GrokProvider.');
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 8192,
        contextWindow: 128000
      },
      {
        id: 'grok-vision-beta',
        name: 'Grok Vision Beta',
        provider: this.id,
        capabilities: ['chat'],
        maxTokens: 8192,
        contextWindow: 128000
      }
    ];
  }

  async validateConfig(): Promise<boolean> {
    return !!this._apiKey;
  }

  estimateCost(_request: AIRequest): CostEstimate {
    return {
      estimatedCost: 0,
      currency: 'USD',
      promptTokens: 0,
      completionTokens: 0
    };
  }
}
