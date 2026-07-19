import { create } from 'zustand';
import { AITaskEngine, MockAIProvider, PromptEngine, AIRouter } from '@unify/platform-ai';
import { ContextEngine } from '@unify/platform-context';
import type { AIMessage } from '@unify/platform-ai';

interface AIChatState {
  messages: AIMessage[];
  isTyping: boolean;
  contextUsed: string;
  addMessage: (msg: AIMessage) => void;
  setTyping: (typing: boolean) => void;
  executeExplainCode: (question: string) => Promise<void>;
  saveToMemory: (responseId: string) => void;
}

// Instantiate the singleton services for the mock UI slice
const router = new AIRouter();
router.registerProvider(new MockAIProvider());
router.setDefaultProvider('mock-provider');

const promptEngine = new PromptEngine(); // registers 'explain-code' default
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
    
    // 1. Add user message to UI
    addMessage({ role: 'user', content: question });
    setTyping(true);

    try {
      // 2. Execute vertical slice via AITaskEngine
      const result = await taskEngine.executeTask({
        type: 'chat',
        templateId: 'explain-code',
        variables: { question }
      });

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
  }
}));
