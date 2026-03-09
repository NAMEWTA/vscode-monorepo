import * as vscode from 'vscode';

const OUTPUT_CHANNEL_NAME = 'Reference Copier';
const COPY_EDITOR_REFERENCE_COMMAND = 'referenceCopier.copyReference';
const COPY_EXPLORER_REFERENCE_COMMAND = 'referenceCopier.copyExplorerReference';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand(COPY_EDITOR_REFERENCE_COMMAND, async () => {
      await copyEditorReferences(outputChannel);
    }),
    vscode.commands.registerCommand(
      COPY_EXPLORER_REFERENCE_COMMAND,
      async (resourceUri?: vscode.Uri, selectedUris?: vscode.Uri[]) => {
        await copyExplorerReferences(resourceUri, selectedUris, outputChannel);
      },
    ),
  );

  outputChannel.appendLine('Reference Copier activated');
}

export function deactivate(): void {}

async function copyEditorReferences(
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('Reference Copier: no active editor found.');
    return;
  }

  try {
    const referencePath = getReferencePath(editor.document.uri);
    const references = uniquePreservingOrder(
      editor.selections.map((selection) =>
        formatEditorSelectionReference(referencePath, selection),
      ),
    );

    await writeReferencesToClipboard(references, outputChannel);
  } catch (error) {
    reportCopyFailure('editor selection', error, outputChannel);
  }
}

async function copyExplorerReferences(
  resourceUri: vscode.Uri | undefined,
  selectedUris: vscode.Uri[] | undefined,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const explorerUris = getExplorerUris(resourceUri, selectedUris);

  if (explorerUris.length === 0) {
    vscode.window.showWarningMessage(
      'Reference Copier: no Explorer resource selection found.',
    );
    return;
  }

  try {
    const references = uniquePreservingOrder(
      await Promise.all(explorerUris.map((uri) => formatExplorerReference(uri))),
    );

    await writeReferencesToClipboard(references, outputChannel);
  } catch (error) {
    reportCopyFailure('Explorer selection', error, outputChannel);
  }
}

function formatEditorSelectionReference(
  referencePath: string,
  selection: vscode.Selection,
): string {
  const startLine = selection.start.line + 1;

  if (selection.isEmpty) {
    return `${referencePath}:${startLine}`;
  }

  if (selection.start.line === selection.end.line) {
    const startCharacter = selection.start.character + 1;
    const endCharacter = Math.max(startCharacter, selection.end.character);

    return `${referencePath}:${startLine}(${startCharacter}-${endCharacter})`;
  }

  const endLine = selection.end.line + 1;

  return `${referencePath}:${startLine}-${endLine}`;
}

async function formatExplorerReference(uri: vscode.Uri): Promise<string> {
  const referencePath = getReferencePath(uri);

  try {
    const stat = await vscode.workspace.fs.stat(uri);

    return stat.type & vscode.FileType.Directory
      ? ensureTrailingSlash(referencePath)
      : referencePath;
  } catch {
    return referencePath;
  }
}

function getExplorerUris(
  resourceUri: vscode.Uri | undefined,
  selectedUris: vscode.Uri[] | undefined,
): vscode.Uri[] {
  const uris = selectedUris && selectedUris.length > 0
    ? selectedUris
    : resourceUri
      ? [resourceUri]
      : [];

  const seen = new Set<string>();
  const uniqueUris: vscode.Uri[] = [];

  for (const uri of uris) {
    const key = uri.toString(true);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueUris.push(uri);
  }

  return uniqueUris;
}

function getReferencePath(uri: vscode.Uri): string {
  const workspacePath = getWorkspaceRelativePath(uri);

  if (workspacePath) {
    return workspacePath;
  }

  if (uri.scheme === 'untitled') {
    const untitledName = uri.path.split('/').filter(Boolean).at(-1);

    return untitledName && untitledName.length > 0 ? untitledName : 'untitled';
  }

  throw new Error('Only workspace files and folders are supported.');
}

function getWorkspaceRelativePath(uri: vscode.Uri): string | undefined {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspaceFolder) {
    return undefined;
  }

  return normalizePathSeparators(vscode.workspace.asRelativePath(uri, true));
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizePathSeparators(value: string): string {
  return value.replace(/\\/g, '/');
}

function uniquePreservingOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    uniqueValues.push(value);
  }

  return uniqueValues;
}

async function writeReferencesToClipboard(
  references: string[],
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  if (references.length === 0) {
    vscode.window.showWarningMessage(
      'Reference Copier: there were no valid references to copy.',
    );
    return;
  }

  const clipboardText = references.join('\n');
  await vscode.env.clipboard.writeText(clipboardText);

  const itemLabel = references.length === 1 ? 'reference' : 'references';
  outputChannel.appendLine(`Copied ${references.length} ${itemLabel}.`);
  vscode.window.showInformationMessage(
    `Reference Copier: copied ${references.length} ${itemLabel}.`,
  );
}

function reportCopyFailure(
  target: string,
  error: unknown,
  outputChannel: vscode.OutputChannel,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  outputChannel.appendLine(`Failed to copy ${target}. Details: ${errorMessage}`);
  vscode.window.showErrorMessage(`Reference Copier: failed to copy ${target}.`);
}
