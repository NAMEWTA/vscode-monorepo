# Reference Copier

Reference Copier is a VS Code extension in this monorepo that copies workspace-relative file, folder, and selection references in an LLM-friendly text format.

The extension is authored by `namewta` and is intended for fast copy/paste workflows from the editor and Explorer into chat tools, issue trackers, and prompts.

## Commands

- `Reference Copier: Copy Relative Reference from Editor`
  - command id: `referenceCopier.copyReference`
- `Reference Copier: Copy Relative Reference from Explorer`
  - command id: `referenceCopier.copyExplorerReference`

## Where the commands appear

- Editor right-click context menu
- Explorer right-click context menu
- Keyboard shortcut in the editor: `Ctrl+Alt+Shift+C`
- Command Palette

## Output format

References are copied using workspace-relative paths with forward slashes.

### Cursor only

```text
apps/reference-copier/src/extension.ts:31
```

### Single-line selection

```text
apps/reference-copier/src/extension.ts:87(5-18)
```

### Multi-line selection

```text
apps/reference-copier/src/extension.ts:94-96
```

### Explorer file

```text
apps/reference-copier/package.json
```

### Explorer folder

```text
apps/reference-copier/src/
```

### Multiple selections

Multiple editor selections or Explorer resources are copied as newline-separated references. Duplicate references are removed while preserving order.

## Behavior notes

- Workspace files and folders are converted to workspace-relative paths.
- Path separators are normalized to `/`.
- Explorer directories keep a trailing slash.
- Untitled editors fall back to the untitled file name when possible.
- Non-workspace resources are rejected with a user-facing error.
- In multi-root workspaces, the workspace folder segment is included when needed.

## Local development

From the monorepo root:

```bash
npm run build --workspace reference-copier
npm run typecheck --workspace reference-copier
npm run lint --workspace reference-copier
npm run package --workspace reference-copier
```

## Debugging in VS Code

1. Open the monorepo root in VS Code.
2. Press `F5` to start the Extension Development Host.
3. Open a workspace file and use the editor context menu or `Ctrl+Alt+Shift+C`.
4. Right-click files or folders in Explorer to copy relative references.

## Persistent storage convention

If this extension later adds file-based persistence, follow the repository convention:

```text
~/.vscode-namewta/reference-copier/
```
