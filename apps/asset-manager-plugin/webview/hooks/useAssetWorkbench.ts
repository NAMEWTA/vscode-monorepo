import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClientBridge } from '@vscode-monorepo/webview-bridge/client';
import type {
  Category,
  CopyItemsToWorkspaceRequest,
  CopyItemsToWorkspaceResponse,
  DashboardCounts,
  DeleteCategoryResponse,
  GetItemResponse,
  GlobalSearchResponse,
  InitializeResponse,
  ListCategoriesResponse,
  ListItemsResponse,
  ManagedItem,
  ManagedItemKind,
  ManagedItemSummary,
  PersistedWebviewState,
  SaveCategoryResponse,
  SaveItemResponse,
  WorkspaceContext,
} from '@vscode-monorepo/shared-types';

const DEFAULT_STATE: PersistedWebviewState = {
  activeKind: 'skill',
  selectedItemId: null,
  categoryId: undefined,
  query: '',
  globalQuery: '',
};

export function useAssetWorkbench() {
  const bridge = useMemo(() => ClientBridge.getInstance(), []);
  const persistedState = bridge.getState<PersistedWebviewState>() ?? DEFAULT_STATE;

  const [activeKind, setActiveKind] = useState<ManagedItemKind>(persistedState.activeKind ?? 'skill');
  const [categoryId, setCategoryId] = useState<string | undefined>(persistedState.categoryId);
  const [query, setQuery] = useState(persistedState.query ?? '');
  const [globalQuery, setGlobalQuery] = useState(persistedState.globalQuery ?? '');
  const [counts, setCounts] = useState<DashboardCounts>({ skill: 0, command: 0, rule: 0 });
  const [storageRoot, setStorageRoot] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ManagedItemSummary[]>([]);
  const [globalResults, setGlobalResults] = useState<ManagedItemSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(persistedState.selectedItemId);
  const [selectedItem, setSelectedItem] = useState<ManagedItem | null>(null);
  const [draft, setDraft] = useState<ManagedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistState = useCallback(
    (nextState: Partial<PersistedWebviewState>) => {
      bridge.setState({
        activeKind,
        selectedItemId,
        categoryId,
        query,
        globalQuery,
        ...nextState,
      });
    },
    [activeKind, bridge, categoryId, globalQuery, query, selectedItemId]
  );

  const loadItems = useCallback(
    async (next: { kind?: ManagedItemKind; categoryId?: string; query?: string; global?: boolean } = {}) => {
      const response = await bridge.request<typeof next, ListItemsResponse>('items.list', {
        kind: next.kind ?? activeKind,
        categoryId: next.categoryId,
        query: next.query,
        global: next.global,
      });
      setCounts(response.counts);
      return response.items;
    },
    [activeKind, bridge]
  );

  const loadCategories = useCallback(
    async (kind: ManagedItemKind) => {
      const response = await bridge.request<{ kind: ManagedItemKind }, ListCategoriesResponse>('categories.list', { kind });
      setCategories(response.categories);
      return response.categories;
    },
    [bridge]
  );

  const loadItemDetail = useCallback(
    async (kind: ManagedItemKind, id: string) => {
      const response = await bridge.request<{ kind: ManagedItemKind; id: string }, GetItemResponse>('items.get', { kind, id });
      setSelectedItem(response.item);
      setDraft(response.item);
      setSelectedItemId(response.item.id);
      persistState({ selectedItemId: response.item.id });
    },
    [bridge, persistState]
  );

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bridge.request<{ kind?: ManagedItemKind }, InitializeResponse>('app.initialize', {
        kind: activeKind,
      });
      setCounts(response.counts);
      setStorageRoot(response.storageInfo.rootPath);
      setWorkspace(response.workspace);
      setCategories(response.categories);
      setItems(response.items);
      if (persistedState.selectedItemId) {
        await loadItemDetail(activeKind, persistedState.selectedItemId);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  }, [activeKind, bridge, loadItemDetail, persistedState.selectedItemId]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const handler = async () => {
      const nextItems = await loadItems({ kind: activeKind, categoryId, query });
      setItems(nextItems);
      await loadCategories(activeKind);
    };

    bridge.onMessage('items.updated', () => handler());
    bridge.onMessage('categories.updated', () => loadCategories(activeKind));
    bridge.onMessage('system.error', (payload: { message: string }) => setError(payload.message));
  }, [activeKind, bridge, categoryId, loadCategories, loadItems, query]);

  const refreshCurrentKind = useCallback(async () => {
    setLoading(true);
    const [nextCategories, nextItems] = await Promise.all([
      loadCategories(activeKind),
      loadItems({ kind: activeKind, categoryId, query }),
    ]);
    setCategories(nextCategories);
    setItems(nextItems);
    setLoading(false);
  }, [activeKind, categoryId, loadCategories, loadItems, query]);

  const runGlobalSearch = useCallback(
    async (nextQuery: string) => {
      setGlobalQuery(nextQuery);
      persistState({ globalQuery: nextQuery });
      if (!nextQuery.trim()) {
        setGlobalResults([]);
        return;
      }

      const response = await bridge.request<{ query: string }, GlobalSearchResponse>('search.global', {
        query: nextQuery,
      });
      setGlobalResults(response.results.map((result) => result.item));
    },
    [bridge, persistState]
  );

  const selectKind = useCallback(
    async (kind: ManagedItemKind) => {
      setActiveKind(kind);
      setSelectedItemId(null);
      setSelectedItem(null);
      setDraft(null);
      setCategoryId(undefined);
      persistState({ activeKind: kind, selectedItemId: null, categoryId: undefined });
      const [nextCategories, nextItems] = await Promise.all([
        loadCategories(kind),
        loadItems({ kind, query: '', categoryId: undefined }),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
      setQuery('');
    },
    [loadCategories, loadItems, persistState]
  );

  const filterByCategory = useCallback(
    async (nextCategoryId?: string) => {
      setCategoryId(nextCategoryId);
      persistState({ categoryId: nextCategoryId });
      const nextItems = await loadItems({ kind: activeKind, categoryId: nextCategoryId, query });
      setItems(nextItems);
    },
    [activeKind, loadItems, persistState, query]
  );

  const updateQuery = useCallback(
    async (nextQuery: string) => {
      setQuery(nextQuery);
      persistState({ query: nextQuery });
      const nextItems = await loadItems({ kind: activeKind, categoryId, query: nextQuery });
      setItems(nextItems);
    },
    [activeKind, categoryId, loadItems, persistState]
  );

  const selectItem = useCallback(
    async (item: ManagedItemSummary) => {
      setActiveKind(item.kind);
      setCategoryId(undefined);
      setQuery('');
      persistState({ activeKind: item.kind, categoryId: undefined, query: '', selectedItemId: item.id });

      const [nextCategories, nextItems] = await Promise.all([
        loadCategories(item.kind),
        loadItems({ kind: item.kind, categoryId: undefined, query: '' }),
      ]);

      setCategories(nextCategories);
      setItems(nextItems);
      await loadItemDetail(item.kind, item.id);
    },
    [loadCategories, loadItemDetail, loadItems, persistState]
  );

  const createNewItem = useCallback(() => {
    const now = new Date().toISOString();
    const item: ManagedItem =
      activeKind === 'skill'
        ? {
            id: '',
            kind: 'skill',
            name: '',
            description: '',
            categoryIds: ['default'],
            tags: [],
            source: 'user',
            enabled: true,
            createdAt: now,
            updatedAt: now,
            trigger: '',
            content: '',
            examples: [],
          }
        : activeKind === 'command'
          ? {
              id: '',
              kind: 'command',
              name: '',
              description: '',
              categoryIds: ['default'],
              tags: [],
              source: 'user',
              enabled: true,
              createdAt: now,
              updatedAt: now,
              commandId: '',
              title: '',
              when: '',
              notes: '',
            }
          : {
              id: '',
              kind: 'rule',
              name: '',
              description: '',
              categoryIds: ['default'],
              tags: [],
              source: 'user',
              enabled: true,
              createdAt: now,
              updatedAt: now,
              scope: 'global',
              content: '',
              appliesTo: [],
              priority: 100,
            };

    setSelectedItem(null);
    setDraft(item);
    setSelectedItemId(null);
    persistState({ selectedItemId: null });
  }, [activeKind, persistState]);

  const saveDraft = useCallback(async () => {
    if (!draft) {
      return;
    }

    setSaving(true);
    try {
      const response = await bridge.request<{ item: ManagedItem }, SaveItemResponse>('items.save', {
        item: draft,
      });
      setCounts(response.counts);
      setSelectedItem(response.item);
      setDraft(response.item);
      setSelectedItemId(response.item.id);
      persistState({ selectedItemId: response.item.id });
      await refreshCurrentKind();
    } finally {
      setSaving(false);
    }
  }, [bridge, draft, persistState, refreshCurrentKind]);

  const saveCategory = useCallback(
    async (category: Category) => {
      const response = await bridge.request<{ category: Category }, SaveCategoryResponse>('categories.save', {
        category,
      });
      setCategories(response.categories);
      return response.category;
    },
    [bridge]
  );

  const deleteCategory = useCallback(
    async (category: Category) => {
      const response = await bridge.request<{ kind: ManagedItemKind; id: string }, DeleteCategoryResponse>('categories.delete', {
        kind: category.kind,
        id: category.id,
      });
      setCategories(response.categories);
      if (categoryId === category.id) {
        setCategoryId(undefined);
        persistState({ categoryId: undefined });
        const nextItems = await loadItems({ kind: activeKind, categoryId: undefined, query });
        setItems(nextItems);
      }
    },
    [activeKind, bridge, categoryId, loadItems, persistState, query]
  );

  const deleteSelectedItem = useCallback(async () => {
    if (!selectedItem) {
      return;
    }

    await bridge.request('items.delete', { kind: selectedItem.kind, id: selectedItem.id } satisfies { kind: ManagedItemKind; id: string });
    setSelectedItem(null);
    setSelectedItemId(null);
    setDraft(null);
    persistState({ selectedItemId: null });
    await refreshCurrentKind();
  }, [bridge, persistState, refreshCurrentKind, selectedItem]);

  const copyItems = useCallback(
    async (request: CopyItemsToWorkspaceRequest): Promise<CopyItemsToWorkspaceResponse> => {
      return bridge.request('workspace.copyItems', request);
    },
    [bridge]
  );

  const openStorageDirectory = useCallback(async () => {
    await bridge.request('system.openStorageDirectory', {});
  }, [bridge]);

  const updateDraft = useCallback((nextDraft: ManagedItem) => {
    setDraft(nextDraft);
  }, []);

  return {
    activeKind,
    categoryId,
    query,
    globalQuery,
    counts,
    storageRoot,
    workspace,
    categories,
    items,
    globalResults,
    selectedItem,
    selectedItemId,
    draft,
    loading,
    saving,
    error,
    actions: {
      refreshCurrentKind,
      runGlobalSearch,
      selectKind,
      filterByCategory,
      updateQuery,
      selectItem,
      createNewItem,
      saveDraft,
      saveCategory,
      deleteCategory,
      deleteSelectedItem,
      copyItems,
      openStorageDirectory,
      updateDraft,
      loadCategories,
      initialize,
    },
  };
}
