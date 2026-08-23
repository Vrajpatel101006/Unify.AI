import { useState } from 'react';
import { useFeatureStore } from '../stores/featureStores';
import { useProviderStore } from '../stores/providerStore';
import { useProjectStore } from '../stores/projectStore';
import { Cpu, AlertTriangle, AlertCircle, Info, CheckSquare, Square, Sparkles, Activity, Key, Settings, Zap, RefreshCw, XCircle, Trash2, Plus, FolderOpen, File, ChevronRight } from 'lucide-react';

export function CodeIntelligence() {
  const { codeIntel } = useFeatureStore();
  const { diagnostics, todos, analyzeFile, analyzeFolder, analyzeMode, setAnalyzeMode, folderProgress, toggleTodo, isAnalyzing, analysisError, applyQuickFix, addTodo, removeTodo } = codeIntel;
  const { providers, addOrUpdateProvider } = useProviderStore();
  const { projectFiles } = useProjectStore();

  const [filePathInput, setFilePathInput] = useState('apps/web/src/layouts/AppShell.tsx');
  const [newTodoInput, setNewTodoInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempProviderId, setTempProviderId] = useState(providers[0]?.id || 'groq');
  const [expandedDiag, setExpandedDiag] = useState<string | null>(null);

  const handleSaveKey = () => {
    if (!tempApiKey) return;
    const provider = providers.find(p => p.id === tempProviderId);
    if (provider) {
      addOrUpdateProvider({ ...provider, apiKey: tempApiKey });
    } else {
      addOrUpdateProvider({ id: tempProviderId, name: tempProviderId.toUpperCase(), apiKey: tempApiKey, models: [] });
    }
    setShowKeyModal(false);
  };

  const handleAnalyze = () => {
    const activeProvider = providers.find(p => p.isActive) || providers[0];
    if (!activeProvider || !activeProvider.apiKey) {
      setShowKeyModal(true);
      return;
    }
    if (analyzeMode === 'file') {
      if (!filePathInput) return;
      analyzeFile(filePathInput);
    } else {
      if (projectFiles.codeFiles.length === 0) {
        alert('No project is open, or no code files were found. Open a project folder first from the Repository workspace.');
        return;
      }
      analyzeFolder(projectFiles.codeFiles);
    }
  };

  const progressPct = folderProgress.total > 0 ? Math.round((folderProgress.done / folderProgress.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] p-6 overflow-y-auto select-text">
      {/* Top Banner */}
      <div className="border-b border-[var(--color-border-default)] pb-4 mb-6 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Cpu size={16} className="text-[var(--color-accent-primary)]" />
            Code Intelligence Workspace
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            AI-powered line-by-line code diagnostics with inline quick fixes.
          </p>
        </div>
        <button
          onClick={() => {
            const activeProvider = providers.find(p => p.isActive) || providers[0];
            if (activeProvider) {
              setTempProviderId(activeProvider.id);
              setTempApiKey(activeProvider.apiKey);
            }
            setShowKeyModal(true);
          }}
          className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] flex items-center gap-1.5 cursor-pointer"
        >
          <Settings size={13} /> Config AI Key
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Analyzer + Diagnostics */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Analyzer Card */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Code Quality Analyzer
              </h3>
              {/* Mode Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-default)] text-[10px] font-semibold">
                <button
                  onClick={() => setAnalyzeMode('file')}
                  className={`flex items-center gap-1 px-3 py-1.5 transition-all cursor-pointer ${analyzeMode === 'file' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
                >
                  <File size={11} /> Single File
                </button>
                <button
                  onClick={() => setAnalyzeMode('folder')}
                  className={`flex items-center gap-1 px-3 py-1.5 transition-all cursor-pointer ${analyzeMode === 'folder' ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
                >
                  <FolderOpen size={11} /> Whole Folder
                </button>
              </div>
            </div>

            {analyzeMode === 'file' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filePathInput}
                  onChange={(e) => setFilePathInput(e.target.value)}
                  placeholder="Enter file workspace path..."
                  className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Will analyze <span className="font-semibold text-[var(--color-accent-primary)]">{projectFiles.codeFiles.length}</span> code files from the open project.
                  {projectFiles.codeFiles.length === 0 && <span className="text-[var(--color-status-warning)]"> Open a project folder first.</span>}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || projectFiles.codeFiles.length === 0}
                  className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-fit"
                >
                  {isAnalyzing ? <RefreshCw size={13} className="animate-spin" /> : <FolderOpen size={13} />}
                  <span>{isAnalyzing ? `Analyzing ${folderProgress.done}/${folderProgress.total}...` : 'Analyze Folder'}</span>
                </button>
                {isAnalyzing && folderProgress.total > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="w-full rounded-full bg-[var(--color-bg-tertiary)] h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent-primary)] transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-[var(--color-text-muted)]">{progressPct}% complete</span>
                  </div>
                )}
              </div>
            )}

            {analysisError && (
              <div className="rounded border border-[var(--color-status-error)] bg-[var(--color-status-error)]/10 p-3 flex items-start gap-2">
                <XCircle size={14} className="text-[var(--color-status-error)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--color-status-error)] leading-relaxed">
                  <span className="font-bold">Analysis Failed:</span> {analysisError}
                </div>
              </div>
            )}
          </div>

          {/* Diagnostics List — Line-by-Line */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Diagnostics &amp; Issues
              </h3>
              {diagnostics.length > 0 && (
                <span className="text-[10px] text-[var(--color-text-muted)]">{diagnostics.length} issue{diagnostics.length !== 1 ? 's' : ''} found</span>
              )}
            </div>
            {diagnostics.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] italic text-center py-4">
                No diagnostics yet. Run the analyzer to detect issues.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {diagnostics.map((d) => {
                  const isError = d.severity === 'error';
                  const isWarn = d.severity === 'warning';
                  const isExpanded = expandedDiag === d.id;

                  return (
                    <div
                      key={d.id}
                      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] overflow-hidden"
                    >
                      {/* Diagnostic Header */}
                      <button
                        onClick={() => setExpandedDiag(isExpanded ? null : d.id)}
                        className="w-full flex items-start justify-between p-3 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer text-left gap-2"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          {isError ? (
                            <AlertCircle size={14} className="text-[var(--color-status-error)] shrink-0 mt-0.5" />
                          ) : isWarn ? (
                            <AlertTriangle size={14} className="text-[var(--color-status-warning)] shrink-0 mt-0.5" />
                          ) : (
                            <Info size={14} className="text-[var(--color-status-info)] shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-[var(--color-text-primary)] leading-tight">{d.message}</div>
                            <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                              {d.filePath}:{d.line}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--color-text-secondary)]">
                            {d.type}
                          </span>
                          <ChevronRight
                            size={13}
                            className={`text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="border-t border-[var(--color-border-default)] p-3 flex flex-col gap-3">
                          {/* Offending Code Snippet */}
                          {(d as any).codeSnippet && (
                            <div>
                              <div className="text-[9px] font-bold uppercase text-[var(--color-text-muted)] mb-1">Line {d.line} — Offending Code</div>
                              <pre className="rounded bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)]/30 px-3 py-2 text-[11px] font-mono text-[var(--color-status-error)] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                <span className="text-[var(--color-text-muted)] select-none mr-2">{d.line} |</span>{(d as any).codeSnippet}
                              </pre>
                            </div>
                          )}

                          {/* AI Suggestion */}
                          <div className="flex items-start gap-1.5 text-xs text-[var(--color-accent-primary)]">
                            <Sparkles size={11} className="shrink-0 mt-0.5" />
                            <span>{d.suggestion}</span>
                          </div>

                          {/* Quick Fix */}
                          {d.targetContent && d.replacementContent && (
                            <div className="flex flex-col gap-2">
                              <div className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Proposed Fix</div>
                              <pre className="rounded bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/30 px-3 py-2 text-[11px] font-mono text-[var(--color-status-success)] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                {d.replacementContent}
                              </pre>
                              <button
                                onClick={() => applyQuickFix(d.id, d.filePath)}
                                className="bg-[#2ea043] hover:bg-[#2c974b] text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
                              >
                                <Zap size={11} /> Apply Quick Fix
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Todo List */}
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Workspace TODO Index
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {todos.filter(t => t.completed).length} / {todos.length} tasks completed
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoInput}
              onChange={(e) => setNewTodoInput(e.target.value)}
              placeholder="Add a new task..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTodoInput.trim()) {
                  addTodo('', 0, newTodoInput.trim());
                  setNewTodoInput('');
                }
              }}
              className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
            />
            <button
              onClick={() => {
                if (newTodoInput.trim()) {
                  addTodo('', 0, newTodoInput.trim());
                  setNewTodoInput('');
                }
              }}
              className="rounded bg-[var(--color-accent-primary)] px-3 py-1.5 text-white hover:bg-[var(--color-accent-hover)] flex items-center justify-center cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex gap-2.5 items-start p-2 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] group ${todo.completed ? 'opacity-50' : ''}`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="text-[var(--color-accent-primary)] shrink-0 mt-0.5 cursor-pointer"
                >
                  {todo.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs text-[var(--color-text-primary)] leading-tight ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </div>
                  {todo.filePath && (
                    <div className="text-[9px] text-[var(--color-text-muted)] mt-1 font-mono">
                      {todo.filePath}:{todo.line}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BYOK API Key Modal — Dynamic providers */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl shadow-2xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <Key size={16} className="text-[var(--color-accent-primary)]" />
                Configure AI Provider Key
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Configure your AI Provider API key. Your key is stored locally and never sent anywhere except the provider's API.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">Provider</label>
                <select
                  value={tempProviderId}
                  onChange={(e) => setTempProviderId(e.target.value)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">API Key / Token</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your API Key..."
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-1.5 rounded text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                disabled={!tempApiKey}
                className="px-4 py-1.5 rounded bg-[var(--color-accent-primary)] text-white text-xs font-bold hover:bg-[var(--color-accent-hover)] cursor-pointer disabled:opacity-50"
              >
                Save Securely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
