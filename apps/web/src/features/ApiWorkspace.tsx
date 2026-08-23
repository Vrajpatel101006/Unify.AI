import { useState, useEffect } from 'react';
import { useFeatureStore, type ApiEndpoint } from '../stores/featureStores';
import { Plus, Send, Trash2, Edit, Save } from 'lucide-react';

export function ApiWorkspace() {
  const { api } = useFeatureStore();
  const { endpoints, envVariables, activeEnv, setActiveEnv, addEndpoint, deleteEndpoint, updateEndpoint } = api;

  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(endpoints[0] || null);

  // Sync selected endpoint when list changes
  useEffect(() => {
    if (selectedEndpoint) {
      const exists = endpoints.find(e => e.id === selectedEndpoint.id);
      if (!exists) {
        setSelectedEndpoint(endpoints[0] || null);
      }
    } else if (endpoints.length > 0) {
      setSelectedEndpoint(endpoints[0]);
    }
  }, [endpoints, selectedEndpoint]);

  // Parameter editor inputs
  const [paramsInput, setParamsInput] = useState<Record<string, string>>({});
  const [responseOutput, setResponseOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editMethod, setEditMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [editPath, setEditPath] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMockResponse, setEditMockResponse] = useState('');

  // New endpoint modal
  const [showAdd, setShowAdd] = useState(false);
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [newPath, setNewPath] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleSelect = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setResponseOutput(ep.mockResponse);
    setIsEditing(false);
    const inputs: Record<string, string> = {};
    ep.params.forEach((p) => {
      inputs[p.key] = p.value || '';
    });
    setParamsInput(inputs);
  };

  const handleSend = () => {
    if (!selectedEndpoint) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResponseOutput(selectedEndpoint.mockResponse);
    }, 500);
  };

  const handleAddEndpoint = () => {
    if (!newPath) return;
    addEndpoint({
      method: newMethod,
      path: newPath,
      description: newDesc,
      headers: [{ key: 'Accept', value: 'application/json' }],
      params: [],
      mockResponse: JSON.stringify({ success: true, message: 'Mock response generated successfully' }, null, 2),
    });
    setShowAdd(false);
    setNewPath('');
    setNewDesc('');
  };

  const handleStartEdit = () => {
    if (!selectedEndpoint) return;
    setEditMethod(selectedEndpoint.method);
    setEditPath(selectedEndpoint.path);
    setEditDesc(selectedEndpoint.description);
    setEditMockResponse(selectedEndpoint.mockResponse);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedEndpoint) return;
    updateEndpoint(selectedEndpoint.id, {
      method: editMethod,
      path: editPath,
      description: editDesc,
      mockResponse: editMockResponse
    });
    setIsEditing(false);
    // Refresh selected endpoint values
    setTimeout(() => {
      const updated = useFeatureStore.getState().api.endpoints.find(e => e.id === selectedEndpoint.id);
      if (updated) {
        setSelectedEndpoint(updated);
        setResponseOutput(updated.mockResponse);
      }
    }, 50);
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg-primary)] select-text">
      {/* Left Pane: API Collections */}
      <div className="w-[260px] border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            API Collections
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Add New Endpoint"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {endpoints.length === 0 ? (
            <div className="text-[11px] text-[var(--color-text-muted)] italic text-center py-4">
              No endpoints. Click + to add.
            </div>
          ) : (
            endpoints.map((ep) => {
              const isGet = ep.method === 'GET';
              const isPost = ep.method === 'POST';
              const isSelected = selectedEndpoint?.id === ep.id;

              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelect(ep)}
                  className={`flex items-center justify-between gap-2 rounded-lg p-2.5 cursor-pointer transition-all group ${
                    isSelected
                      ? 'bg-[var(--color-bg-hover)] border-l-2 border-[var(--color-accent-primary)]'
                      : 'hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isGet ? 'bg-[var(--color-status-info)]/15 text-[var(--color-status-info)]' : isPost ? 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]' : 'bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning)]'
                    }`}>
                      {ep.method}
                    </span>
                    <div className="truncate min-w-0">
                      <div className="text-xs font-semibold truncate font-mono text-[var(--color-text-primary)]">
                        {ep.path}
                      </div>
                      <div className="text-[9px] text-[var(--color-text-muted)] truncate mt-0.5">
                        {ep.description}
                      </div>
                    </div>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEndpoint(ep.id);
                    }}
                    title="Delete endpoint"
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] hover:bg-[var(--color-bg-hover)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Middle Pane: Endpoint Editor / Edit Form */}
      {showAdd ? (
        <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)]">Add Endpoint Routing</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">HTTP Method</label>
            <select
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value as any)}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Path URL</label>
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g. /api/users/profile"
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description..."
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded border border-[var(--color-border-default)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEndpoint}
              className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
            >
              Add Route
            </button>
          </div>
        </div>
      ) : isEditing && selectedEndpoint ? (
        // Endpoint Edit Form
        <div className="flex-1 p-6 flex flex-col gap-4 max-w-xl overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)] flex items-center gap-1.5">
            <Edit size={14} /> Edit Endpoint details
          </h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">HTTP Method</label>
            <select
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value as any)}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Path URL</label>
            <input
              type="text"
              value={editPath}
              onChange={(e) => setEditPath(e.target.value)}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Description</label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-h-[160px]">
            <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Mock Response Console Payload (JSON)</label>
            <textarea
              value={editMockResponse}
              onChange={(e) => setEditMockResponse(e.target.value)}
              className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none resize-none min-h-[120px]"
            />
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-[var(--color-border-default)]">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded border border-[var(--color-border-default)] px-3.5 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={12} /> Save Changes
            </button>
          </div>
        </div>
      ) : selectedEndpoint ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Panel URL Bar */}
          <div className="p-4 border-b border-[var(--color-border-default)] flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {selectedEndpoint.description}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartEdit}
                  title="Edit details"
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] flex items-center gap-1 cursor-pointer"
                >
                  <Edit size={12} /> Edit
                </button>
                <select
                  value={activeEnv}
                  onChange={(e) => setActiveEnv(e.target.value)}
                  className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="Development">Dev Server</option>
                  <option value="Production">Prod Server</option>
                </select>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send size={12} />
                  <span>{loading ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </div>

            {/* URL input path bar */}
            <div className="flex rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden font-mono text-xs">
              <span className="bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border-default)] px-3.5 py-1.5 text-[var(--color-accent-primary)] font-bold shrink-0">
                {selectedEndpoint.method}
              </span>
              <span className="px-3 py-1.5 text-[var(--color-text-muted)] shrink-0">
                {envVariables.baseUrl}
              </span>
              <input
                type="text"
                readOnly
                value={selectedEndpoint.path}
                className="flex-1 bg-transparent px-1 py-1.5 text-[var(--color-text-primary)] focus:outline-none border-none ring-0 cursor-default"
              />
            </div>
          </div>

          {/* Request Config Panels */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            {/* Headers Config List */}
            {selectedEndpoint.headers.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Request Headers
                </h4>
                <div className="flex flex-col gap-1.5">
                  {selectedEndpoint.headers.map((h) => (
                    <div key={h.key} className="flex gap-2 font-mono text-xs">
                      <span className="rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] px-2.5 py-1 text-[var(--color-text-primary)] w-1/3 truncate">
                        {h.key}
                      </span>
                      <span className="flex-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[var(--color-text-secondary)] truncate">
                        {h.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parameters Config list */}
            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Request Parameters
                </h4>
                <div className="flex flex-col gap-2.5">
                  {selectedEndpoint.params.map((p) => (
                    <div key={p.key} className="flex flex-col gap-1 text-xs">
                      <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                        {p.key} {p.required && <span className="text-[var(--color-status-error)]">*</span>}
                      </label>
                      <input
                        type="text"
                        value={paramsInput[p.key] || ''}
                        onChange={(e) => setParamsInput({ ...paramsInput, [p.key]: e.target.value })}
                        className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                        placeholder="Enter parameter value..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Console */}
            <div className="border-t border-[var(--color-border-default)] pt-4 mt-2 flex-1 flex flex-col min-h-[200px]">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Response Console Preview
              </h4>
              <pre className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 text-xs font-mono text-[var(--color-text-secondary)] overflow-y-auto max-h-[300px] leading-relaxed">
                {responseOutput || <span className="text-[var(--color-text-muted)] italic">Response is empty</span>}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
          Select or add an endpoint routing template
        </div>
      )}
    </div>
  );
}
