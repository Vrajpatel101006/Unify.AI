# Unify.AI — Coding Standards

## TypeScript

### General
- Use strict mode (`strict: true` in tsconfig)
- No `any` — use `unknown` and type guards instead
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` over `let`, never use `var`
- Use named exports, not default exports

### Naming
- **Files**: PascalCase for classes/components (`EventBus.ts`, `App.tsx`), camelCase for utilities (`helpers.ts`)
- **Interfaces**: Prefix with `I` for service contracts (`IEventBus`, `IAIProvider`)
- **Types**: PascalCase, descriptive (`WorkspaceContext`, `AIResponse`)
- **Enums**: PascalCase name and members (`LogLevel.Debug`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Functions/Methods**: camelCase (`getSnapshot`, `emitSticky`)

### Imports
- Absolute imports for cross-package (`@unify/kernel`, `@unify/shared`)
- Relative imports within a package (`./types`, `../utils`)
- Group imports: external → workspace packages → relative
- Use `type` imports when importing only types

### Documentation
- JSDoc on all public interfaces and classes
- Inline comments for non-obvious logic
- Module-level doc comment explaining the file's purpose

## React

- Functional components only
- Use hooks for state and side effects
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Co-locate component styles

## CSS (Tailwind CSS v4)

- Use `@theme` tokens for all colors, spacing, and sizes
- Support dark and light themes via `data-theme` attribute
- Use CSS custom properties for runtime theming
- 4px grid system for spacing

## .NET (C#)

- Follow Microsoft naming conventions
- Use dependency injection everywhere
- Async/await for all I/O operations
- Use record types for DTOs
- FluentValidation for request validation
- Serilog for structured logging
- No magic strings — use constants/enums

## Architecture Rules

1. **No circular dependencies** between packages
2. **No direct workspace-to-workspace communication** — always through Event Bus
3. **Every service resolves through the Service Container**
4. **Every workspace is a plugin** — same API as third-party
5. **Every AI call goes through the AI Router** — never instantiate providers directly
6. **Local-first** — basic functionality works offline
7. **Never expose secrets** in logs, responses, or client-side code

## Git Conventions

- Branch naming: `feature/`, `fix/`, `chore/`, `refactor/`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
- One logical change per commit
