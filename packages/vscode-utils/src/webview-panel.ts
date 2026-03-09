/**
 * Managed webview panel with integrated message bridge.
 *
 * Handles panel lifecycle, HTML generation, resource loading, and bridge setup.
 */

import * as vscode from 'vscode';
import type { WebviewPanelConfig } from '@vscode-monorepo/shared-types';
import { HostBridge } from '@vscode-monorepo/webview-bridge/host';

const COLUMN_MAP: Record<string, vscode.ViewColumn> = {
  active: vscode.ViewColumn.Active,
  beside: vscode.ViewColumn.Beside,
  one: vscode.ViewColumn.One,
  two: vscode.ViewColumn.Two,
  three: vscode.ViewColumn.Three,
};

export class WebviewPanelManager {
  private panel: vscode.WebviewPanel | undefined;
  private bridge: HostBridge | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly config: WebviewPanelConfig,
  ) {}

  /**
   * Show the panel (create if not exists, reveal if exists).
   * Returns the HostBridge for registering message handlers.
   */
  show(): HostBridge {
    if (this.panel) {
      this.panel.reveal();
      return this.bridge!;
    }

    const column = COLUMN_MAP[this.config.column ?? 'active'] ?? vscode.ViewColumn.Active;

    this.panel = vscode.window.createWebviewPanel(
      this.config.viewType,
      this.config.title,
      column,
      {
        enableScripts: this.config.enableScripts ?? true,
        retainContextWhenHidden: this.config.retainContextWhenHidden ?? true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
          ...(this.config.localResourceRoots?.map((p) =>
            vscode.Uri.joinPath(this.extensionUri, p),
          ) ?? []),
        ],
      },
    );

    this.panel.webview.html = this.getWebviewHtml(this.panel.webview);

    this.bridge = new HostBridge(this.panel.webview);

    this.panel.onDidDispose(() => {
      this.bridge?.dispose();
      this.bridge = undefined;
      this.panel = undefined;
    });

    return this.bridge;
  }

  /**
   * Dispose the panel and cleanup resources.
   */
  dispose(): void {
    this.panel?.dispose();
  }

  /**
   * Get the current bridge instance (undefined if panel not shown).
   */
  getBridge(): HostBridge | undefined {
    return this.bridge;
  }

  /**
   * Check if the panel is currently visible.
   */
  isVisible(): boolean {
    return this.panel?.visible ?? false;
  }

  /**
   * Generate the webview HTML with proper CSP and resource URIs.
   */
  private getWebviewHtml(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    font-src ${webview.cspSource};
    img-src ${webview.cspSource} data: https:;
  ">
  <link rel="stylesheet" href="${styleUri}">
  <title>${this.config.title}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return nonce;
}
