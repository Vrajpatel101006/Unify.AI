import { useState, useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { Folder, FileText, Plus, FolderPlus, Pin, Star, Trash2, Copy, Check, Save, Download, Upload, History } from 'lucide-react';

export function PromptWorkspace() {
  const {
    prompts,
    folders,
    selectedPromptId,
    selectedFolderId,
    addFolder,
    removeFolder,
    addPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    togglePin,
    selectPrompt,
    selectFolder,
    createNewVersion,
    exportPrompts,
    importPrompts
  } = usePromptStore();

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  // Editor States
  const [editorName, setEditorName] = useState(selectedPrompt?.name || '');
  const [editorDesc, setEditorDesc] = useState(selectedPrompt?.description || '');
  const [editorTemplate, setEditorTemplate] = useState(selectedPrompt?.userPromptTemplate || '');
  const [editorTags, setEditorTags] = useState(selectedPrompt?.tags.join(', ') || '');
  const [editorCategory, setEditorCategory] = useState(selectedPrompt?.category || 'general');

  // Preview / Variables Evaluation States
  const [variablesInput, setVariablesInput] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Folder modal states
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Synchronize editor states with selected prompt
  useEffect(() => {
    if (selectedPrompt) {
      setEditorName(selectedPrompt.name);
      setEditorDesc(selectedPrompt.description);
      setEditorTemplate(selectedPrompt.userPromptTemplate);
      setEditorTags(selectedPrompt.tags.join(', '));
      setEditorCategory(selectedPrompt.category);

      // Extract variables from template: {{name}}
      const matches = selectedPrompt.userPromptTemplate.match(/{{(.*?)}}/g) || [];
      const varNames = matches.map((m) => m.slice(2, -2).trim());
      const inputs: Record<string, string> = {};
      varNames.forEach((name) => {
        inputs[name] = variablesInput[name] || '';
      });
      setVariablesInput(inputs);
    }
  }, [selectedPromptId]);

  // Extract variables on template change
  const handleTemplateChange = (text: string) => {
    setEditorTemplate(text);
    const matches = text.match(/{{(.*?)}}/g) || [];
    const varNames = matches.map((m) => m.slice(2, -2).trim());
    const inputs: Record<string, string> = {};
    varNames.forEach((name) => {
      inputs[name] = variablesInput[name] || '';
    });
    setVariablesInput(inputs);
  };

  const handleSave = () => {
    if (!selectedPrompt) return;
    const matches = editorTemplate.match(/{{(.*?)}}/g) || [];
    const variables = matches.map((m) => m.slice(2, -2).trim());

    updatePrompt(selectedPrompt.id, {
      name: editorName,
      description: editorDesc,
      userPromptTemplate: editorTemplate,
      category: editorCategory,
      tags: editorTags.split(',').map((s) => s.trim()).filter(Boolean),
      variables,
    });

    // Create a new version log
    createNewVersion(selectedPrompt.id, editorTemplate);
    alert('Prompt template saved & versioned.');
  };

  const handleCreatePrompt = () => {
    addPrompt({
      folderId: selectedFolderId,
      name: 'New Prompt Template',
      description: 'Template description',
      category: 'general',
      userPromptTemplate: 'Hello {{name}}!',
      variables: ['name'],
      tags: [],
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName) return;
    addFolder(newFolderName, selectedFolderId);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Compile output live
  const compilePrompt = () => {
    if (!editorTemplate) return '';
    let compiled = editorTemplate;
    Object.entries(variablesInput).forEach(([name, value]) => {
      compiled = compiled.replace(new RegExp(`{{${name}}}`, 'g'), value);
    });
    return compiled;
  };

  const handleCopy = () => {
    const text = compilePrompt();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportPrompts());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "unify_prompts_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (typeof result === 'string') {
        importPrompts(result);
        alert('Prompts imported successfully.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] select-text">
      {/* 1st Pane: Tree Hierarchy */}
      <div className="w-[240px] border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex flex-col">
        <div className="p-3 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Workspace Folders
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
              title="Create Folder"
            >
              <FolderPlus size={13} />
            </button>
            <button
              onClick={handleCreatePrompt}
              className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
              title="Create Prompt"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {isCreatingFolder && (
          <div className="p-2 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] flex gap-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-0.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            />
            <button
              onClick={handleCreateFolder}
              className="rounded bg-[var(--color-accent-primary)] px-2 text-[10px] font-semibold text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        {/* Tree Lists */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
          {/* Folders */}
          <div>
            <div className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase px-2 mb-1">
              Folders
            </div>
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => selectFolder(selectedFolderId === f.id ? null : f.id)}
                className={`flex items-center justify-between rounded px-2 py-1 cursor-pointer transition-all ${
                  selectedFolderId === f.id
                    ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Folder size={13} />
                  <span>{f.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete folder "${f.name}"?`)) removeFolder(f.id);
                  }}
                  className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* Prompts list */}
          <div className="border-t border-[var(--color-border-default)] pt-2">
            <div className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase px-2 mb-1">
              Templates
            </div>
            {prompts
              .filter((p) => !selectedFolderId || p.folderId === selectedFolderId)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectPrompt(p.id)}
                  className={`flex items-center justify-between rounded px-2 py-1.5 cursor-pointer transition-all ${
                    selectedPromptId === p.id
                      ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border-l-2 border-[var(--color-accent-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs truncate">
                    <FileText size={12} className="shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.isPinned && <Pin size={10} className="text-[var(--color-accent-primary)]" />}
                    {p.isFavorite && <Star size={10} className="text-[var(--color-status-warning)]" />}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Porting Actions */}
        <div className="p-3 border-t border-[var(--color-border-default)] flex justify-between gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] py-1.5 text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download size={11} /> Export
          </button>
          <label className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] py-1.5 text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-1 cursor-pointer text-center">
            <Upload size={11} /> Import
            <input type="file" onChange={handleImport} accept=".json" className="hidden" />
          </label>
        </div>
      </div>

      {/* 2nd Pane: Workspace Editor Panel */}
      {selectedPrompt ? (
        <div className="flex-1 flex flex-col border-r border-[var(--color-border-default)] min-w-0">
          {/* Header toolbar */}
          <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <input
                type="text"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                placeholder="Template Title"
                className="font-semibold text-sm text-[var(--color-text-primary)] bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              />
              <input
                type="text"
                value={editorDesc}
                onChange={(e) => setEditorDesc(e.target.value)}
                placeholder="Short description of this template"
                className="text-xs text-[var(--color-text-muted)] bg-transparent border-none focus:outline-none focus:ring-0 mt-0.5 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePin(selectedPrompt.id)}
                className={`p-1.5 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer ${
                  selectedPrompt.isPinned ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'
                }`}
                title="Pin Prompt"
              >
                <Pin size={14} />
              </button>
              <button
                onClick={() => toggleFavorite(selectedPrompt.id)}
                className={`p-1.5 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer ${
                  selectedPrompt.isFavorite ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-text-muted)]'
                }`}
                title="Star Prompt"
              >
                <Star size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this prompt template?')) deletePrompt(selectedPrompt.id);
                }}
                className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 cursor-pointer"
                title="Delete Template"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={handleSave}
                className="rounded bg-[var(--color-accent-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1 cursor-pointer"
              >
                <Save size={12} /> Save
              </button>
            </div>
          </div>

          {/* Prompt Rich Text Editor Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Template Body
              </label>
              <textarea
                value={editorTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                placeholder="Write your template here. Inject variables using {{variableName}} tag syntax."
                className="flex-1 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 text-xs font-mono text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none leading-relaxed min-h-[200px]"
              />
            </div>

            {/* Bottom editor configs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Category
                </label>
                <select
                  value={editorCategory}
                  onChange={(e) => setEditorCategory(e.target.value)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="sql">Database (SQL)</option>
                  <option value="api">API Collection</option>
                  <option value="code">Code refactoring</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editorTags}
                  onChange={(e) => setEditorTags(e.target.value)}
                  placeholder="e.g. postgres, clean-code"
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                />
              </div>
            </div>

            {/* Version logs */}
            <div className="border-t border-[var(--color-border-default)] pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1">
                <History size={12} /> Revision Log
              </h4>
              <div className="flex flex-col gap-1.5">
                {selectedPrompt.history.map((ver) => (
                  <div
                    key={ver.version}
                    className="flex items-center justify-between rounded bg-[var(--color-bg-tertiary)] px-3 py-2 text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">v{ver.version}</span>
                      <span className="text-[var(--color-text-muted)] ml-2">by {ver.author}</span>
                    </div>
                    <span className="text-[var(--color-text-muted)]">
                      {new Date(ver.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
          Select or create a prompt template to edit
        </div>
      )}

      {/* 3rd Pane: Interactive Variable Evaluator Output compiler */}
      {selectedPrompt ? (
        <div className="w-[300px] bg-[var(--color-bg-tertiary)] flex flex-col p-4 gap-4 overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Variable Evaluator</h4>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Input parameters to build prompt</p>
          </div>

          {Object.keys(variablesInput).length > 0 ? (
            <div className="flex flex-col gap-3">
              {Object.keys(variablesInput).map((varName) => (
                <div key={varName} className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                    {varName}
                  </label>
                  <input
                    type="text"
                    value={variablesInput[varName] || ''}
                    onChange={(e) =>
                      setVariablesInput({ ...variablesInput, [varName]: e.target.value })
                    }
                    placeholder={`Enter value for ${varName}...`}
                    className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--color-text-muted)] italic">
              No variables found in template. Use {"{{variableName}}"} to define.
            </div>
          )}

          <div className="border-t border-[var(--color-border-default)] pt-4 flex-1 flex flex-col min-h-[150px]">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Compiled Prompt Preview
            </h4>
            <div className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-3 text-[11px] font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-y-auto max-h-[250px]">
              {compilePrompt() || <span className="text-[var(--color-text-muted)] italic">Preview is empty</span>}
            </div>

            <button
              onClick={handleCopy}
              className={`w-full rounded mt-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                copied
                  ? 'bg-[var(--color-status-success)] text-white'
                  : 'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-hover)]'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
