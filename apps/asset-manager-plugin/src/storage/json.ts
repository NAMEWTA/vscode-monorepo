import * as fs from 'node:fs/promises';
import type { CategoryFile, IndexFile, ManagedItem } from '@vscode-monorepo/shared-types';

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function createEmptyIndex(): IndexFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

export function createCategoryFile(items: CategoryFile['items']): CategoryFile {
  return {
    version: 1,
    items,
  };
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function toSummary(item: ManagedItem) {
  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    description: item.description,
    categoryIds: [...item.categoryIds],
    tags: [...item.tags],
    enabled: item.enabled,
    source: item.source,
    updatedAt: item.updatedAt,
  };
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
