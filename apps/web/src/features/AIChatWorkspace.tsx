import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Activity, Bookmark } from 'lucide-react';
import { useAIChatStore } from '../stores/aiChatStore';

export function AIChatWorkspace() {
  const { messages, isTyping, contextUsed, executeExplainCode, saveToMemory } = useAIChatStore();
  const [input, setInput] = useState('');
  const [showContextView, setShowContextView] = useState(true);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    
    const question = input;
    setInput('');
    executeExplainCode(question);
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      
      {/* Left Chat Area */}
      <div className={`flex flex-col flex-1 border-r border-[var(--color-border-default)] transition-all ${showContextView ? 'mr-0' : ''}`}>
        {/* Header */}
        <div className="border-b border-[var(--color-border-default)] p-4 shrink-0 flex justify-between items-center bg-[var(--color-bg-secondary)]">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-accent-primary)]" />
            AI Workspace (Explain Code Slice)
          </h2>
          <button 
            onClick={() => setShowContextView(!showContextView)}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] px-2 py-1 rounded cursor-pointer"
          >
            <Activity size={12} />
            {showContextView ? 'Hide Context Inspector' : 'Show Context Inspector'}
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]'}`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.toolCallId && (
                  <button onClick={() => saveToMemory(msg.toolCallId!)} className="self-start text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] flex items-center gap-1 mt-1 cursor-pointer transition-colors">
                    <Bookmark size={10} /> Save to Project Memory
                  </button>
                )}
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
              placeholder="Ask me to explain code or concepts in this repository..."
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
            AI is connected directly to AITaskEngine.
          </div>
        </div>
      </div>

      {/* Right Context Window Panel */}
      {showContextView && (
        <div className="w-[350px] shrink-0 bg-[var(--color-bg-secondary)] flex flex-col border-l border-[var(--color-border-default)] shadow-lg animate-in slide-in-from-right-4">
          <div className="p-3 border-b border-[var(--color-border-default)] flex items-center gap-2">
            <Activity size={14} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Context Inspector
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-[var(--color-text-muted)]">
            {contextUsed}
          </div>
          <div className="p-3 border-t border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[10px] text-[var(--color-text-secondary)] flex justify-between">
            <span>Powered by ContextBuilder & PromptBuilder</span>
          </div>
        </div>
      )}
    </div>
  );
}
