import * as os from 'node:os';
import * as path from 'node:path';
import type { ManagedItemKind } from '@vscode-monorepo/shared-types';
import { PROJECT_NAME, RESOURCE_KINDS } from '../constants';

export interface StoragePaths {
  root: string;
  configDir: string;
  logsDir: string;
  kindDirs: Record<ManagedItemKind, string>;
  itemDirs: Record<ManagedItemKind, string>;
  categoryFiles: Record<ManagedItemKind, string>;
  indexFiles: Record<ManagedItemKind, string>;
  appConfigFile: string;
  logFile: string;
}

export function getStoragePaths(): StoragePaths {
  const root = path.join(os.homedir(), '.vscode-namewta', PROJECT_NAME);
  const kindDirs = Object.fromEntries(
    RESOURCE_KINDS.map((kind) => [kind, path.join(root, `${kind}s`)])
  ) as Record<ManagedItemKind, string>;
  const itemDirs = Object.fromEntries(
    RESOURCE_KINDS.map((kind) => [kind, path.join(kindDirs[kind], 'items')])
  ) as Record<ManagedItemKind, string>;
  const categoryFiles = Object.fromEntries(
    RESOURCE_KINDS.map((kind) => [kind, path.join(kindDirs[kind], 'categories.json')])
  ) as Record<ManagedItemKind, string>;
  const indexFiles = Object.fromEntries(
    RESOURCE_KINDS.map((kind) => [kind, path.join(kindDirs[kind], 'index.json')])
  ) as Record<ManagedItemKind, string>;

  return {
    root,
    configDir: path.join(root, 'config'),
    logsDir: path.join(root, 'logs'),
    kindDirs,
    itemDirs,
    categoryFiles,
    indexFiles,
    appConfigFile: path.join(root, 'config', 'app.json'),
    logFile: path.join(root, 'logs', 'asset-manager.log'),
  };
}

export function getItemFilePath(kind: ManagedItemKind, id: string): string {
  return path.join(getStoragePaths().itemDirs[kind], `${id}.json`);
}

export function getKindDirectoryName(kind: ManagedItemKind): string {
  return `${kind}s`;
}
