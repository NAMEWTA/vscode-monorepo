import type { Category, CommandItem, ManagedItem, ManagedItemKind, RuleItem, SkillItem } from '@vscode-monorepo/shared-types';

export const EXTENSION_NAME = 'Asset Manager';
export const PROJECT_NAME = 'asset-manager-plugin';
export const SIDEBAR_CONTAINER_ID = 'assetManager';
export const SIDEBAR_VIEW_ID = 'assetManager.sidebar';

export const COMMANDS = {
  showPanel: 'assetManager.showPanel',
  openStorageDirectory: 'assetManager.openStorageDirectory',
} as const;

export const DEFAULT_COPY_TARGET = './claude';
export const GLOBAL_SEARCH_RESULT_LIMIT = 50;
export const LIST_RESULT_LIMIT = 200;

export const RESOURCE_KINDS: ManagedItemKind[] = ['skill', 'command', 'rule'];

export function getDefaultCategories(): Record<ManagedItemKind, Category[]> {
  return {
    skill: [
      { id: 'default', kind: 'skill', name: 'Default', description: 'Default skill category', order: 0 },
    ],
    command: [
      { id: 'default', kind: 'command', name: 'Default', description: 'Default command category', order: 0 },
    ],
    rule: [
      { id: 'default', kind: 'rule', name: 'Default', description: 'Default rule category', order: 0 },
    ],
  };
}

export function createDefaultItem(kind: ManagedItemKind): ManagedItem {
  const now = new Date().toISOString();
  const base = {
    id: '',
    kind,
    name: '',
    description: '',
    categoryIds: ['default'],
    tags: [],
    source: 'user' as const,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };

  if (kind === 'skill') {
    const item: SkillItem = {
      ...base,
      kind: 'skill',
      trigger: '',
      content: '',
      examples: [],
    };
    return item;
  }

  if (kind === 'command') {
    const item: CommandItem = {
      ...base,
      kind: 'command',
      commandId: '',
      title: '',
      when: '',
      notes: '',
    };
    return item;
  }

  const item: RuleItem = {
    ...base,
    kind: 'rule',
    scope: 'global',
    content: '',
    appliesTo: [],
    priority: 100,
  };
  return item;
}
