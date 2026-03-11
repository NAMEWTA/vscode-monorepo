import type { IndexFile, ManagedItem, ManagedItemKind, SearchIndexEntry } from '@vscode-monorepo/shared-types';
import { readJsonFile, normalizeName, toSummary, writeJsonFile } from './json';
import { getStoragePaths } from './paths';

export async function readIndex(kind: ManagedItemKind): Promise<IndexFile> {
  const filePath = getStoragePaths().indexFiles[kind];
  return readJsonFile(filePath, {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: [],
  });
}

export async function writeIndex(kind: ManagedItemKind, items: SearchIndexEntry[]): Promise<void> {
  const filePath = getStoragePaths().indexFiles[kind];
  await writeJsonFile(filePath, {
    version: 1,
    updatedAt: new Date().toISOString(),
    items,
  } satisfies IndexFile);
}

export function createIndexEntry(item: ManagedItem): SearchIndexEntry {
  const summary = toSummary(item);
  return {
    ...summary,
    normalizedName: normalizeName(summary.name),
  };
}

export function sortIndexEntries(entries: SearchIndexEntry[]): SearchIndexEntry[] {
  return [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.name.localeCompare(right.name));
}
