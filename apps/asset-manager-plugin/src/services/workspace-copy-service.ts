import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { CopyItemsToWorkspaceRequest, CopyItemsToWorkspaceResponse, ManagedItem } from '@vscode-monorepo/shared-types';
import { DEFAULT_COPY_TARGET } from '../constants';
import { getKindDirectoryName } from '../storage/paths';

export function getWorkspaceContext() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  return {
    name: vscode.workspace.name ?? 'No workspace',
    rootPath: workspaceFolder?.uri.fsPath ?? null,
    hasWorkspace: Boolean(workspaceFolder),
    defaultTargetPath: DEFAULT_COPY_TARGET,
  };
}

export async function copyItemsToWorkspace(
  request: CopyItemsToWorkspaceRequest,
  items: ManagedItem[]
): Promise<CopyItemsToWorkspaceResponse> {
  const workspace = getWorkspaceContext();
  if (!workspace.rootPath) {
    throw new Error('Open a workspace folder before copying items.');
  }

  const targetPath = (request.targetPath || DEFAULT_COPY_TARGET).trim() || DEFAULT_COPY_TARGET;
  const absoluteTarget = path.resolve(workspace.rootPath, targetPath);
  const relativeTarget = path.relative(workspace.rootPath, absoluteTarget);

  if (!relativeTarget || relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    throw new Error('Target path must stay inside the current workspace root.');
  }

  const writtenFiles: string[] = [];
  const overwrittenFiles: string[] = [];

  for (const item of items) {
    const kindDirectory = path.join(absoluteTarget, getKindDirectoryName(item.kind));
    await fs.mkdir(kindDirectory, { recursive: true });

    const filePath = path.join(kindDirectory, `${item.id}.json`);
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    await fs.writeFile(filePath, `${JSON.stringify(item, null, 2)}\n`, 'utf8');
    writtenFiles.push(filePath);
    if (fileExists) {
      overwrittenFiles.push(filePath);
    }
  }

  const manifestPath = path.join(absoluteTarget, 'manifest.json');
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        copiedAt: new Date().toISOString(),
        itemCount: items.length,
        items: items.map((item) => ({ id: item.id, kind: item.kind, name: item.name })),
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  writtenFiles.push(manifestPath);

  return {
    targetAbsolutePath: absoluteTarget,
    writtenFiles,
    overwrittenFiles,
  };
}
