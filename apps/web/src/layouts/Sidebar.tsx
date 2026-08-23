import { useState } from 'react';
import { ChevronLeft, Settings2, Plus, Terminal, Database, FileText, Code, Trash2, ToggleLeft, ToggleRight, Send } from 'lucide-react';
import { useLayoutStore } from '../stores/layoutStore';
import { useProjectStore } from '../stores/projectStore';
import { usePromptStore } from '../stores/promptStore';
import { useAIChatStore } from '../stores/aiChatStore';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeActivity, addTab } = useLayoutStore();
  const { currentProject, projectFiles, connections, addConnection, removeConnection, toggleConnectionStatus } = useProjectStore();
  const { prompts, selectedPromptId, selectPrompt, addPrompt, deletePrompt } = usePromptStore();
  const { resetChat } = useAIChatStore();

  const [showAddConn, setShowAddConn] = useState(false);
  const [connName, setConnName] = useState('');
  const [connType, setConnType] = useState<'database' | 'api'>('database');
  const [connDetail, setConnDetail] = useState('');

  if (!sidebarOpen) return null;

  const hasFiles = projectFiles.sqlFiles.length + projectFiles.docFiles.length + projectFiles.codeFiles.length > 0;

  const handleAddConnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connName || !connDetail) return;
    addConnection({
      name: connName,
      type: connType,
      status: connType === 'database' ? 'connected' : 'running',
      detail: connDetail
    });
    setConnName('');
    setConnDetail('');
    setShowAddConn(false);
  };

  const renderContent = () => {
    switch (activeActivity) {
      case 'welcome':
        return (
          <div className="flex flex-col p-3 gap-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Quick Start
            </h3>
            <div className="flex flex-col gap-1 mt-2">
              <button 
                onClick={() => {
                  resetChat();
                  addTab({ id: 'ai-chat', title: 'AI Chat', type: 'ai-chat' });
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer text-left w-full"
              >
                <Terminal size={14} /> New Session
              </button>
            </div>
            {/* Smart File Router Summary */}
            {currentProject && hasFiles && (
              <div className="mt-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3 flex flex-col gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  File Router — {currentProject.name}
                </div>
                {projectFiles.sqlFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    <Database size={12} className="text-[var(--color-status-success)] shrink-0" />
                    <span><span className="font-semibold text-[var(--color-text-primary)]">{projectFiles.sqlFiles.length}</span> SQL file{projectFiles.sqlFiles.length !== 1 ? 's' : ''} → Database Workspace</span>
                  </div>
                )}
                {projectFiles.docFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    <FileText size={12} className="text-[var(--color-status-info)] shrink-0" />
                    <span><span className="font-semibold text-[var(--color-text-primary)]">{projectFiles.docFiles.length}</span> doc file{projectFiles.docFiles.length !== 1 ? 's' : ''} → Documentation</span>
                  </div>
                )}
                {projectFiles.codeFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    <Code size={12} className="text-[var(--color-accent-primary)] shrink-0" />
                    <span><span className="font-semibold text-[var(--color-text-primary)]">{projectFiles.codeFiles.length}</span> code file{projectFiles.codeFiles.length !== 1 ? 's' : ''} → Code Intelligence</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'prompt':
        return (
          <div className="flex flex-col p-3 gap-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Prompt Collection
              </h3>
              <button 
                onClick={() => {
                  addPrompt({
                    folderId: null,
                    name: 'New Prompt ' + (prompts.length + 1),
                    description: 'Custom prompt template description.',
                    category: 'general',
                    userPromptTemplate: 'Hello {{name}}!',
                    variables: ['name'],
                    tags: ['general'],
                  });
                  addTab({ id: 'prompt', title: 'Prompts', type: 'prompt' });
                }}
                title="Create Prompt" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
            {prompts.length === 0 ? (
              <div className="flex flex-col gap-1 mt-2 text-[var(--color-text-muted)] text-[11px] px-2 mt-4 text-center">
                No prompts in collection. Click + to add.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {prompts.map((p) => {
                  const isSelected = selectedPromptId === p.id;
                  return (
                    <div 
                      key={p.id}
                      onClick={() => {
                        selectPrompt(p.id);
                        addTab({ id: 'prompt', title: 'Prompts', type: 'prompt' });
                      }}
                      className={`rounded-lg border border-[var(--color-border-default)] p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-[var(--color-bg-hover)]/30 group ${
                        isSelected ? 'bg-[var(--color-bg-hover)] border-l-2 border-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Send size={12} className="text-[var(--color-accent-primary)] shrink-0" />
                        <div className="truncate min-w-0">
                          <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                            {p.name}
                          </div>
                          <div className="text-[9px] text-[var(--color-text-muted)] truncate mt-0.5 capitalize">
                            Category: {p.category}
                          </div>
                        </div>
                      </div>
                      {/* Delete Prompt Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePrompt(p.id);
                        }}
                        title="Delete prompt"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'database':
        return (
          <div className="flex flex-col p-3 gap-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Connections
              </h3>
              <button 
                onClick={() => setShowAddConn(true)}
                title="Add Connection" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
            {connections.length === 0 ? (
              <div className="flex flex-col gap-1 mt-2 text-[var(--color-text-muted)] text-[11px] px-2 mt-4 text-center">
                No active connections. Click + to add.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {connections.map((c) => {
                  const isConnected = c.status === 'connected' || c.status === 'running';
                  return (
                    <div 
                      key={c.id} 
                      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-2.5 flex flex-col gap-1.5 transition-all hover:bg-[var(--color-bg-hover)]/30 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isConnected ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-status-success)] animate-pulse shrink-0" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)] shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate" title={c.name}>
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleConnectionStatus(c.id)}
                            title={isConnected ? 'Disconnect' : 'Connect'}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] cursor-pointer"
                          >
                            {isConnected ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          <button
                            onClick={() => removeConnection(c.id)}
                            title="Remove"
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--color-text-muted)] truncate" title={c.detail}>
                        {c.detail}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col p-3 gap-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Configuration
            </h3>
            <div className="flex flex-col gap-1 mt-2">
              <button className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer text-left w-full">
                <Settings2 size={14} /> General Settings
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-xs text-[var(--color-text-muted)] text-center">
            No options available
          </div>
        );
    }
  };

  return (
    <div
      className="flex h-full w-[var(--size-sidebar)] flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]"
      style={{ width: 'var(--size-sidebar)' }}
    >
      {/* Title / Collapser Header */}
      <div className="flex h-[var(--size-topbar)] items-center justify-between border-b border-[var(--color-border-default)] px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {activeActivity === 'welcome' ? 'Workspace' : activeActivity}
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          title="Collapse Sidebar"
          className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>

      {/* Add Connection Modal */}
      {showAddConn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl shadow-2xl w-[360px] overflow-hidden select-text">
            <div className="p-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] flex justify-between items-center">
              <h3 className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Database size={14} className="text-[var(--color-accent-primary)]" />
                Add Connection
              </h3>
            </div>
            <form onSubmit={handleAddConnSubmit} className="p-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Connection Name</label>
                <input
                  type="text"
                  required
                  value={connName}
                  onChange={(e) => setConnName(e.target.value)}
                  placeholder="e.g. PostgreSQL Local, SQLite Cache"
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Connection Type</label>
                <select
                  value={connType}
                  onChange={(e) => setConnType(e.target.value as any)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                >
                  <option value="database">Database Client</option>
                  <option value="api">API Healthcheck Endpoint</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Connection Address / Path</label>
                <input
                  type="text"
                  required
                  value={connDetail}
                  onChange={(e) => setConnDetail(e.target.value)}
                  placeholder="e.g. localhost:5432/db, http://api/health"
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setShowAddConn(false)}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[var(--color-accent-primary)] text-white text-xs font-bold hover:bg-[var(--color-accent-hover)] cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
