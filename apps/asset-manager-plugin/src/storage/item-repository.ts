import * as fs from 'node:fs/promises';
import type { ManagedItem, ManagedItemKind, SearchIndexEntry } from '@vscode-monorepo/shared-types';
import { LIST_RESULT_LIMIT } from '../constants';
import { validateManagedItem } from '../services/validation';
import { readJsonFile, toSummary, writeJsonFile, isNodeError, normalizeName } from './json';
import { createIndexEntry, readIndex, sortIndexEntries, writeIndex } from './index-repository';
import { getItemFilePath, getStoragePaths } from './paths';

export async function listItems(kind: ManagedItemKind): Promise<ManagedItem[]> {
  const itemDir = getStoragePaths().itemDirs[kind];
  const entries = await fs.readdir(itemDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  const items = await Promise.all(
    files.map(async (file) => {
      const item = await readJsonFile<ManagedItem | null>(getItemFilePath(kind, file.name.replace(/\.json$/, '')), null);
      return item;
    })
  );

  return items.filter((item): item is ManagedItem => item !== null);
}

export async function getItem(kind: ManagedItemKind, id: string): Promise<ManagedItem> {
  const item = await readJsonFile<ManagedItem | null>(getItemFilePath(kind, id), null);
  if (!item) {
    throw new Error(`Item not found: ${kind}/${id}`);
  }
  return item;
}

export async function saveItem(item: ManagedItem): Promise<{ item: ManagedItem; summary: ReturnType<typeof toSummary> }> {
  const validated = validateManagedItem(item);
  const filePath = getItemFilePath(validated.kind, validated.id);
  await writeJsonFile(filePath, validated);

  const index = await readIndex(validated.kind);
  const nextEntry = createIndexEntry(validated);
  const nextItems = updateIndexEntry(index.items, nextEntry);
  await writeIndex(validated.kind, sortIndexEntries(nextItems));

  return {
    item: validated,
    summary: toSummary(validated),
  };
}

export async function deleteItem(kind: ManagedItemKind, id: string): Promise<void> {
  try {
    await fs.unlink(getItemFilePath(kind, id));
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  const index = await readIndex(kind);
  await writeIndex(kind, index.items.filter((entry) => entry.id !== id));
}

export async function rebuildIndex(kind: ManagedItemKind): Promise<SearchIndexEntry[]> {
  const items = await listItems(kind);
  const entries = sortIndexEntries(items.map(createIndexEntry));
  await writeIndex(kind, entries);
  return entries;
}

export async function searchIndex(kind: ManagedItemKind, options: { categoryId?: string; query?: string }): Promise<ReturnType<typeof toSummary>[]> {
  const index = await readIndex(kind);
  const query = normalizeName(options.query ?? '');
  const filteredEntries = index.items.filter((entry) => {
    const categoryMatch = options.categoryId ? entry.categoryIds.includes(options.categoryId) : true;
    const queryMatch = query ? entry.normalizedName.includes(query) : true;
    return categoryMatch && queryMatch;
  });

  return filteredEntries.slice(0, LIST_RESULT_LIMIT).map(({ normalizedName: _normalizedName, ...entry }) => ({
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    description: entry.description,
    categoryIds: [...entry.categoryIds],
    tags: [...entry.tags],
    enabled: entry.enabled,
    source: entry.source,
    updatedAt: entry.updatedAt,
  }));
}

function updateIndexEntry(entries: SearchIndexEntry[], nextEntry: SearchIndexEntry): SearchIndexEntry[] {
  const index = entries.findIndex((entry) => entry.id === nextEntry.id);
  if (index === -1) {
    return [...entries, nextEntry];
  }

  return entries.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry));
}
