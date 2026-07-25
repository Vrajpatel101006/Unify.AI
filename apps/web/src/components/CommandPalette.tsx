import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command as CommandIcon, GitBranch, Upload, Download, LogOut, Search as SearchIcon, Bot, Beaker, Eye, Edit, Plus, ArrowRight } from 'lucide-react';
import { commandRegistry } from '../services/commandRegistry';
import { useCommandPaletteStore } from '@unify/platform-commands';
import type { Command } from '@unify/platform-commands';

const iconMap: Record<string, React.ReactNode> = {
  'download': <Download size={14} />,
  'git-commit': <GitBranch size={14} />,
  'upload': <Upload size={14} />,
  'log-out': <LogOut size={14} />,
  'search': <SearchIcon size={14} />,
  'bot': <Bot size={14} />,
  'beaker': <Beaker size={14} />,
  'eye': <Eye size={14} />,
  'edit': <Edit size={14} />,
  'plus': <Plus size={14} />
};

export function CommandPalette() {
  const { isOpen, closePalette, recentCommandIds, addRecentCommand } = useCommandPaletteStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Handle global shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useCommandPaletteStore.getState().togglePalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = useMemo(() => {
    let allCommands = commandRegistry.getCommands();
    // Filter by context
    allCommands = allCommands.filter(cmd => !cmd.isEnabled || cmd.isEnabled());

    const q = query.toLowerCase();
    
    // Sort and score
    return allCommands.map(cmd => {
      let score = 0;
      
      const isRecent = recentCommandIds.includes(cmd.id);
      if (isRecent) score += 100 - recentCommandIds.indexOf(cmd.id);

      if (q) {
        if (cmd.title.toLowerCase().includes(q)) score += 50;
        else if (cmd.category.toLowerCase().includes(q)) score += 20;
        else if (cmd.keywords?.some(k => k.toLowerCase().includes(q))) score += 10;
        else if (cmd.description?.toLowerCase().includes(q)) score += 5;
        else score -= 1000; // Filter out if no match at all
      }

      return { cmd, score, isRecent };
    })
    .filter(x => x.score > -500)
    .sort((a, b) => b.score - a.score)
    .map(x => x.cmd);

  }, [query, recentCommandIds]);


  const handleExecute = async (command: Command) => {
    addRecentCommand(command.id);
    closePalette();
    try {
      await commandRegistry.execute(command.id);
    } catch (err) {
      console.error(`Error executing ${command.id}:`, err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && commands.length > 0) {
      e.preventDefault();
      handleExecute(commands[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const selectedCommand = commands[selectedIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-default)] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border-default)] gap-3 bg-[var(--color-bg-secondary)]">
          <Search size={18} className="text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)]"
          />
          <kbd className="px-2 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded text-[10px] text-[var(--color-text-muted)] font-mono">
            ESC
          </kbd>
        </div>

        <div 
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 flex flex-col custom-scrollbar"
        >
          {commands.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
              No commands found.
            </div>
          ) : (
            commands.map((cmd, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => handleExecute(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex items-center justify-center w-5 h-5 opacity-70 ${isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                      {cmd.icon && iconMap[cmd.icon] ? iconMap[cmd.icon] : <CommandIcon size={14} />}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate flex items-center gap-2">
                        {cmd.title}
                        {!query && recentCommandIds.includes(cmd.id) && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${isActive ? 'bg-black/20 text-white/90' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>Recent</span>
                        )}
                      </span>
                      <span className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                        {cmd.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Preview Footer */}
        {selectedCommand && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[10px]">
            <span className="text-[var(--color-text-secondary)] truncate flex-1 mr-4">
              {selectedCommand.description || 'No description provided.'}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <ArrowRight size={12} /> Execute
              </span>
              {selectedCommand.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded text-[var(--color-text-secondary)] font-mono tracking-widest">
                  {selectedCommand.shortcut}
                </kbd>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop click to close */}
      <div className="fixed inset-0 z-[-1]" onClick={closePalette} />
    </div>
  );
}
