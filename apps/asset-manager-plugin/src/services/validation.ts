import type { Category, CommandItem, ManagedItem, ManagedItemKind, RuleItem, SkillItem } from '@vscode-monorepo/shared-types';

export function ensureKind(kind: string): asserts kind is ManagedItemKind {
  if (kind !== 'skill' && kind !== 'command' && kind !== 'rule') {
    throw new Error(`Unsupported item kind: ${kind}`);
  }
}

export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTagList(value: string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.map((tag) => tag.trim()).filter(Boolean))];
}

export function normalizeCategoryIds(value: string[] | undefined): string[] {
  const categoryIds = [...new Set((value ?? []).map((item) => item.trim()).filter(Boolean))];
  return categoryIds.length > 0 ? categoryIds : ['default'];
}

export function validateCategory(category: Category): Category {
  const name = category.name.trim();
  if (!name) {
    throw new Error('Category name is required.');
  }

  return {
    ...category,
    id: category.id.trim() || createSlug(name),
    name,
    description: category.description?.trim() || undefined,
  };
}

export function validateManagedItem(item: ManagedItem): ManagedItem {
  const name = item.name.trim();
  if (!name) {
    throw new Error('Item name is required.');
  }

  const normalizedBase = {
    ...item,
    id: item.id.trim() || createSlug(name),
    name,
    description: item.description?.trim() || undefined,
    categoryIds: normalizeCategoryIds(item.categoryIds),
    tags: normalizeTagList(item.tags),
    updatedAt: new Date().toISOString(),
  };

  if (normalizedBase.kind === 'skill') {
    return validateSkillItem(normalizedBase);
  }

  if (normalizedBase.kind === 'command') {
    return validateCommandItem(normalizedBase);
  }

  return validateRuleItem(normalizedBase);
}

function validateSkillItem(item: SkillItem): SkillItem {
  return {
    ...item,
    trigger: item.trigger?.trim() || undefined,
    content: item.content.trim(),
    examples: normalizeTagList(item.examples),
  };
}

function validateCommandItem(item: CommandItem): CommandItem {
  const commandId = item.commandId.trim();
  const title = item.title.trim();

  if (!commandId) {
    throw new Error('Command ID is required.');
  }

  if (!title) {
    throw new Error('Command title is required.');
  }

  return {
    ...item,
    commandId,
    title,
    when: item.when?.trim() || undefined,
    notes: item.notes?.trim() || undefined,
  };
}

function validateRuleItem(item: RuleItem): RuleItem {
  return {
    ...item,
    content: item.content.trim(),
    appliesTo: normalizeTagList(item.appliesTo),
    priority: typeof item.priority === 'number' ? item.priority : undefined,
  };
}

export function ensureCategoryExists(categoryIds: string[], availableCategories: Category[]): void {
  const availableCategoryIds = new Set(availableCategories.map((category) => category.id));
  for (const categoryId of categoryIds) {
    if (!availableCategoryIds.has(categoryId)) {
      throw new Error(`Category does not exist: ${categoryId}`);
    }
  }
}
