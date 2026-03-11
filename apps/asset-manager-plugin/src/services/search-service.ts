import type { DashboardCounts, GlobalSearchResult, ManagedItemKind } from '@vscode-monorepo/shared-types';
import { GLOBAL_SEARCH_RESULT_LIMIT, RESOURCE_KINDS } from '../constants';
import { searchIndex } from '../storage/item-repository';

export async function searchAcrossKinds(query: string): Promise<GlobalSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const allResults = await Promise.all(
    RESOURCE_KINDS.map(async (kind) => {
      const items = await searchIndex(kind, { query: trimmedQuery });
      return items.map((item) => ({ kind, item }));
    })
  );

  return allResults
    .flat()
    .sort((left, right) => left.item.name.localeCompare(right.item.name))
    .slice(0, GLOBAL_SEARCH_RESULT_LIMIT);
}

export function getEmptyCounts(): DashboardCounts {
  return {
    skill: 0,
    command: 0,
    rule: 0,
  };
}

export function updateCount(counts: DashboardCounts, kind: ManagedItemKind, value: number): DashboardCounts {
  return {
    ...counts,
    [kind]: value,
  };
}
