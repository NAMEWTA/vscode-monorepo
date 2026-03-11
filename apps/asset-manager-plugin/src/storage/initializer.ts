import * as fs from 'node:fs/promises';
import { DEFAULT_COPY_TARGET, getDefaultCategories, RESOURCE_KINDS } from '../constants';
import { createCategoryFile, createEmptyIndex, readJsonFile, writeJsonFile } from './json';
import { getStoragePaths } from './paths';

interface AppConfig {
  version: 1;
  initializedAt: string;
  lastReindexAt: string | null;
  defaultCopyTarget: string;
}

export async function ensureStorageInitialized(): Promise<{ rootPath: string; initialized: boolean; lastReindexAt: string | null }> {
  const paths = getStoragePaths();

  await fs.mkdir(paths.root, { recursive: true });
  await fs.mkdir(paths.configDir, { recursive: true });
  await fs.mkdir(paths.logsDir, { recursive: true });

  for (const kind of RESOURCE_KINDS) {
    await fs.mkdir(paths.kindDirs[kind], { recursive: true });
    await fs.mkdir(paths.itemDirs[kind], { recursive: true });
  }

  const defaultCategories = getDefaultCategories();
  for (const kind of RESOURCE_KINDS) {
    const existingCategories = await readJsonFile(paths.categoryFiles[kind], createCategoryFile([]));
    if (existingCategories.items.length === 0) {
      await writeJsonFile(paths.categoryFiles[kind], createCategoryFile(defaultCategories[kind]));
    }

    const existingIndex = await readJsonFile(paths.indexFiles[kind], createEmptyIndex());
    if (existingIndex.items.length === 0 && existingIndex.version !== 1) {
      await writeJsonFile(paths.indexFiles[kind], createEmptyIndex());
    } else if (existingIndex.version !== 1) {
      await writeJsonFile(paths.indexFiles[kind], createEmptyIndex());
    }
  }

  const fallbackConfig: AppConfig = {
    version: 1,
    initializedAt: new Date().toISOString(),
    lastReindexAt: null,
    defaultCopyTarget: DEFAULT_COPY_TARGET,
  };
  const config = await readJsonFile(paths.appConfigFile, fallbackConfig);
  if (!config.version) {
    await writeJsonFile(paths.appConfigFile, fallbackConfig);
    return {
      rootPath: paths.root,
      initialized: true,
      lastReindexAt: fallbackConfig.lastReindexAt,
    };
  }

  await writeJsonFile(paths.appConfigFile, {
    ...fallbackConfig,
    ...config,
  });

  return {
    rootPath: paths.root,
    initialized: true,
    lastReindexAt: config.lastReindexAt ?? null,
  };
}

export async function updateLastReindexAt(lastReindexAt: string): Promise<void> {
  const paths = getStoragePaths();
  const current = await readJsonFile<AppConfig>(paths.appConfigFile, {
    version: 1,
    initializedAt: new Date().toISOString(),
    lastReindexAt: null,
    defaultCopyTarget: DEFAULT_COPY_TARGET,
  });

  await writeJsonFile(paths.appConfigFile, {
    ...current,
    version: 1,
    lastReindexAt,
  });
}
