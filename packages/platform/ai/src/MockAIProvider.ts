import type { IAIProvider, AIRequest, AIResponse, AIStreamChunk, AIModel, CostEstimate } from './types';

export class MockAIProvider implements IAIProvider {
  readonly id = 'mock-provider';
  readonly name = 'Mock Provider (Local)';
  readonly capabilities: any[] = ['chat', 'code'];

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const userMsg = request.messages[request.messages.length - 1]?.content || '';
    let responseText = `I am a mock response from Unify.AI MockProvider.\n\nYou asked: "${userMsg}"\n\nI have successfully received your request along with the Workspace Context. I see everything in your repository.`;

    if (userMsg.toLowerCase().includes('explain')) {
      responseText = `### Code Explanation\n\nBased on your Workspace Context, I can see you're looking at a piece of code. \n\nThis code appears to be part of the active file or selection provided in the context graph. The logic implements a core feature of the Unify.AI platform.\n\nSince I am a mock provider, I cannot actually read the code, but I can confirm the AITaskEngine orchestrated the workflow flawlessly!`;
    }

    return {
      id: 'mock-' + Date.now(),
      content: responseText,
      model: 'mock-model-v1',
      provider: this.name,
      usage: {
        promptTokens: 1500,
        completionTokens: 85,
        totalTokens: 1585
      },
      finishReason: 'stop',
      latencyMs: 1500
    };
  }

  async *streamMessage(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const userMsg = request.messages[request.messages.length - 1]?.content || '';
    const words = `I am streaming a mock response. You asked: "${userMsg}"`.split(' ');
    
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield {
        id: 'mock-' + Date.now(),
        delta: word + ' ',
        done: false
      };
    }
    
    yield {
      id: 'mock-' + Date.now(),
      delta: '',
      done: true
    };
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'mock-model-v1',
        name: 'Mock Model v1',
        provider: this.id,
        capabilities: ['chat', 'code'],
        maxTokens: 4096,
        contextWindow: 128000
      }
    ];
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  estimateCost(request: AIRequest): CostEstimate {
    return {
      estimatedCost: 0,
      currency: 'USD',
      promptTokens: 100,
      completionTokens: 50
    };
  }
}
