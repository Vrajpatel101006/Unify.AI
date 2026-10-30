import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate, AICapability } from './types';

export class GeminiProvider implements IAIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly capabilities: AICapability[] = ['chat', 'code'];
  
  private readonly _apiKey: string;
  private readonly _defaultModel = 'gemini-pro';

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = request.model || this._defaultModel;
    
    // Fallback to absolute URL if running in Electron (where relative paths might fail)
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
      throw new Error(`Gemini Proxy Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    return {
      id: `gemini-${Date.now()}`,
      content: data.content || '',
      model: model,
      provider: this.name,
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: 'stop',
      latencyMs: Date.now() - startTime
    };
  }

  async *streamMessage(_request: AIRequest): AsyncIterable<AIStreamChunk> {
    throw new Error('Streaming is not fully implemented in this MVP for GeminiProvider.');
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 8192,
        contextWindow: 2000000
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 8192,
        contextWindow: 1000000
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
