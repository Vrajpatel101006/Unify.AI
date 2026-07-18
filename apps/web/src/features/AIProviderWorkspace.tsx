import { useState } from 'react';
import { useProviderStore, type ProviderConfig } from '../stores/providerStore';
import { ShieldAlert, CheckCircle2, ShieldCheck, RefreshCw, Eye, EyeOff, Plus, Trash2, Activity } from 'lucide-react';

export function AIProviderWorkspace() {
  const { providers, addOrUpdateProvider, removeProvider, setDefaultProvider, testLatency, clearUsage } = useProviderStore();
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(providers[0] || null);
  const [apiKey, setApiKey] = useState(selectedProvider?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(selectedProvider?.baseUrl || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Custom provider state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');

  const handleSelect = (p: ProviderConfig) => {
    setSelectedProvider(p);
    setApiKey(p.apiKey);
    setBaseUrl(p.baseUrl || '');
    setShowKey(false);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!selectedProvider) return;
    addOrUpdateProvider({
      id: selectedProvider.id,
      name: selectedProvider.name,
      apiKey,
      baseUrl: baseUrl || undefined,
      models: selectedProvider.models,
    });
    alert('Provider configuration updated successfully.');
  };

  const handleAddCustom = () => {
    if (!newId || !newName) return;
    addOrUpdateProvider({
      id: newId.toLowerCase(),
      name: newName,
      apiKey: '',
      models: ['custom-model-1'],
    });
    setIsAdding(false);
    setNewId('');
    setNewName('');
    alert('Custom provider added.');
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setTesting(true);
    try {
      await testLatency(selectedProvider.id);
      // Automatically update selection to show fresh latency
      const updated = useProviderStore.getState().providers.find((p) => p.id === selectedProvider.id);
      if (updated) setSelectedProvider(updated);
    } catch {
      alert('Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] select-text">
      {/* Left List Pane */}
      <div className="w-1/3 border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            AI Provider Channels
          </h3>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Add Custom Channel"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {providers.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all ${
                selectedProvider?.id === p.id
                  ? 'bg-[var(--color-bg-hover)] border-l-2 border-[var(--color-accent-primary)]'
                  : 'hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <div>
                <div className="font-semibold text-xs text-[var(--color-text-primary)]">{p.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {p.models[0] || 'No models'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.apiKey ? (
                  <CheckCircle2 size={13} className="text-[var(--color-status-success)]" />
                ) : (
                  <ShieldAlert size={13} className="text-[var(--color-status-error)]" />
                )}
                {p.isActive && (
                  <span className="rounded bg-[var(--color-accent-primary)]/20 px-1.5 py-0.5 text-[9px] text-[var(--color-accent-primary)]">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
        {isAdding ? (
          <div className="max-w-md flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--color-accent-primary)]">Add Custom OpenAI-Compatible Channel</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">Channel ID</label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="e.g. openrouter"
                className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">Channel Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. OpenRouter AI"
                className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setIsAdding(false)}
                className="rounded border border-[var(--color-border-default)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustom}
                className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
              >
                Add Channel
              </button>
            </div>
          </div>
        ) : selectedProvider ? (
          <div className="max-w-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{selectedProvider.name} Settings</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Configure credentials and models</p>
              </div>
              <div className="flex items-center gap-2">
                {!selectedProvider.isActive && (
                  <button
                    onClick={() => setDefaultProvider(selectedProvider.id)}
                    className="rounded border border-[var(--color-border-default)] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
                {selectedProvider.id !== 'gemini' && selectedProvider.id !== 'openai' && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this provider channel?')) {
                        removeProvider(selectedProvider.id);
                        setSelectedProvider(providers[0] || null);
                      }
                    }}
                    className="p-1.5 rounded text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 cursor-pointer"
                    title="Delete Channel"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Config Fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">API Credential Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter provider key or credential token"
                    className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-3 pr-10 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {selectedProvider.id === 'ollama' || selectedProvider.id.includes('custom') ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[var(--color-text-secondary)] font-medium">Custom Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                  />
                </div>
              ) : null}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
                >
                  Save Settings
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="rounded border border-[var(--color-border-default)] px-4 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testing ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
                {selectedProvider.latency !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-status-success)] pl-2">
                    <ShieldCheck size={14} />
                    <span>Speed: {selectedProvider.latency}ms</span>
                  </span>
                )}
              </div>
            </div>

            {/* Model List */}
            <div className="border-t border-[var(--color-border-default)] pt-5">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Available Models
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedProvider.models.map((model) => (
                  <span
                    key={model}
                    className="rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] px-3 py-0.5 text-xs text-[var(--color-text-secondary)]"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>

            {/* Usage Analytics */}
            <div className="border-t border-[var(--color-border-default)] pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Usage Statistics
                </h4>
                <button
                  onClick={() => clearUsage(selectedProvider.id)}
                  className="text-[10px] text-[var(--color-status-error)] hover:underline cursor-pointer"
                >
                  Clear Analytics
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase">Prompt Tokens</div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
                    {selectedProvider.usage.promptTokens.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase">Completion Tokens</div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
                    {selectedProvider.usage.completionTokens.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-3">
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase">Cost Estimate</div>
                  <div className="text-sm font-semibold text-[var(--color-status-success)] mt-1">
                    ${selectedProvider.usage.costEstimate.toFixed(5)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--color-text-muted)] text-center py-10">
            No provider channels configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
