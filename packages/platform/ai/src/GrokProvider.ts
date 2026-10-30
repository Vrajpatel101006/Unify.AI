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
    
    // Fallback to absolute URL if running in Electron
    const baseUrl = typeof window !== 'undefined' && window.location.protocol === 'file:' 
      ? 'http://localhost:5167' 
      : '';
    const url = `${baseUrl}/api/ai/complete`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        providerId: this.id,
        model: model,
        messages: request.messages,
        maxTokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
        topP: request.topP ?? 0.95
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Grok Proxy Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    return {
      id: `grok-${Date.now()}`,
      content: data.content || '',
      model: model,
      provider: this.name,
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
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
