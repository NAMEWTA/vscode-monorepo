/**
 * Asset Manager — VS Code Extension Entry Point.
 */

import * as vscode from 'vscode';
import { registerCommands } from '@vscode-monorepo/vscode-utils/commands';
import { HostBridge } from '@vscode-monorepo/webview-bridge/host';
import type {
  CopyItemsToWorkspaceRequest,
  DeleteCategoryRequest,
  DeleteItemRequest,
  GetItemRequest,
  GlobalSearchRequest,
  InitializeRequest,
  ListCategoriesRequest,
  ListItemsRequest,
  SaveCategoryRequest,
  SaveItemRequest,
} from '@vscode-monorepo/shared-types';
import {
  COMMANDS,
  EXTENSION_NAME,
  SIDEBAR_CONTAINER_ID,
  SIDEBAR_VIEW_ID,
} from './constants';
import { AssetManagerService } from './services/asset-service';

let sidebarProvider: AssetManagerSidebarProvider | undefined;
let outputChannel: vscode.OutputChannel | undefined;
const service = new AssetManagerService();

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME);
  context.subscriptions.push(outputChannel);

  sidebarProvider = new AssetManagerSidebarProvider(context.extensionUri);
  context.subscriptions.push(sidebarProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW_ID, sidebarProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    })
  );

  registerCommands(context, [
    {
      id: COMMANDS.showPanel,
      title: 'Show Asset Manager',
      category: EXTENSION_NAME,
      handler: async () => {
        await sidebarProvider?.reveal();
      },
    },
    {
      id: COMMANDS.openStorageDirectory,
      title: 'Open Storage Directory',
      category: EXTENSION_NAME,
      handler: async () => {
        await service.openStorageDirectory();
      },
    },
  ]);

  outputChannel.appendLine(`${EXTENSION_NAME} activated`);
}

export function deactivate(): void {
  sidebarProvider?.dispose();
  outputChannel?.dispose();
}

class AssetManagerSidebarProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;
  private bridge: HostBridge | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')],
    };
    webviewView.title = EXTENSION_NAME;
    webviewView.webview.html = getWebviewHtml(this.extensionUri, webviewView.webview, EXTENSION_NAME);

    this.bridge?.dispose();
    this.bridge = new HostBridge(webviewView.webview);
    registerBridgeHandlers(this.bridge);

    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.bridge?.dispose();
        this.bridge = undefined;
        this.view = undefined;
      }
    });
  }

  async reveal(): Promise<void> {
    if (this.view) {
      this.view.show(false);
      return;
    }

    await vscode.commands.executeCommand(`workbench.view.extension.${SIDEBAR_CONTAINER_ID}`);
  }

  dispose(): void {
    this.bridge?.dispose();
    this.bridge = undefined;
    this.view = undefined;
  }
}

function registerBridgeHandlers(bridge: HostBridge): void {
  bridge.onMessage('app.initialize', async (payload: InitializeRequest | undefined) => {
    return runHandler('app.initialize', () => service.initialize(payload));
  });

  bridge.onMessage('items.list', async (payload: ListItemsRequest) => {
    return runHandler('items.list', () => service.listItems(payload));
  });

  bridge.onMessage('items.get', async (payload: GetItemRequest) => {
    return runHandler('items.get', () => service.getItem(payload));
  });

  bridge.onMessage('items.save', async (payload: SaveItemRequest) => {
    const response = await runHandler<Awaited<ReturnType<AssetManagerService['saveItem']>>>(
      'items.save',
      () => service.saveItem(payload)
    );
    bridge.notify('items.updated', { kind: payload.item.kind, id: response.item.id });
    return response;
  });

  bridge.onMessage('items.delete', async (payload: DeleteItemRequest) => {
    const response = await runHandler('items.delete', () => service.deleteItem(payload));
    bridge.notify('items.updated', { kind: payload.kind, id: payload.id });
    return response;
  });

  bridge.onMessage('categories.list', async (payload: ListCategoriesRequest) => {
    return runHandler('categories.list', () => service.listCategories(payload));
  });

  bridge.onMessage('categories.save', async (payload: SaveCategoryRequest) => {
    const response = await runHandler('categories.save', () => service.saveCategory(payload));
    bridge.notify('categories.updated', { kind: payload.category.kind });
    return response;
  });

  bridge.onMessage('categories.delete', async (payload: DeleteCategoryRequest) => {
    const response = await runHandler('categories.delete', () => service.deleteCategory(payload));
    bridge.notify('categories.updated', { kind: payload.kind });
    return response;
  });

  bridge.onMessage('search.global', async (payload: GlobalSearchRequest) => {
    return runHandler('search.global', () => service.globalSearch(payload));
  });

  bridge.onMessage('workspace.getContext', async () => {
    return runHandler('workspace.getContext', () => Promise.resolve(service.getWorkspaceContext()));
  });

  bridge.onMessage('workspace.copyItems', async (payload: CopyItemsToWorkspaceRequest) => {
    const response = await runHandler('workspace.copyItems', () => service.copyItemsToWorkspace(payload));
    bridge.notify('workspace.copyCompleted', response);
    return response;
  });

  bridge.onMessage('system.openStorageDirectory', async () => {
    return runHandler('system.openStorageDirectory', () => service.openStorageDirectory());
  });
}

function getWebviewHtml(webviewExtensionUri: vscode.Uri, webview: vscode.Webview, title: string): string {
  const distUri = vscode.Uri.joinPath(webviewExtensionUri, 'dist', 'webview');
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
  <title>${title}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return nonce;
}

async function runHandler<T>(label: string, callback: () => Promise<T>): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[${label}] ${message}`);
    throw error;
  }
}
