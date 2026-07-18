import { useState } from 'react';
import { useFeatureStore, type DocFile } from '../stores/featureStores';
import { FileText, Sparkles, Download, Copy, Check, Save, RefreshCw } from 'lucide-react';

export function DocumentationWorkspace() {
  const { doc } = useFeatureStore();
  const { docs, generateDoc, updateDocContent } = doc;

  const [activeDoc, setActiveDoc] = useState<DocFile | null>(docs[0] || null);
  const [docContent, setDocContent] = useState(activeDoc?.content || '');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Selector form inputs
  const [docType, setDocType] = useState<DocFile['type']>('readme');
  const [docContextInput, setDocContextInput] = useState('Workspace project dependencies and features overview.');

  const handleSelect = (d: DocFile) => {
    setActiveDoc(d);
    setDocContent(d.content);
    setCopied(false);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      generateDoc(docType, docContextInput);
      setGenerating(false);
      // Retrieve the generated document
      const freshDocs = useFeatureStore.getState().doc.docs;
      const generated = freshDocs.find((d) => d.type === docType);
      if (generated) handleSelect(generated);
      alert('Documentation compiled successfully.');
    }, 1200);
  };

  const handleSave = () => {
    if (!activeDoc) return;
    updateDocContent(activeDoc.id, docContent);
    alert('Document changes saved.');
  };

  const handleCopy = () => {
    if (!docContent) return;
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(docContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", activeDoc.title);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] select-text">
      {/* Left Sidebar: Document template selector & generators */}
      <div className="w-[260px] border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            AI Documentation Generator
          </span>
        </div>

        {/* Generator config card */}
        <div className="p-3 border-b border-[var(--color-border-default)] flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Doc Template</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
            >
              <option value="readme">README.md template</option>
              <option value="api">API Endpoint Reference</option>
              <option value="architecture">Architecture Map Docs</option>
              <option value="changelog">Changelog / Release Notes</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Specialized context</label>
            <textarea
              value={docContextInput}
              onChange={(e) => setDocContextInput(e.target.value)}
              placeholder="e.g. explain the postgres layout or vite dependencies"
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-2 text-xs text-[var(--color-text-secondary)] focus:outline-none resize-none h-16"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded bg-[var(--color-accent-primary)] py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>{generating ? 'Generating...' : 'Generate Doc'}</span>
          </button>
        </div>

        {/* Document files list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          <div className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase px-2 mb-1">
            Document Files
          </div>
          {docs.map((d) => (
            <div
              key={d.id}
              onClick={() => handleSelect(d)}
              className={`flex items-center gap-2 rounded px-2.5 py-2 cursor-pointer transition-all ${
                activeDoc?.id === d.id
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)] border-l-2 border-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <FileText size={13} className="shrink-0" />
              <div className="truncate min-w-0">
                <div className="text-xs font-semibold truncate">{d.title}</div>
                <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                  Type: {d.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Markdown Content Editor */}
      {activeDoc ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-[var(--color-border-default)] flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Viewing: {activeDoc.title}
              </h3>
              <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                Last updated: {new Date(activeDoc.updatedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer ${
                  copied ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-muted)]'
                }`}
                title="Copy Markdown"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
                title="Download File"
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleSave}
                className="rounded bg-[var(--color-accent-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={12} />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 flex gap-4 min-h-0">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Markdown Source
              </label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="flex-1 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 text-xs font-mono text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col border-l border-[var(--color-border-default)] pl-4">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Compiled Document Preview
              </label>
              <div className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 text-xs text-[var(--color-text-secondary)] overflow-y-auto whitespace-pre-wrap leading-relaxed max-h-[450px]">
                {docContent || <span className="text-[var(--color-text-muted)] italic">Preview is empty</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
          Select or generate a document file template
        </div>
      )}
    </div>
  );
}
