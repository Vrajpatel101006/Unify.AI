import type { AITask, AIExecutionResult, IAITaskEngine, IAIRouter, IPromptEngine, AIRequest, AIMessage } from './types';
import type { IContextEngine, WorkspaceContextModel } from '@unify/platform-context';
import { PromptBuilder } from './PromptBuilder';

export class AITaskEngine implements IAITaskEngine {
  private router: IAIRouter;
  private contextEngine: IContextEngine;
  private promptEngine: IPromptEngine;

  constructor(
    router: IAIRouter,
    contextEngine: IContextEngine,
    promptEngine: IPromptEngine
  ) {
    this.router = router;
    this.contextEngine = contextEngine;
    this.promptEngine = promptEngine;
  }

  async executeTask(task: AITask): Promise<AIExecutionResult> {
    // 1. Build Context
    let contextModel: WorkspaceContextModel = {};
    let contextString = '';
    
    // In a real application, AITaskEngine might have direct access to ContextEngine,
    // or the task contains a pre-built context snapshot. For this implementation,
    // we'll assume contextEngine gives us the live context.
    contextModel = await this.contextEngine.buildWorkspaceContext();
    
    // 2. Budget & Build Context Prefix
    // Let's assume a default budget of 2000 tokens for context if not specified
    contextString = PromptBuilder.buildWorkspaceContextPrompt(contextModel, { maxTokens: 2000 });

    // 3. Compile User Prompt
    let finalUserMessage = '';
    
    if (task.templateId) {
      // Use Prompt Template System
      finalUserMessage = this.promptEngine.buildPrompt(task.templateId, task.variables || {});
    } else if (task.userMessage) {
      finalUserMessage = task.userMessage;
    } else {
      throw new Error('[AITaskEngine] Task must provide either templateId or userMessage.');
    }

    // 4. Assemble AIRequest
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert AI assistant operating within the Unify.AI IDE.\n\n${contextString}`
      },
      {
        role: 'user',
        content: finalUserMessage
      }
    ];

    const request: AIRequest = {
      messages,
      metadata: task.metadata
    };

    // 5. Route to Provider
    const provider = await this.router.route(task);

    // 6. Execute request
    const response = await provider.sendMessage(request);

    // 7. Return Result
    return {
      response,
      contextUsed: contextString,
      promptUsed: finalUserMessage
    };
  }
}
