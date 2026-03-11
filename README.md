# VS Code Extensions Monorepo

> Multi-extension VS Code development workspace — React 19 + Ant Design 6.x + TypeScript

## Architecture

```
vscode-monorepo/
├── apps/                                   ← VS Code Extensions
│   └── template-plugin/                    ← Reference extension template
│       ├── src/
│       │   └── extension.ts                ← Extension host entry (Node.js)
│       ├── webview/
│       │   ├── index.tsx                   ← Webview entry (Browser)
│       │   ├── App.tsx                     ← Root React component
│       │   └── styles/
│       ├── dist/                           ← Build output (gitignored)
│       ├── package.json                    ← Extension manifest + npm config
│       ├── tsconfig.json                   ← Extension TS config
│       ├── tsconfig.webview.json           ← Webview TS config
│       └── .vscodeignore
│
├── packages/                               ← Shared Libraries
│   ├── tsconfig/                           ← TypeScript configurations
│   │   ├── base.json                       ← Common strict settings
│   │   ├── node.json                       ← Node.js / Extension host
│   │   └── react.json                      ← Browser / Webview (JSX)
│   │
│   ├── eslint-config/                      ← ESLint configurations
│   │   ├── index.mjs                       ← Base TypeScript rules
│   │   └── react.mjs                       ← + React/Hooks rules
│   │
│   ├── shared-types/                       ← Type definitions
│   │   └── src/
│   │       ├── webview.ts                  ← Webview state, theme, panel config
│   │       ├── message.ts                  ← Message envelope protocol
│   │       └── extension.ts               ← Extension config, command types
│   │
│   ├── shared-utils/                       ← Environment-agnostic utilities
│   │   └── src/
│   │       └── index.ts                    ← generateId, debounce, retry, etc.
│   │
│   ├── webview-bridge/                     ← Extension ↔ Webview communication
│   │   └── src/
│   │       ├── host.ts                     ← HostBridge (extension side)
│   │       └── client.ts                   ← ClientBridge (webview side)
│   │
│   ├── shared-ui/                          ← React UI components
│   │   └── src/
│   │       ├── theme/                      ← VS Code → Ant Design theme bridge
│   │       ├── components/                 ← WebviewApp, ErrorBoundary
│   │       └── hooks/                      ← useBridge, useExtensionRequest
│   │
│   └── vscode-utils/                       ← VS Code API wrappers
│       └── src/
│           ├── webview-panel.ts            ← WebviewPanelManager
│           ├── commands.ts                 ← Command registration helpers
│           └── config.ts                   ← Configuration access helpers
│
├── scripts/
│   └── create-extension.mjs                ← New extension scaffolding
│
├── docs/adr/                               ← Architecture Decision Records
├── package.json                            ← npm workspaces root
├── turbo.json                              ← Turborepo pipeline config
└── .vscode/                                ← Debug & task configurations
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Package Management** | npm workspaces | Native monorepo dependency management |
| **Build Orchestration** | Turborepo 2.x | Cached, parallel task execution |
| **Bundler** | esbuild | Fast bundling for extension + webview |
| **Language** | TypeScript 5.7+ | Strict type safety across all packages |
| **Extension API** | VS Code API 1.96+ | Extension host development |
| **UI Framework** | React 19 | Webview rendering |
| **Component Library** | Ant Design 6.x | Production-ready UI components |
| **Theming** | Custom bridge | VS Code CSS vars → Ant Design tokens |

## Quick Start

```bash
# Install all dependencies
npm install

# Build everything
npm run build

# Development mode (watch)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Creating a New Extension

```bash
npm run new-extension -- --name my-plugin --display "My Plugin"
```

This copies `apps/template-plugin` → `apps/my-plugin` and updates the manifest.

## Persistent Storage Convention

For this monorepo, all file-based persistence created by extensions should be organized under:

```bash
~/.vscode-namewta/<project-name>/
```

Guidelines:

- `<project-name>` should match the extension project folder under `apps/*`.
- Treat this as the root directory for extension-managed persistent files, caches, snapshots, and other local data that you write yourself.
- Keep each extension inside its own subdirectory so persistent data stays isolated and easy to inspect, migrate, back up, or remove.

This is a repository convention for extensions built from this project, intended to make persistent files easier to manage consistently.

## Development Workflow

### 1. Build & Debug

1. Open VS Code in the monorepo root
2. Press `F5` to launch the Extension Development Host
3. Run `Template Plugin: Show Panel` from the Command Palette

### 2. Watch Mode

```bash
# Watch all packages + extensions
npm run dev

# Watch a specific extension
cd apps/template-plugin && npm run dev
```

### 3. Package Extension

```bash
# Package a specific extension as .vsix
cd apps/template-plugin && npm run package

# Package all extensions
npm run package
```

## Package Dependency Graph

```
                    ┌──────────────┐
                    │   tsconfig   │  (no runtime deps)
                    └──────┬───────┘
                           │ extends
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
 │ shared-types │  │ shared-utils │  │ eslint-config│
 └──────┬───────┘  └──────┬───────┘  └──────────────┘
        │                 │
        ▼                 ▼
 ┌──────────────────────────┐
 │     webview-bridge       │
 │  (host.ts + client.ts)   │
 └──────┬───────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
┌────────┐ ┌────────────┐
│shared-ui│ │vscode-utils│
└────┬───┘ └─────┬──────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────┐
    │  apps/*      │  (VS Code extensions)
    └─────────────┘
```

## Extension ↔ Webview Communication

### From Webview (Request/Response)

```tsx
// webview side
const { data, loading, execute } = useExtensionRequest<Input, Output>('my-action');
await execute({ query: 'hello' });
```

```ts
// extension side
bridge.onMessage('my-action', (payload) => {
  return { result: 'world' };
});
```

### From Extension (Notification)

```ts
// extension side
bridge.notify('data-updated', { items: [...] });
```

```tsx
// webview side
useExtensionMessage('data-updated', (payload) => {
  setItems(payload.items);
});
```

## Architecture Decision Records

- [ADR-001: Monorepo Architecture](docs/adr/ADR-001-monorepo-architecture.md)
- [ADR-002: Webview Tech Stack](docs/adr/ADR-002-webview-tech-stack.md)
- [ADR-003: Communication Protocol](docs/adr/ADR-003-communication-protocol.md)

## Author

This project and its VS Code extensions are authored and maintained by [namewta](https://github.com/NAMEWTA).
All release, publisher, and repository-related metadata should consistently use `namewta` as the author identity.

## License

MIT — [namewta](https://github.com/NAMEWTA)
