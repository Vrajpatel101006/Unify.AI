import { useState } from 'react';
import { useFeatureStore, type SqlQueryLog } from '../stores/featureStores';
import { useProjectStore } from '../stores/projectStore';
import { Terminal, Table, Play, CheckCircle2, FileCode, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';

export function DatabaseWorkspace() {
  const { database } = useFeatureStore();
  const { tables, queryLogs, executeQuery, clearQueryLogs } = database;
  const { projectFiles } = useProjectStore();

  const [activeTable, setActiveTable] = useState(tables[0] || null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [activeLog, setActiveLog] = useState<SqlQueryLog | null>(queryLogs[0] || null);
  const [loadingFile, setLoadingFile] = useState(false);

  const handleLoadSqlFile = async (filePath: string) => {
    setLoadingFile(true);
    try {
      const res = await fetch('/api/local/files/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (res.ok) setSqlQuery(data.content);
    } catch { /* ignore */ }
    setLoadingFile(false);
  };

  const SQL_TEMPLATES = [
    { label: 'SELECT All', query: 'SELECT * FROM {table} LIMIT 50;' },
    { label: 'Count Rows', query: 'SELECT COUNT(*) FROM {table};' },
    { label: 'INSERT Row', query: 'INSERT INTO {table} () VALUES ();' },
    { label: 'UPDATE Row', query: 'UPDATE {table} SET column = value WHERE id = ?;' },
    { label: 'DELETE Row', query: 'DELETE FROM {table} WHERE id = ?;' },
    { label: 'Create Index', query: 'CREATE INDEX idx_{table}_col ON {table} (column);' },
  ];

  const handleInsertTemplate = (template: string) => {
    const tableName = activeTable?.tableName || 'table_name';
    setSqlQuery(template.replace(/{table}/g, tableName));
  };

  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    if (!sqlQuery) return;
    setExecuting(true);
    try {
      const log = await executeQuery(sqlQuery);
      setActiveLog(log);
    } catch { /* ignore */ }
    setExecuting(false);
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] select-text">
      {/* Left sidebar: Tables Explorer + Project SQL Files */}
      <div className="w-[240px] border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Tables Explorer
          </span>
          <span className="rounded bg-[var(--color-status-success)]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-status-success)]">
            Connected
          </span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Schema Tables */}
          {tables.length === 0 ? (
            <div className="p-3 text-[11px] text-[var(--color-text-secondary)] flex flex-col gap-3 leading-relaxed">
              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3 flex flex-col gap-2.5">
                <span className="font-bold text-[var(--color-text-primary)] uppercase text-[9px] tracking-wider">How to Add Databases</span>
                <div className="flex flex-col gap-1.5">
                  <p className="font-semibold text-[var(--color-accent-primary)]">Option A: Project Files</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    Open a project folder containing `.sql` or `.db` files in the Repository Workspace. They will automatically sync here under "Project SQL Files".
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-[var(--color-border-default)] pt-2.5">
                  <p className="font-semibold text-[var(--color-accent-primary)]">Option B: Custom Connection</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    Click the **`+` (Plus) button** at the top of the **Connections** panel in the left sidebar to add custom connection strings (e.g. Postgres, MySQL, or local SQLite).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-1.5">
              {tables.map((t) => (
                <div
                  key={t.tableName}
                  onClick={() => setActiveTable(t)}
                  className={`flex items-center gap-2 rounded px-2.5 py-2 cursor-pointer transition-all ${
                    activeTable?.tableName === t.tableName
                      ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)] border-l-2 border-[var(--color-accent-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <Table size={13} className="shrink-0" />
                  <div className="truncate min-w-0">
                    <div className="text-xs font-semibold truncate">{t.tableName}</div>
                    <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{t.rowCount} rows</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project SQL Files */}
          {projectFiles.sqlFiles.length > 0 && (
            <div className="border-t border-[var(--color-border-default)] p-2 flex flex-col gap-1">
              <div className="text-[9px] font-bold uppercase text-[var(--color-text-muted)] px-2 mb-1 flex items-center gap-1">
                <FileCode size={10} /> Project SQL Files
              </div>
              {projectFiles.sqlFiles.map((f) => (
                <button
                  key={f}
                  onClick={() => handleLoadSqlFile(f)}
                  disabled={loadingFile}
                  className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent-primary)] cursor-pointer transition-all disabled:opacity-50"
                >
                  <ChevronRight size={10} className="shrink-0" />
                  <span className="truncate">{f.split(/[\/\\]/).pop()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Pane: Query editor & logs console */}
      <div className="flex-1 flex flex-col border-r border-[var(--color-border-default)] min-w-0">
        {/* SQL Script input editor */}
        <div className="p-4 border-b border-[var(--color-border-default)] flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Terminal size={14} className="text-[var(--color-accent-primary)]" /> SQL Query Terminal
            </h3>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="rounded bg-[var(--color-accent-primary)] px-4 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {executing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>{executing ? 'Running...' : 'Execute'}</span>
            </button>
          </div>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3 text-xs font-mono text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none h-28"
            placeholder="Write SQL statements here..."
          />
          {/* AI Query Templates */}
          <div className="flex flex-col gap-1">
            <div className="text-[9px] font-bold uppercase text-[var(--color-text-muted)] flex items-center gap-1">
              <Sparkles size={9} /> Premade Query Templates
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SQL_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleInsertTemplate(t.query)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-primary)] hover:text-white hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execution output log preview */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Query Result Console
            </h4>
            {activeLog ? (
              <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden">
                <div className="bg-[var(--color-bg-tertiary)] px-4 py-2 border-b border-[var(--color-border-default)] flex justify-between items-center text-[10px]">
                  <span className="font-mono text-[var(--color-text-muted)] truncate max-w-[200px]" title={activeLog.query}>
                    Query: {activeLog.query}
                  </span>
                  <div className="flex gap-3">
                    <span className="text-[var(--color-text-muted)]">Latency: {activeLog.executionTimeMs}ms</span>
                    <span className={activeLog.status === 'success' ? 'text-[var(--color-status-success)] font-semibold' : 'text-[var(--color-status-error)] font-semibold'}>
                      {activeLog.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4 font-mono text-xs text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                  {activeLog.resultSummary}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-10 text-center text-xs text-[var(--color-text-muted)] italic">
                Terminal output console. Execute a query to display logs.
              </div>
            )}
          </div>

          {/* Table schema explorer preview */}
          {activeTable && (
            <div className="border-t border-[var(--color-border-default)] pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Schema Definition: {activeTable.tableName}
              </h4>
              <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)] text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                      <th className="px-4 py-2">Column name</th>
                      <th className="px-4 py-2">Data Type</th>
                      <th className="px-4 py-2 text-center">PK</th>
                      <th className="px-4 py-2 text-center">Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTable.columns.map((col) => (
                      <tr key={col.name} className="border-b border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]/30">
                        <td className="px-4 py-2 font-mono text-[var(--color-text-primary)] font-semibold">{col.name}</td>
                        <td className="px-4 py-2 font-mono text-[var(--color-text-secondary)]">{col.type}</td>
                        <td className="px-4 py-2 text-center">{col.isPrimaryKey ? <CheckCircle2 size={13} className="text-[var(--color-accent-primary)] mx-auto" /> : ''}</td>
                        <td className="px-4 py-2 text-center">{col.isNullable ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar: Executed Queries History */}
      <div className="w-[260px] bg-[var(--color-bg-tertiary)] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Query History</h4>
            <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">Logs of executed SQL calls</p>
          </div>
          <button
            onClick={clearQueryLogs}
            className="text-[9px] text-[var(--color-status-error)] hover:underline cursor-pointer"
          >
            Clear History
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {queryLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setActiveLog(log)}
              className={`rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-2.5 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-all ${
                activeLog?.id === log.id ? 'border-[var(--color-accent-primary)]' : ''
              }`}
            >
              <div className="flex justify-between items-center text-[9px] text-[var(--color-text-muted)] mb-1">
                <span>{new Date(log.executedAt).toLocaleTimeString()}</span>
                <span className={log.status === 'success' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}>
                  {log.executionTimeMs}ms
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--color-text-secondary)] truncate">
                {log.query}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
