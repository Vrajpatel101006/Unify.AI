import { create } from 'zustand';
import { AITaskEngine, MockAIProvider, PromptEngine, AIRouter } from '@unify/platform-ai';
import { ContextEngine } from '@unify/platform-context';
import type { AIMessage } from '@unify/platform-ai';
import { useProviderStore } from './providerStore';
import { buildProvider } from '../services/providerFactory';

interface AIChatState {
  messages: AIMessage[];
  isTyping: boolean;
  contextUsed: string;
  addMessage: (msg: AIMessage) => void;
  setTyping: (typing: boolean) => void;
  executeExplainCode: (question: string) => Promise<void>;
  saveToMemory: (responseId: string) => void;
  resetChat: () => void;
}

// Instantiate the singleton services
const router = new AIRouter();
router.registerProvider(new MockAIProvider());
router.setDefaultProvider('mock-provider');

const promptEngine = new PromptEngine();
const contextEngine = new ContextEngine();
const taskEngine = new AITaskEngine(router, contextEngine, promptEngine);

export const useAIChatStore = create<AIChatState>((set, get) => ({
  messages: [
    { role: 'assistant', content: 'Hello! I am your AI assistant, powered by Unify.AI. I have real-time access to your repository architecture, git state, and project memory. How can I help you today?' }
  ],
  isTyping: false,
  contextUsed: 'Awaiting first request...',

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setTyping: (typing) => set({ isTyping: typing }),

  executeExplainCode: async (question: string) => {
    const { addMessage, setTyping } = get();
    
    addMessage({ role: 'user', content: question });
    setTyping(true);

    try {
      // Use the centralized factory — works for any provider automatically
      const activeConfig = useProviderStore.getState().providers.find(p => p.isActive) ?? useProviderStore.getState().providers[0];
      const provider = buildProvider(activeConfig);
      router.registerProvider(provider);
      router.setDefaultProvider(provider.id);

      // 2. Execute vertical slice via AITaskEngine
      const result = await taskEngine.executeTask({
        type: 'chat',
        templateId: 'explain-code',
        variables: { question }
      });

      // Track accurate usage and cost
      if (activeConfig) {
        let cost = 0;
        const pt = result.response.usage?.promptTokens || 0;
        const ct = result.response.usage?.completionTokens || 0;
        
        switch (activeConfig.id) {
          case 'groq':
            // Groq Llama 3/OSS blended average (~$0.60 per 1M tokens)
            cost = ((pt + ct) / 1_000_000) * 0.60;
            break;
          case 'gemini':
            // Gemini 1.5 Flash pricing
            cost = (pt / 1_000_000) * 0.075 + (ct / 1_000_000) * 0.30;
            break;
          case 'grok':
            // Grok Beta pricing (~$5.00 per 1M blended)
            cost = ((pt + ct) / 1_000_000) * 5.00;
            break;
          case 'openai':
            cost = (pt / 1_000_000) * 5.00 + (ct / 1_000_000) * 15.00;
            break;
          default:
            cost = 0; // Free or local
        }
        
        useProviderStore.getState().addUsage(activeConfig.id, pt, ct, cost);
      }

      // 3. Update UI with response and context
      set({ contextUsed: result.contextUsed || 'Context unavailable' });
      addMessage({ role: 'assistant', content: result.response.content, toolCallId: result.response.id });
    } catch (err) {
      addMessage({ role: 'assistant', content: 'Error: ' + (err as Error).message });
    } finally {
      setTyping(false);
    }
  },

  saveToMemory: (responseId: string) => {
    // In a real app, this would call memory.save(...) 
    console.log(`[aiChatStore] Saving response ${responseId} to Project Memory!`);
    alert('Successfully saved explanation to Project Memory!');
  },

  resetChat: () => {
    set({
      messages: [
        { role: 'assistant', content: 'Hello! I am your AI assistant, powered by Unify.AI. I have real-time access to your repository architecture, git state, and project memory. How can I help you today?' }
      ],
      contextUsed: 'Awaiting first request...'
    });
  }
}));
