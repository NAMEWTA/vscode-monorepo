# Asset Manager

Asset Manager is a VS Code extension app in this monorepo. Its current implementation follows the same reference structure as the template-based webview extensions in the repository.

The project is authored by `namewta` and currently serves as a scaffold-derived extension with a panel command and webview-based UI shell.

## Current command

- `Asset Manager: Show Panel`
  - command id: `assetManagerPlugin.showPanel`

## Current architecture

The app currently follows the same split used by the template extension:

- `src/extension.ts` — extension-host entrypoint
- `webview/index.tsx` — webview bootstrap
- `webview/App.tsx` — React UI
- shared monorepo packages for panel management, messaging, and UI/theme integration

## Local development

From the monorepo root:

```bash
npm run build --workspace asset-manager-plugin
npm run typecheck --workspace asset-manager-plugin
npm run lint --workspace asset-manager-plugin
npm run package --workspace asset-manager-plugin
```

From the app directory you can also run watch mode with:

```bash
npm run dev
```

## Debugging in VS Code

1. Open the monorepo root in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. Open the Command Palette.
4. Run `Asset Manager: Show Panel`.

## Notes

This app is still scaffold-shaped. Before treating it as a production-ready extension, update its manifest, extension-host logic, and webview content to match the actual asset-management workflow you want to ship.

## Persistent storage convention

If this extension writes file-based data, follow the repository convention:

```text
~/.vscode-namewta/asset-manager-plugin/
```
