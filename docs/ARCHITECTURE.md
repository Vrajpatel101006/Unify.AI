# Unify.AI — Architecture

## Philosophy

- Never build features first. Always solve developer problems first.
- Every feature must reduce friction in the developer workflow.
- If a feature does not remove a real developer pain point, it should not exist.

## Layered Architecture

```
Applications    →  Desktop, Web, IDE Extensions (future)
    │
    ▼
Workspaces      →  Prompt, SQL, API, Code, Docs (future modules)
    │
    ▼
Platform        →  AI, Search, Storage, Events, Commands, Context, etc.
    │
    ▼
Kernel          →  Lifecycle, Service Container, DI, Boot
    │
    ▼
Infrastructure  →  PostgreSQL, SQLite, File System, Network, OS
```

**Rules:**
- Every layer depends only downward. Never upward. Never sideways.
- Workspaces communicate through the Event Bus, never directly.
- Every service resolves through the Kernel's Service Container.
- Every workspace implements the Plugin interface.

## Kernel

The nervous system. Manages:
- **ServiceContainer** — Typed DI (singleton/transient scoping)
- **WorkspaceLifecycle** — Opening → Loading → Ready → Saving → Closing → Disposed
- **Boot/Shutdown** — Orderly initialization and cleanup

## Platform Services

| Service | Package | Purpose |
|---------|---------|---------|
| Event Bus | `@unify/platform-events` | Priority pub/sub with cancellation, sticky, middleware |
| Command Registry | `@unify/platform-commands` | Commands, undo/redo, keybindings, history |
| Context Engine | `@unify/platform-context` | Workspace state: project, file, git, cursor, databases |
| AI Engine | `@unify/platform-ai` | Provider abstraction, routing, prompt building, tool calling |
| Search Engine | `@unify/platform-search` | Universal search with indexing, ranking, filters |
| Task Manager | `@unify/platform-tasks` | Background tasks, scheduling, progress |
| Cache Manager | `@unify/platform-cache` | Memory + persistent caching |
| Storage | `@unify/platform-storage` | KV storage + workspace database (IndexedDB/SQLite) |
| Notifications | `@unify/platform-notifications` | Toast notifications, notification center |
| Settings | `@unify/platform-settings` | Layered settings (default → user → workspace) |
| Memory | `@unify/platform-memory` | Session persistence (recent files, layouts, tabs) |
| Indexing | `@unify/platform-indexing` | Repository scanning, dependency graphs |
| Logging | `@unify/platform-logging` | Structured logging with levels and categories |
| Telemetry | `@unify/platform-telemetry` | Optional usage telemetry (disabled by default) |

## Communication Pattern

```
Workspace A                    Workspace B
    │                              │
    ▼                              ▼
EventBus.emit("sql:generated")   EventBus.on("sql:generated")
    │
    ▼
  Kernel (Service Container)
```

Never: `WorkspaceA.call(WorkspaceB.method())`

Always: `EventBus.emit() → EventBus.on()`

## AI Pipeline

```
Request → AITask → AIRouter → PromptBuilder → AIMemory → Provider → ResponseValidator → ResponseFormatter → Response
```

Never: `new OpenAIClient()`

Always: `kernel.get(AIRouterToken).route(task)`

## Database Strategy

- **PostgreSQL**: Users, projects, AI providers, settings, plugin metadata, shared data
- **SQLite**: Recent files, local cache, search index, prompt cache, AI conversation cache, offline data

## Security Principles

- Never store API keys in plain text
- Use OS credential store (Windows Credential Manager, macOS Keychain)
- Validate every AI request and response
- Never execute AI-generated code automatically
- Plugin permission model
- Path traversal protection
- Secure logging (no secrets in logs)
