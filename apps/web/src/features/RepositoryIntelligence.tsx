import { useFeatureStore } from '../stores/featureStores';
import { Network, CheckCircle2, RefreshCw, BarChart2 } from 'lucide-react';

export function RepositoryIntelligence() {
  const { repoIntel } = useFeatureStore();
  const { languages, dependencies, detectedFrameworks, totalFiles, totalLines, architectureType, scanStatus, triggerScan } = repoIntel;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] p-6 overflow-y-auto select-text">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-[var(--color-border-default)] pb-4 mb-6 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Network size={16} className="text-[var(--color-accent-primary)]" />
            Repository Intelligence Index
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Structural indexing, language ratios, dependency mapping and architecture graphs.
          </p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanStatus === 'scanning'}
          className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={scanStatus === 'scanning' ? 'animate-spin' : ''} />
          <span>{scanStatus === 'scanning' ? 'Scanning...' : 'Scan Repository'}</span>
        </button>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Repository Statistics */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Metadata Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
              <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Indexed files</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{totalFiles} files</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
              <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Lines of Code</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{totalLines.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
              <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Architecture Style</div>
              <div className="text-xs font-semibold text-[var(--color-accent-primary)] mt-1 truncate" title={architectureType}>
                {architectureType}
              </div>
            </div>
          </div>

          {/* Languages Distribution Bar */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 flex items-center gap-1">
              <BarChart2 size={13} /> Code Language Composition
            </h3>
            <div className="h-3 w-full rounded-full bg-[var(--color-bg-tertiary)] flex overflow-hidden mb-4">
              {languages.map((l) => (
                <div
                  key={l.language}
                  style={{ width: `${l.percentage}%`, backgroundColor: l.color }}
                  title={`${l.language}: ${l.percentage}%`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {languages.map((l) => (
                <div key={l.language} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">{l.language}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {l.percentage}% • {l.filesCount} files
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dependency Nodes Tree Graph list */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Monorepo Module Dependencies Graph Map
            </h3>
            <div className="flex flex-col gap-3">
              {dependencies.map((node) => (
                <div
                  key={node.id}
                  className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-[var(--color-text-primary)] font-mono">
                      {node.label}
                    </span>
                    <span className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 text-[9px] text-[var(--color-text-secondary)]">
                      {node.type}
                    </span>
                  </div>
                  {node.dependsOn.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] mr-1">Depends on:</span>
                      {node.dependsOn.map((dep) => (
                        <span
                          key={dep}
                          className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-text-secondary)]"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[9px] text-[var(--color-text-muted)] italic">No internal dependency bindings.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Frameworks Detector & Scans logs */}
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Detected Stack & Frameworks
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detectedFrameworks.map((f) => (
              <span
                key={f}
                className="rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] px-3 py-1 text-xs text-[var(--color-text-primary)] flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} className="text-[var(--color-status-success)]" />
                <span>{f}</span>
              </span>
            ))}
          </div>

          <div className="border-t border-[var(--color-border-default)] pt-4 mt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Indexer Activities
            </h4>
            <div className="rounded bg-[var(--color-bg-tertiary)] p-3 font-mono text-[10px] text-[var(--color-text-secondary)] leading-relaxed flex flex-col gap-1">
              <div>[18:36:01] Booting analyzer engine core scheduler...</div>
              <div>[18:36:02] Matching pattern globs for workspaces modules.</div>
              <div>[18:36:03] Language parser registered: .ts, .cs, .css, .html.</div>
              <div>[18:36:04] Scanned 131 directories file trees. Index compilation completed.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
