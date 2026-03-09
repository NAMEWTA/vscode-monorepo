# Template Plugin

Template Plugin is the reference VS Code extension app in this monorepo. It demonstrates the intended architecture for extensions that combine an extension-host entrypoint with a React webview.

The project is authored by `namewta` and serves as the source template for `scripts/create-extension.mjs` when scaffolding new extensions.

## What this app demonstrates

- Extension host code in `src/extension.ts`
- Webview UI entry in `webview/index.tsx`
- React UI in `webview/App.tsx`
- A typed bridge between extension host and webview
- A shared VS Code theme integration for webviews

## Command

- `Template Plugin: Show Panel`
  - command id: `templatePlugin.showPanel`

Running the command opens the example panel and wires up two demo message flows:

- `greet` from the webview to the extension host
- `get-workspace-info` from the webview to the extension host

## Key files

- `src/extension.ts` — extension-host activation, command registration, and panel setup
- `webview/index.tsx` — webview entrypoint
- `webview/App.tsx` — demo React interface
- `package.json` — extension manifest and app-local scripts

## Local development

From the monorepo root:

```bash
npm run build --workspace template-plugin
npm run typecheck --workspace template-plugin
npm run lint --workspace template-plugin
npm run package --workspace template-plugin
```

To work on the app in watch mode from the app directory:

```bash
npm run dev
```

## Debugging in VS Code

1. Open the monorepo root in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. Open the Command Palette.
4. Run `Template Plugin: Show Panel`.

## Using this app as a scaffold

When you create a new extension with:

```bash
npm run new-extension -- --name my-plugin --display "My Plugin"
```

this app is copied as the starting point. After scaffolding, update at least:

- the command id and title in `package.json`
- the extension host logic in `src/extension.ts`
- the webview UI in `webview/App.tsx`
- any message names and payloads shared between host and webview

## Persistent storage convention

If a scaffolded extension later needs file-based persistence, follow the repository convention:

```text
~/.vscode-namewta/<project-name>/
```
