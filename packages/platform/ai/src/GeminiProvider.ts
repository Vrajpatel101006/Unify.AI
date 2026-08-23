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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._apiKey}`;

    const contents = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
          topP: request.topP ?? 0.95
        }
      })
    });

    if (!response.ok) {
      let errText = await response.text();
      if (response.status === 404) {
        try {
          const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`);
          const listData = await listRes.json();
          const validModels = (listData.models || [])
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''))
            .join(', ');
          errText += `\n\n[DIAGNOSTIC AUTOMATION] I queried Google's servers. The valid models for your specific API key are:\n${validModels}`;
        } catch (e) {
          errText += `\n\n(Failed to fetch available models)`;
        }
      }
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      id: `gemini-${Date.now()}`,
      content: text,
      model: model,
      provider: this.name,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
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
