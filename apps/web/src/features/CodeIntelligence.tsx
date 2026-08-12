import { useState, useEffect } from 'react';
import { useFeatureStore } from '../stores/featureStores';
import { useProviderStore } from '../stores/providerStore';
import { Cpu, AlertTriangle, AlertCircle, Info, CheckSquare, Square, Sparkles, Activity, Key, Settings, Zap, RefreshCw, XCircle, Trash2, Plus } from 'lucide-react';

export function CodeIntelligence() {
  const { codeIntel } = useFeatureStore();
  const { diagnostics, todos, selectedFileAnalysis, analyzeFile, toggleTodo, isAnalyzing, analysisError, applyQuickFix, addTodo, removeTodo } = codeIntel;
  const { providers, addOrUpdateProvider } = useProviderStore();

  const [filePathInput, setFilePathInput] = useState('apps/web/src/layouts/AppShell.tsx');
  const [newTodoInput, setNewTodoInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempProviderId, setTempProviderId] = useState('huggingface');

  // Popup logic on load
  useEffect(() => {
    const activeProvider = providers.find(p => p.isActive) || providers[0];
    if (!activeProvider || !activeProvider.apiKey) {
      if (activeProvider) {
        setTempProviderId(activeProvider.id);
      }
      setShowKeyModal(true);
    }
  }, [providers]);

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
    if (!filePathInput) return;
    
    const activeProvider = providers.find(p => p.isActive) || providers[0];
    if (!activeProvider || !activeProvider.apiKey) {
      setShowKeyModal(true);
      return;
    }

    analyzeFile(filePathInput);
  };

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
            Dead code diagnostics, function code complexity metrics, code warnings, and repository TODO indexes.
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

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Diagnostics warnings */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* File Analyzer tool */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              File Code Quality Analyzer
            </h3>
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

            {analysisError && (
              <div className="rounded border border-[var(--color-status-error)] bg-[var(--color-status-error)]/10 p-3 mt-2 flex items-start gap-2">
                <XCircle size={14} className="text-[var(--color-status-error)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--color-status-error)] leading-relaxed">
                  <span className="font-bold">Analysis Failed:</span> {analysisError}
                </div>
              </div>
            )}

            {selectedFileAnalysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)]">Quality Grade</div>
                  <div className="text-xl font-extrabold text-[var(--color-accent-primary)] mt-1">
                    {selectedFileAnalysis.grade}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)]">Complexity Score</div>
                  <div className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                    {selectedFileAnalysis.complexityScore}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)]">Lines of Code</div>
                  <div className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                    {selectedFileAnalysis.linesOfCode}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)]">Functions Count</div>
                  <div className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                    {selectedFileAnalysis.functionsCount}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostics list */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Diagnostics & Issues List
            </h3>
            <div className="flex flex-col gap-3">
              {diagnostics.map((d) => {
                const isError = d.severity === 'error';
                const isWarn = d.severity === 'warning';

                return (
                  <div
                    key={d.id}
                    className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {isError ? (
                          <AlertCircle size={14} className="text-[var(--color-status-error)] shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle size={14} className="text-[var(--color-status-warning)] shrink-0" />
                        ) : (
                          <Info size={14} className="text-[var(--color-status-info)] shrink-0" />
                        )}
                        <span className="font-semibold text-xs text-[var(--color-text-primary)] leading-tight">
                          {d.message}
                        </span>
                      </div>
                      <span className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--color-text-secondary)]">
                        {d.type}
                      </span>
                    </div>

                    <div className="text-[10px] text-[var(--color-text-muted)] font-mono leading-tight">
                      File: {d.filePath}:{d.line}
                    </div>

                    <div className="mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded px-2.5 py-1.5 text-[11px] text-[var(--color-accent-primary)] flex flex-col gap-1.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="shrink-0" />
                        <span>Suggestion: {d.suggestion}</span>
                      </div>
                      
                      {d.targetContent && d.replacementContent && (
                        <div className="mt-1 pt-1.5 border-t border-[var(--color-border-default)]/50">
                          <button
                            onClick={() => applyQuickFix(d.id, d.filePath)}
                            className="bg-[#2ea043] hover:bg-[#2c974b] text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
                          >
                            <Zap size={11} /> Apply Quick Fix
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Todo checker */}
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Workspace TODO Index
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Summary: {todos.filter(t => t.completed).length} / {todos.length} tasks completed
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
                className={`flex gap-2.5 items-start p-2 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] group ${
                  todo.completed ? 'opacity-50' : ''
                }`}
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

      {/* BYOK API Key Modal */}
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
                Please configure your AI Provider API key to use the Code Optimizer. This ensures your code is analyzed securely using your own tokens.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">Provider</label>
                <select
                  value={tempProviderId}
                  onChange={(e) => setTempProviderId(e.target.value)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                >
                  <option value="huggingface">Hugging Face</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
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
