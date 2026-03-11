import type { Category, ManagedItemKind } from '@vscode-monorepo/shared-types';
import { getDefaultCategories } from '../constants';
import { validateCategory } from '../services/validation';
import { createCategoryFile, readJsonFile, writeJsonFile } from './json';
import { getStoragePaths } from './paths';

export async function listCategories(kind: ManagedItemKind): Promise<Category[]> {
  const filePath = getStoragePaths().categoryFiles[kind];
  const fallback = createCategoryFile(getDefaultCategories()[kind]);
  const file = await readJsonFile(filePath, fallback);
  return [...file.items].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name));
}

export async function saveCategory(category: Category): Promise<Category[]> {
  const validated = validateCategory(category);
  const filePath = getStoragePaths().categoryFiles[validated.kind];
  const categories = await listCategories(validated.kind);
  const existingIndex = categories.findIndex((item) => item.id === validated.id);
  const nextCategories = existingIndex >= 0
    ? categories.map((item, index) => (index === existingIndex ? { ...item, ...validated } : item))
    : [...categories, validated];

  await writeJsonFile(filePath, createCategoryFile(nextCategories));
  return nextCategories;
}

export async function deleteCategory(kind: ManagedItemKind, id: string): Promise<Category[]> {
  const filePath = getStoragePaths().categoryFiles[kind];
  const categories = await listCategories(kind);
  const nextCategories = categories.filter((category) => category.id !== id);
  await writeJsonFile(filePath, createCategoryFile(nextCategories));
  return nextCategories;
}
