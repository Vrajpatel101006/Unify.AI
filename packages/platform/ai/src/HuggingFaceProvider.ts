import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate, AICapability } from './types';

export class HuggingFaceProvider implements IAIProvider {
  readonly id = 'huggingface';
  readonly name = 'Hugging Face Inference';
  readonly capabilities: AICapability[] = ['chat', 'code'];
  
  private readonly _apiKey: string;
  // Default to Qwen 2.5 Coder 32B for best coding performance
  private readonly _defaultModel = 'Qwen/Qwen2.5-Coder-32B-Instruct';

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
        maxTokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
        topP: request.topP ?? 0.95
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace Proxy Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    return {
      id: `hf-${Date.now()}`,
      content: data.content || '',
      model: model,
      provider: this.name,
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: 'stop',
      latencyMs: Date.now() - startTime
    };
  }

  async *streamMessage(_request: AIRequest): AsyncIterable<AIStreamChunk> {
    throw new Error('Streaming is not fully implemented in this MVP for HuggingFaceProvider.');
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: this._defaultModel,
        name: 'Qwen 2.5 Coder 32B',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 32768,
        contextWindow: 32768
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        name: 'Llama 3.1 70B',
        provider: this.id,
        capabilities: ['chat'],
        maxTokens: 131072,
        contextWindow: 131072
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
