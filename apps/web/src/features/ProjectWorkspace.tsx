import { useState } from 'react';
import { useProjectStore, type AIMemoryNote } from '../stores/projectStore';
import { GitBranch, Database, Globe, FileCode, CheckCircle2, AlertTriangle, Plus, Trash2, Edit3, Save, Pin, FileText, Play } from 'lucide-react';

export function ProjectWorkspace() {
  const { currentProject, connections, notes, toggleConnectionStatus, addConnection, removeConnection, addNote, updateNote, deleteNote } = useProjectStore();

  // Connection form state
  const [showAddConn, setShowAddConn] = useState(false);
  const [connName, setConnName] = useState('');
  const [connType, setConnType] = useState<'database' | 'api'>('database');
  const [connDetail, setConnDetail] = useState('');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleAddConnection = () => {
    if (!connName || !connDetail) return;
    addConnection({
      name: connName,
      type: connType,
      status: connType === 'database' ? 'disconnected' : 'stopped',
      detail: connDetail,
    });
    setConnName('');
    setConnDetail('');
    setShowAddConn(false);
  };

  const handleSaveNote = () => {
    if (!noteTitle || !noteContent) return;
    if (editingNoteId) {
      updateNote(editingNoteId, noteTitle, noteContent);
      setEditingNoteId(null);
    } else {
      addNote(noteTitle, noteContent);
    }
    setNoteTitle('');
    setNoteContent('');
  };

  const handleEditNote = (note: AIMemoryNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)] select-text">
        No active project connected. Open a directory workspace.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] p-6 overflow-y-auto select-text">
      {/* Header Overview Card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-5 mb-6 flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{currentProject.name}</h2>
            <span className="flex items-center gap-1 rounded bg-[var(--color-bg-hover)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-text-secondary)]">
              <GitBranch size={10} /> {currentProject.gitBranch}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 font-mono">{currentProject.path}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Git status</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-[var(--color-status-warning)]">
              <AlertTriangle size={13} />
              <span>{currentProject.gitStatus.staged.length + currentProject.gitStatus.unstaged.length} files modified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* Left Column: Git Status Changes tree & History logs */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Git Repository Index
            </h3>

            {/* Staged */}
            {currentProject.gitStatus.staged.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-bold text-[var(--color-status-success)] uppercase">Staged changes</div>
                <div className="flex flex-col gap-1">
                  {currentProject.gitStatus.staged.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[var(--color-text-primary)]">
                      <FileCode size={12} className="text-[var(--color-status-success)] shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unstaged */}
            {currentProject.gitStatus.unstaged.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-[var(--color-border-default)] pt-3">
                <div className="text-[10px] font-bold text-[var(--color-status-warning)] uppercase">Unstaged changes</div>
                <div className="flex flex-col gap-1">
                  {currentProject.gitStatus.unstaged.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[var(--color-text-primary)]">
                      <FileCode size={12} className="text-[var(--color-status-warning)] shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Untracked */}
            {currentProject.gitStatus.untracked.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-[var(--color-border-default)] pt-3">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Untracked changes</div>
                <div className="flex flex-col gap-1">
                  {currentProject.gitStatus.untracked.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <FileText size={12} className="text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Git commits history log */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Git Commit Log
            </h3>
            <div className="flex flex-col gap-3">
              {currentProject.commitHistory.map((c) => (
                <div key={c.hash} className="flex gap-2.5 items-start">
                  <span className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-text-secondary)]">
                    {c.hash}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                      {c.message}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {c.author} • {c.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Environment Connections DB/API */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Local Environment Connections
              </h3>
              <button
                onClick={() => setShowAddConn(!showAddConn)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>

            {showAddConn && (
              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Connection Name</label>
                  <input
                    type="text"
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                    placeholder="e.g. Postgres Docker"
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Type</label>
                  <select
                    value={connType}
                    onChange={(e) => setConnType(e.target.value as any)}
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
                  >
                    <option value="database">Database connection</option>
                    <option value="api">API Endpoint URL</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Address / Endpoint URL</label>
                  <input
                    type="text"
                    value={connDetail}
                    onChange={(e) => setConnDetail(e.target.value)}
                    placeholder="localhost:5432/db"
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={handleAddConnection}
                    className="rounded bg-[var(--color-accent-primary)] px-3 py-1 text-[10px] font-semibold text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {connections.map((c) => {
                const isDb = c.type === 'database';
                const isLive = c.status === 'connected' || c.status === 'running';

                return (
                  <div
                    key={c.id}
                    className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3 flex items-center justify-between"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isLive ? 'bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]' : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'
                      }`}>
                        {isDb ? <Database size={15} /> : <Globe size={15} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-mono truncate mt-0.5">
                          {c.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleConnectionStatus(c.id)}
                        className={`p-1 rounded cursor-pointer ${
                          isLive ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                        title={isLive ? 'Disconnect' : 'Connect'}
                      >
                        {isLive ? <CheckCircle2 size={15} /> : isDb ? <Play size={13} /> : <Play size={13} />}
                      </button>
                      <button
                        onClick={() => removeConnection(c.id)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Workspace Memory Notepad */}
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            AI Context Memory Notes
          </h3>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write system notes that AI will load dynamically to understand workspace preferences..."
                className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-secondary)] focus:outline-none resize-none h-20"
              />
              <button
                onClick={handleSaveNote}
                className="rounded bg-[var(--color-accent-primary)] py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Save size={12} />
                <span>{editingNoteId ? 'Update Note' : 'Add Note'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-[var(--color-border-default)] pt-4">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1">
                      <Pin size={11} className="text-[var(--color-accent-primary)]" /> {n.title}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditNote(n)}
                        className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
