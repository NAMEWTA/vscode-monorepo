/**
 * Template Plugin — VS Code Extension Entry Point
 *
 * This file is the main entry for the extension host (Node.js context).
 * All VS Code API interactions happen here.
 */

import * as vscode from 'vscode';
import { WebviewPanelManager } from '@vscode-monorepo/vscode-utils/webview-panel';
import { registerCommands } from '@vscode-monorepo/vscode-utils/commands';

let panelManager: WebviewPanelManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize the webview panel manager
  panelManager = new WebviewPanelManager(context.extensionUri, {
    viewType: 'templatePlugin.mainPanel',
    title: 'Template Plugin',
    retainContextWhenHidden: true,
    enableScripts: true,
  });

  // Register commands
  registerCommands(context, [
    {
      id: 'templatePlugin.showPanel',
      title: 'Show Panel',
      category: 'Template Plugin',
      handler: () => {
        const bridge = panelManager!.show();

        // Register message handlers from the webview
        bridge.onMessage('greet', (payload: { name: string }) => {
          vscode.window.showInformationMessage(`Hello, ${payload.name}!`);
          return { greeting: `Welcome to Template Plugin, ${payload.name}!` };
        });

        bridge.onMessage('get-workspace-info', () => {
          const folders = vscode.workspace.workspaceFolders;
          return {
            name: vscode.workspace.name ?? 'No workspace',
            folders: folders?.map((f) => f.uri.fsPath) ?? [],
          };
        });
      },
    },
  ]);

  // Log activation
  const channel = vscode.window.createOutputChannel('Template Plugin');
  context.subscriptions.push(channel);
  channel.appendLine('Template Plugin activated');
}

export function deactivate(): void {
  panelManager?.dispose();
}
