# ADR-001: Monorepo Architecture with npm Workspaces + Turborepo

## Context

We need to manage multiple VS Code extensions in a single repository to maximize code reuse, enforce consistent standards, and streamline the development workflow. Each extension may include React 19 + Ant Design 6.x webviews.

## Decision

Adopt a **monorepo architecture** powered by:

- **npm workspaces** — native dependency management, no extra tooling
- **Turborepo** — orchestrated build pipeline with caching and parallelism
- **esbuild** — fast bundling for both extension host (Node.js) and webview (browser)

### Directory Layout

```
apps/<extension>/          ← VS Code extensions
packages/<package>/        ← Shared libraries
```

### Shared Package Graph

```
@vscode-monorepo/tsconfig          ← TypeScript configs (base, node, react)
@vscode-monorepo/eslint-config     ← ESLint configs (base, react)
@vscode-monorepo/shared-types      ← Type definitions (message protocol, webview, extension)
@vscode-monorepo/shared-utils      ← Environment-agnostic utilities
@vscode-monorepo/webview-bridge    ← Typed extension ↔ webview communication
@vscode-monorepo/shared-ui         ← React components, Ant Design theme bridge, hooks
@vscode-monorepo/vscode-utils      ← VS Code API wrappers (commands, config, webview panel)
```

## Consequences

### Positive

- Single `npm install` for all extensions and packages
- Turborepo caching reduces incremental build time to ~seconds
- Shared UI layer guarantees visual consistency across extensions
- Typed message bridge eliminates runtime errors in extension ↔ webview communication
- New extension scaffolding via `npm run new-extension`

### Negative

- Initial setup complexity higher than a standalone extension
- `@vscode/vsce package` requires `--no-dependencies` to avoid bundling workspace packages
- All extensions share the same Node.js version constraint

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **pnpm workspaces** | Faster installs, strict dependency isolation | Additional tooling, less native VS Code task integration |
| **Nx** | More powerful generators and graph visualization | Heavier, steeper learning curve |
| **Separate repos** | Full isolation | Code duplication, inconsistent standards |

## Status

**Accepted**

## Date

2026-03-02
