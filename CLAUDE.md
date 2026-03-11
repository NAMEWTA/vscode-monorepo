# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository is a VS Code extensions monorepo built with npm workspaces and Turborepo. Each extension lives under `apps/*`, and shared building blocks live under `packages/*`.

The reference implementation is `apps/template-plugin`, which shows the intended architecture for new extensions: a Node-based extension host entrypoint plus a React 19 + Ant Design 6 webview bundled with esbuild.

## Repository metadata baseline

Unless the user explicitly overrides it for a specific task, all repository metadata under this monorepo should use the following canonical values:

- author: `namewta`
- repository URL: `https://github.com/NAMEWTA`

Apply this baseline consistently when editing or generating metadata such as:

- `package.json` `author`
- `package.json` `repository`
- license ownership text
- release and publishing metadata

## Development commands

Root tooling requires Node.js >= 20 and npm >= 10 (`package.json:8`).

All root commands come from `package.json:16`.

```bash
npm install
npm run build
npm run dev
npm run lint
npm run typecheck
npm run clean
npm run package
npm run format
npm run format:check
npm run new-extension -- --name my-plugin --display "My Plugin"
```

### Working on a single extension

The reference extension supports working from the app directory directly, and newly scaffolded extensions are expected to follow the same shape:

```bash
cd apps/template-plugin && npm run build
cd apps/template-plugin && npm run dev
cd apps/template-plugin && npm run lint
cd apps/template-plugin && npm run typecheck
cd apps/template-plugin && npm run package
```

### Build/debug workflow in VS Code

From `README.md:112`:

1. Open the monorepo root in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. Run `Template Plugin: Show Panel` from the Command Palette.

### Tests

There is currently no test script or test framework configured in the repository root or the reference extension. A grep across `package.json` files does not show any `test` scripts, and no standard JS test framework dependencies are present.

That means there is currently no supported command for:

- `npm test`
- running all tests
- running a single test

If you add tests, you will also need to introduce and document the test runner and its single-test invocation.

## Monorepo structure

At the top level:

- `apps/*`: VS Code extensions
- `packages/*`: shared libraries used by extensions and webviews
- `scripts/create-extension.mjs`: scaffolds a new extension from `apps/template-plugin`
- `docs/adr/*`: architecture decisions that explain the intended design

The root workspace layout and toolchain are described in `README.md:5` and `docs/adr/ADR-001-monorepo-architecture.md:7`.

## Big-picture architecture

### 1. Extension host and webview are separate runtime layers

The core split is:

- `apps/<extension>/src/extension.ts`: extension host code running in the VS Code Node.js context
- `apps/<extension>/webview/*`: browser code running inside the VS Code webview iframe

In the template extension, `apps/template-plugin/src/extension.ts:14` creates a `WebviewPanelManager`, registers VS Code commands, and wires message handlers for requests coming from the webview. The webview entry at `apps/template-plugin/webview/index.tsx:6` mounts the React app, and `apps/template-plugin/webview/App.tsx:17` uses shared hooks to call back into the extension host.

When implementing features, decide first which side owns the behavior:

- VS Code APIs, workspace access, commands, output channels: extension host side
- UI state, forms, rendering, interaction: webview side

### 2. `packages/*` are the real platform layer for new extensions

The monorepo is designed so extensions compose shared packages instead of reimplementing infrastructure.

Key packages:

- `packages/vscode-utils`: wrappers around VS Code APIs such as panel lifecycle and command registration (`packages/vscode-utils/src/webview-panel.ts:19`, `packages/vscode-utils/src/commands.ts:13`)
- `packages/webview-bridge`: typed communication bridge between extension host and webview (`packages/webview-bridge/src/host.ts:21`, `packages/webview-bridge/src/client.ts:26`)
- `packages/shared-types`: shared protocol and extension/webview types (`packages/shared-types/src/message.ts:7`, `packages/shared-types/src/extension.ts:7`)
- `packages/shared-ui`: React-side primitives for webviews, including the root wrapper, theme bridge, and communication hooks (`packages/shared-ui/src/components/index.ts:29`, `packages/shared-ui/src/theme/index.ts:115`, `packages/shared-ui/src/hooks/index.ts:11`)
- `packages/shared-utils`: environment-agnostic helpers used across packages
- `packages/tsconfig` and `packages/eslint-config`: central TS/ESLint configuration for the workspace

