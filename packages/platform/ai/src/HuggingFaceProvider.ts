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
    const url = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;

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
        max_tokens: request.maxTokens ?? 1024,
        top_p: request.topP ?? 0.95
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || '';

    return {
      id: data.id || `hf-${Date.now()}`,
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
