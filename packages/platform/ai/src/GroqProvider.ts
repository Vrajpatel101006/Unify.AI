import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate, AICapability } from './types';

export class GroqProvider implements IAIProvider {
  readonly id = 'groq';
  readonly name = 'Groq';
  readonly capabilities: AICapability[] = ['chat', 'code'];
  
  private readonly _apiKey: string;
  private readonly _defaultModel = 'openai/gpt-oss-120b';

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = request.model || this._defaultModel;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

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
      let errText = await response.text();
      if (response.status === 404) {
        try {
          const listRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${this._apiKey}` }
          });
          const listData = await listRes.json();
          const validModels = (listData.data || [])
            .map((m: any) => m.id)
            .join(', ');
          errText += `\n\n[DIAGNOSTIC AUTOMATION] I queried Groq's servers. The valid models for your specific API key are:\n${validModels}`;
        } catch (e) {
          errText += `\n\n(Failed to fetch available models)`;
        }
      }
      throw new Error(`Groq API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    return {
      id: data.id || `groq-${Date.now()}`,
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
    throw new Error('Streaming is not fully implemented in this MVP for GroqProvider.');
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT OSS 120B',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 8192,
        contextWindow: 128000
      },
      {
        id: 'openai/gpt-oss-20b',
        name: 'GPT OSS 20B',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 8192,
        contextWindow: 128000
      },
      {
        id: 'openai/gpt-oss-safeguard-20b',
        name: 'GPT OSS Safeguard 20B',
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
