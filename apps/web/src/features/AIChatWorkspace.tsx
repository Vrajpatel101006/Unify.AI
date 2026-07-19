import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { useFeatureStore } from '../stores/featureStores';

export function AIChatWorkspace() {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', text: 'Hello! I am your AI assistant, powered by Unify.AI. I have real-time access to your repository architecture, git state, and project memory. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContextView, setShowContextView] = useState(true);
  
  // Dummy context info for the UI (this would come from ContextEngine & PromptBuilder via stores)
  const [currentContextText, setCurrentContextText] = useState('Fetching live context...');
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Mock fetching context on mount
    setTimeout(() => {
      setCurrentContextText(
        `# AI Workspace Context\n\n## Repository Architecture\nFrameworks detected: React, Vite, Tailwind\nKey Symbols:\n- class: GitService\n- interface: WorkspaceContextModel\n\n## Git State\n- Branch: main\n- Clean: true\n\n## Recent Activity\n- Recently opened files: AIChatWorkspace.tsx, App.tsx`
      );
    }, 1000);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          text: `Based on your Workspace Context, I can see you are on the \`main\` branch and looking at \`AIChatWorkspace.tsx\`. This project uses React, Vite, and Tailwind.\n\nTo answer your question: "${newMsg.text}"... this is a dummy response. I am ready to be hooked up to the real @unify/platform-ai router!` 
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      
      {/* Left Chat Area */}
      <div className={`flex flex-col flex-1 border-r border-[var(--color-border-default)] transition-all ${showContextView ? 'mr-0' : ''}`}>
        {/* Header */}
        <div className="border-b border-[var(--color-border-default)] p-4 shrink-0 flex justify-between items-center bg-[var(--color-bg-secondary)]">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-accent-primary)]" />
            AI Chat Workspace
          </h2>
          <button 
            onClick={() => setShowContextView(!showContextView)}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] px-2 py-1 rounded"
          >
            <Activity size={12} />
            {showContextView ? 'Hide Context Window' : 'Show Context Window'}
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm flex items-center gap-2">
                <span className="animate-pulse w-1.5 h-1.5 bg-[var(--color-accent-primary)] rounded-full"></span>
                <span className="animate-pulse w-1.5 h-1.5 bg-[var(--color-accent-primary)] rounded-full animation-delay-200"></span>
                <span className="animate-pulse w-1.5 h-1.5 bg-[var(--color-accent-primary)] rounded-full animation-delay-400"></span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about this project..."
              className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl py-3 pl-4 pr-12 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] resize-none h-14"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--color-accent-primary)] text-white disabled:opacity-50 hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] text-center mt-2">
            AI can make mistakes. Verify critical code and data.
          </div>
        </div>
      </div>

      {/* Right Context Window Panel */}
      {showContextView && (
        <div className="w-[350px] shrink-0 bg-[var(--color-bg-secondary)] flex flex-col border-l border-[var(--color-border-default)] shadow-lg animate-in slide-in-from-right-4">
          <div className="p-3 border-b border-[var(--color-border-default)] flex items-center gap-2">
            <Activity size={14} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Context Used For Next Request
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-[var(--color-text-muted)]">
            {currentContextText}
          </div>
          <div className="p-3 border-t border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[10px] text-[var(--color-text-secondary)] flex justify-between">
            <span>Powered by ContextEngine</span>
            <span className="text-[var(--color-status-success)]">~400 tokens</span>
          </div>
        </div>
      )}
    </div>
  );
}
