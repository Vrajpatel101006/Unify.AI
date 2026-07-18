import { useState } from 'react';
import { useFeatureStore } from '../stores/featureStores';
import { Cpu, AlertTriangle, AlertCircle, Info, CheckSquare, Square, Sparkles, Activity } from 'lucide-react';

export function CodeIntelligence() {
  const { codeIntel } = useFeatureStore();
  const { diagnostics, todos, selectedFileAnalysis, analyzeFile, toggleTodo } = codeIntel;

  const [filePathInput, setFilePathInput] = useState('apps/web/src/layouts/AppShell.tsx');

  const handleAnalyze = () => {
    if (!filePathInput) return;
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
                className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer"
              >
                <Activity size={13} /> Analyze
              </button>
            </div>

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

                    <div className="mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded px-2.5 py-1.5 text-[11px] text-[var(--color-accent-primary)] flex items-center gap-1.5 font-medium">
                      <Sparkles size={11} className="shrink-0" />
                      <span>Suggestion: {d.suggestion}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Todo checker */}
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Workspace TODO Index
          </h3>
          <div className="flex flex-col gap-2.5">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className={`flex gap-2.5 items-start p-2 rounded-lg cursor-pointer transition-all hover:bg-[var(--color-bg-hover)] ${
                  todo.completed ? 'opacity-50' : ''
                }`}
              >
                <div className="text-[var(--color-accent-primary)] shrink-0 mt-0.5">
                  {todo.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs text-[var(--color-text-primary)] leading-tight ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </div>
                  <div className="text-[9px] text-[var(--color-text-muted)] mt-1 font-mono">
                    {todo.filePath}:{todo.line}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
