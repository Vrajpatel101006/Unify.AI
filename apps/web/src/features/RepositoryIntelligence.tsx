import { useFeatureStore } from '../stores/featureStores';
import { Network, CheckCircle2, RefreshCw, BarChart2, Database, Github, Clock } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useState, useEffect } from 'react';

export function RepositoryIntelligence() {
  const { repoIntel } = useFeatureStore();
  const { languages, dependencies, detectedFrameworks, totalFiles, totalLines, architectureType, scanStatus, triggerScan } = repoIntel;
  const { currentProject, openLocalProject, cloneProject, githubToken, githubTokenExpiresAt, setGithubToken, createGithubRepo, githubRepos } = useProjectStore();

  const [openPath, setOpenPath] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneDest, setCloneDest] = useState('');
  const [ghTokenInput, setGhTokenInput] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDest, setNewRepoDest] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [expirationOption, setExpirationOption] = useState('forever');
  const [timeLeftText, setTimeLeftText] = useState('');

  // Check token expiration on interval
  useEffect(() => {
    if (!githubToken) {
      setTimeLeftText('');
      return;
    }

    const updateTimeLeft = () => {
      if (githubTokenExpiresAt === null) {
        setTimeLeftText('Permanent (No expiration)');
        return;
      }

      const diff = githubTokenExpiresAt - Date.now();
      if (diff <= 0) {
        setGithubToken(null, null);
        setTimeLeftText('');
        alert('GitHub access token has expired and was disconnected.');
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        let text = '';
        if (days > 0) text += `${days}d `;
        if (hours > 0 || days > 0) text += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) text += `${minutes}m `;
        text += `${seconds}s left`;
        setTimeLeftText(text);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [githubToken, githubTokenExpiresAt, setGithubToken]);

  // Fetch repos on load if token exists but repos are empty
  const fetchGithubRepos = useProjectStore(state => state.fetchGithubRepos);
  useEffect(() => {
    if (githubToken && githubRepos.length === 0) {
      fetchGithubRepos();
    }
  }, [githubToken, githubRepos.length, fetchGithubRepos]);

  if (!currentProject) {
    return (
      <div className="flex flex-col h-full items-center text-xs select-text gap-6 bg-[var(--color-bg-primary)] p-6 overflow-y-auto">
        
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Repository Intelligence</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Connect a repository to analyze architecture, dependencies, and git history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Local Repository Options */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Database size={18} /> Open Local Repository</h2>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Local Path</label>
                <input 
                  type="text" 
                  value={openPath} 
                  onChange={e => setOpenPath(e.target.value)} 
                  placeholder="C:\path\to\repo" 
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                />
                <button 
                  onClick={() => openLocalProject(openPath)}
                  disabled={!openPath}
                  className="mt-2 rounded bg-[var(--color-accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Open Directory
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Clone External Repository</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Git URL</label>
                  <input 
                    type="text" 
                    value={cloneUrl} 
                    onChange={e => setCloneUrl(e.target.value)} 
                    placeholder="https://github.com/user/repo.git" 
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Destination Path</label>
                  <input 
                    type="text" 
                    value={cloneDest} 
                    onChange={e => setCloneDest(e.target.value)} 
                    placeholder="C:\path\to\destination" 
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>
                <button 
                  onClick={() => cloneProject(cloneUrl, cloneDest)}
                  disabled={!cloneUrl || !cloneDest}
                  className="mt-1 rounded bg-[var(--color-accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clone & Open
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Github size={18} /> GitHub Integration</h2>
              
              {!githubToken ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Connect your GitHub account using a Personal Access Token (PAT) to create repositories directly.
                  </p>
                  <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg border border-[var(--color-border-default)] text-[10px] text-[var(--color-text-secondary)] leading-relaxed flex flex-col gap-1.5">
                    <strong className="text-[var(--color-text-primary)]">How to get a PAT:</strong>
                    <ol className="list-decimal list-inside flex flex-col gap-1 ml-1">
                      <li>Go to GitHub Settings &gt; Developer settings.</li>
                      <li>Select <strong>Personal access tokens &gt; Tokens (classic)</strong>.</li>
                      <li>Click <strong>Generate new token (classic)</strong>.</li>
                      <li>Check the <strong>repo</strong> scope and generate.</li>
                      <li>Copy the token (it starts with <code className="bg-[var(--color-bg-primary)] px-1 py-0.5 rounded border border-[var(--color-border-default)]">ghp_</code>) and paste it below.</li>
                    </ol>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Personal Access Token</label>
                    <input 
                      type="password" 
                      value={ghTokenInput} 
                      onChange={e => setGhTokenInput(e.target.value)} 
                      placeholder="ghp_xxxxxxxxxxxx" 
                      className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Connection Lifetime</label>
                    <select 
                      value={expirationOption} 
                      onChange={e => setExpirationOption(e.target.value)}
                      className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] border-r-8 border-transparent"
                    >
                      <option value="forever">Forever (No expiration)</option>
                      <option value="1h">1 Hour</option>
                      <option value="1d">1 Day</option>
                      <option value="7d">7 Days</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      let expiresAt: number | null = null;
                      if (expirationOption === '1h') {
                        expiresAt = Date.now() + 60 * 60 * 1000;
                      } else if (expirationOption === '1d') {
                        expiresAt = Date.now() + 24 * 60 * 60 * 1000;
                      } else if (expirationOption === '7d') {
                        expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
                      }
                      setGithubToken(ghTokenInput, expiresAt);
                      setGhTokenInput('');
                    }}
                    disabled={!ghTokenInput}
                    className="mt-1 rounded bg-[#2ea043] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2c974b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Connect GitHub
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs bg-[var(--color-bg-primary)] p-3 rounded border border-[var(--color-border-default)]">
                    <div className="flex items-center gap-2 text-[var(--color-status-success)] font-bold">
                      <CheckCircle2 size={14} /> Connected
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] font-semibold bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded border border-[var(--color-border-default)]">
                      <Clock size={11} className="text-[var(--color-text-muted)]" />
                      <span>{timeLeftText}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-[var(--color-border-default)] pt-4 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Your GitHub Repositories</h3>
                    {githubRepos.length === 0 ? (
                      <div className="text-[10px] text-[var(--color-text-muted)] italic">Loading repositories...</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {githubRepos.map((repo: any) => (
                          <div key={repo.id} className="flex items-center justify-between bg-[var(--color-bg-tertiary)] p-2 rounded border border-[var(--color-border-default)]">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{repo.full_name}</span>
                              <span className="text-[9px] text-[var(--color-text-muted)] truncate">{repo.description || 'No description'}</span>
                            </div>
                            <button
                              onClick={() => {
                                const dest = window.prompt(`Enter local destination path for cloning ${repo.name}:`, `C:\\Users\\dell\\Desktop\\${repo.name}`);
                                if (dest) {
                                  cloneProject(repo.clone_url, dest);
                                }
                              }}
                              className="ml-2 shrink-0 rounded bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors"
                            >
                              Clone
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--color-border-default)] pt-4 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Create New Repository</h3>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Repository Name</label>
                      <input 
                        type="text" 
                        value={newRepoName} 
                        onChange={e => setNewRepoName(e.target.value)} 
                        placeholder="my-awesome-project" 
                        className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Local Destination Path</label>
                      <input 
                        type="text" 
                        value={newRepoDest} 
                        onChange={e => setNewRepoDest(e.target.value)} 
                        placeholder="C:\path\to\my-awesome-project" 
                        className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        setIsCreatingRepo(true);
                        await createGithubRepo(newRepoName, newRepoDest);
                        setIsCreatingRepo(false);
                      }}
                      disabled={!newRepoName || !newRepoDest || isCreatingRepo}
                      className="mt-1 flex items-center justify-center gap-2 rounded bg-[var(--color-accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCreatingRepo && <RefreshCw size={12} className="animate-spin" />}
                      {isCreatingRepo ? 'Creating & Cloning...' : 'Create & Clone Repo'}
                    </button>
                  </div>
                  <div className="pt-2 flex">
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to disconnect your GitHub account?')) {
                          setGithubToken(null);
                        }
                      }}
                      className="flex items-center gap-2 rounded border border-[var(--color-status-error)] px-3 py-1.5 text-[10px] font-semibold text-[var(--color-status-error)] hover:bg-[var(--color-status-error)] hover:text-white transition-colors"
                    >
                      Disconnect GitHub Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
