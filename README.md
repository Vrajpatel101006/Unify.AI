# Unify.AI

**AI-powered Developer Workspace Platform**

Unify.AI is a workspace where developers can continue working on their projects while using AI-powered tools without unnecessary context switching.

## Architecture

```
Applications (Desktop, Web, IDE Extensions)
    │
    ▼
Workspaces (Prompt, SQL, API, Code, Docs)
    │
    ▼
Platform (AI, Search, Events, Commands, Context, Storage, ...)
    │
    ▼
Kernel (Service Container, Lifecycle, DI)
    │
    ▼
Infrastructure (PostgreSQL, SQLite, AI Providers, Git, ...)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Desktop | Electron (v1), optionally Tauri later |
| Backend | ASP.NET Core (.NET) |
| Database | PostgreSQL (app data) + SQLite (local cache) |
| Logging | Serilog (.NET) / Custom structured logger (TS) |

## Repository Structure

```
apps/
├── web/          # React + Vite frontend
├── api/          # ASP.NET Core Web API
└── desktop/      # Electron shell

packages/
├── kernel/       # Service Container, Lifecycle, DI
├── platform/     # AI, Events, Commands, Context, Search, ...
├── ui/           # Reusable component library
├── sdk/          # Plugin SDK
├── shared/       # Types, constants, utilities
└── toolkit/      # Dev tools, CLI helpers

plugins/          # Official workspace plugins
tests/            # Unit, integration, component, E2E
docs/             # Architecture, coding standards
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the web dev server
npm run dev

# Build the .NET backend
cd apps/api && dotnet build

# Run the API
cd apps/api/Unify.API && dotnet run
```

## Development

Every workspace is a plugin. Every module communicates through the Event Bus. Every service resolves through the Kernel's Service Container.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## License

Proprietary — All rights reserved.