A useful mental model is: apps should mostly contain feature-specific code, while cross-cutting infrastructure belongs in packages.

### 3. Extension↔webview communication uses a typed message envelope

The intended pattern is the typed bridge described in `docs/adr/ADR-003-communication-protocol.md:12` and implemented in `packages/shared-types/src/message.ts:7`, rather than raw ad-hoc `postMessage` usage.

Important details:

- messages share a common envelope with `type`, `payload`, `id?`, and `timestamp`
- request/response flows are correlation-ID based
- the webview-side `ClientBridge` keeps pending requests and rejects after 30 seconds (`packages/webview-bridge/src/client.ts:61`)
- the extension-side `HostBridge` dispatches handlers and converts thrown errors into structured responses (`packages/webview-bridge/src/host.ts:58`)

The React-facing API is `useExtensionRequest` / `useExtensionMessage` in `packages/shared-ui/src/hooks/index.ts:26`. In normal feature work, prefer these hooks over writing raw window message listeners.

### 4. Webviews are standardized around `WebviewApp` and a VS Code theme bridge

Webview UIs should be wrapped in `WebviewApp` (`packages/shared-ui/src/components/index.ts:29`), which provides:

- an error boundary
- the VS Code-to-Ant Design theme bridge
- a consistent root setup for webview apps

The theme integration is a core architectural decision documented in `docs/adr/ADR-002-webview-tech-stack.md:12`. `VSCodeThemeProvider` reads VS Code CSS custom properties and maps them into Ant Design tokens (`packages/shared-ui/src/theme/index.ts:48`). It also watches theme changes with a `MutationObserver` (`packages/shared-ui/src/theme/index.ts:118`).

If a UI change should match the active VS Code theme, look in the theme bridge before adding custom styling.

### 5. CSP and webview HTML are centrally managed

`WebviewPanelManager` is responsible for creating the webview panel, generating HTML, setting CSP, and resolving bundled assets from `dist/webview` (`packages/vscode-utils/src/webview-panel.ts:32`, `packages/vscode-utils/src/webview-panel.ts:93`).

Important implications:

- webview assets are expected to be bundled output under `dist/webview`
- CSP currently allows inline styles to support Ant Design CSS-in-JS (`packages/vscode-utils/src/webview-panel.ts:106`)
- extensions should usually use `WebviewPanelManager` instead of hand-rolling panel setup

### 6. New extensions are created from the template app

`scripts/create-extension.mjs:4` copies `apps/template-plugin` into a new app directory and updates the new package manifest. The script adjusts package metadata and the contributed command, but it does not fully rewrite implementation details inside `src/extension.ts` or the webview code.

After scaffolding, expect to update:

- the command IDs/category in the new extension package
- `src/extension.ts`
- webview UI and message types

### 7. File-based persistence root is standardized

For extensions built from this monorepo, the repository convention is to place extension-managed persistent files under:

```bash
~/.vscode-namewta/<project-name>/
```

Guidance:

- `<project-name>` should match the extension project folder in `apps/*`
- use this root for file-based data your extension writes and manages directly
- keep data isolated per extension so inspection, cleanup, migration, and backup stay straightforward

If you are adding persistence to an extension, follow this directory convention instead of scattering files across unrelated locations.

## Build system notes

The root scripts delegate to Turborepo (`package.json:17`), and the pipeline is defined in `turbo.json:3`.

Notable details from `turbo.json`:

- `build` depends on upstream package builds and caches `dist/**`
- `dev` is persistent and not cached
- `package` depends on `build`
- extension and webview outputs are treated separately via `build:extension` and `build:webview`

In the template extension, both host and webview are bundled with esbuild (`apps/template-plugin/package.json:29`). The extension host output is CommonJS for Node, while the webview output is an IIFE bundle for the browser.

## Existing repository guidance worth preserving

The checked-in `.claude/rules/common/*` files add repo expectations that are relevant when editing code here:

- prefer planner / TDD / code-review agent workflow for non-trivial implementation work
- use immutable update patterns
- keep files focused and relatively small
- validate inputs at boundaries
- treat security review as mandatory before commits

These rules are already present in the repo; they do not need to be restated in task outputs unless directly relevant.
