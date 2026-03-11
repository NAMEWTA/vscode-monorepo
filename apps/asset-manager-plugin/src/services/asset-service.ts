import type {
  CopyItemsToWorkspaceRequest,
  CopyItemsToWorkspaceResponse,
  DashboardCounts,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  DeleteItemRequest,
  DeleteItemResponse,
  GetItemRequest,
  GetItemResponse,
  GlobalSearchRequest,
  GlobalSearchResponse,
  InitializeRequest,
  InitializeResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
  ListItemsRequest,
  ListItemsResponse,
  ManagedItem,
  ManagedItemKind,
  OpenStorageDirectoryResponse,
  SaveCategoryRequest,
  SaveCategoryResponse,
  SaveItemRequest,
  SaveItemResponse,
  WorkspaceContext,
} from '@vscode-monorepo/shared-types';
import * as vscode from 'vscode';
import { RESOURCE_KINDS, createDefaultItem } from '../constants';
import { listCategories, saveCategory, deleteCategory } from '../storage/category-repository';
import { ensureStorageInitialized, updateLastReindexAt } from '../storage/initializer';
import { deleteItem, getItem, rebuildIndex, saveItem, searchIndex } from '../storage/item-repository';
import { getStoragePaths } from '../storage/paths';
import { searchAcrossKinds } from './search-service';
import { ensureCategoryExists } from './validation';
import { copyItemsToWorkspace, getWorkspaceContext } from './workspace-copy-service';

export class AssetManagerService {
  async initialize(request: InitializeRequest = {}): Promise<InitializeResponse> {
    const storageInfo = await ensureStorageInitialized();
    await this.rebuildAllIndexes();
    const activeKind = request.kind ?? 'skill';

    return {
      counts: await this.getCounts(),
      storageInfo,
      workspace: this.getWorkspaceContext(),
      categories: await listCategories(activeKind),
      items: await searchIndex(activeKind, {}),
    };
  }

  async listItems(request: ListItemsRequest): Promise<ListItemsResponse> {
    if (request.global) {
      const results = await searchAcrossKinds(request.query ?? '');
      return {
        items: results.map((result) => result.item),
        counts: await this.getCounts(),
      };
    }

    const kind = request.kind ?? 'skill';
    const items = await searchIndex(kind, {
      categoryId: request.categoryId,
      query: request.query,
    });

    return {
      items,
      counts: await this.getCounts(),
    };
  }

  async getItem(request: GetItemRequest): Promise<GetItemResponse> {
    return {
      item: await getItem(request.kind, request.id),
    };
  }

  async saveItem(request: SaveItemRequest): Promise<SaveItemResponse> {
    const categories = await listCategories(request.item.kind);
    ensureCategoryExists(request.item.categoryIds, categories);

    const result = await saveItem(request.item);
    return {
      ...result,
      counts: await this.getCounts(),
    };
  }

  async deleteItem(request: DeleteItemRequest): Promise<DeleteItemResponse> {
    await deleteItem(request.kind, request.id);
    return {
      success: true,
      counts: await this.getCounts(),
    };
  }

  async listCategories(request: ListCategoriesRequest): Promise<ListCategoriesResponse> {
    return {
      categories: await listCategories(request.kind),
    };
  }

  async saveCategory(request: SaveCategoryRequest): Promise<SaveCategoryResponse> {
    const categories = await saveCategory(request.category);
    return {
      category: categories.find((category) => category.id === request.category.id) ?? request.category,
      categories,
    };
  }

  async deleteCategory(request: DeleteCategoryRequest): Promise<DeleteCategoryResponse> {
    const items = await searchIndex(request.kind, {});
    const isReferenced = items.some((item) => item.categoryIds.includes(request.id));
    if (isReferenced) {
      throw new Error('Cannot delete a category that is still referenced by items.');
    }

    const categories = await deleteCategory(request.kind, request.id);
    return {
      success: true,
      categories,
    };
  }

  async globalSearch(request: GlobalSearchRequest): Promise<GlobalSearchResponse> {
    return {
      query: request.query,
      results: await searchAcrossKinds(request.query),
    };
  }

  async copyItemsToWorkspace(request: CopyItemsToWorkspaceRequest): Promise<CopyItemsToWorkspaceResponse> {
    const items = await Promise.all(request.items.map((itemRef) => getItem(itemRef.kind, itemRef.id)));
    return copyItemsToWorkspace(request, items);
  }

  async openStorageDirectory(): Promise<OpenStorageDirectoryResponse> {
    const storage = getStoragePaths();
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(storage.root));
    return { rootPath: storage.root };
  }

  getWorkspaceContext(): WorkspaceContext {
    return getWorkspaceContext();
  }

  createNewItem(kind: ManagedItemKind): ManagedItem {
    return createDefaultItem(kind);
  }

  private async getCounts(): Promise<DashboardCounts> {
    const countsEntries = await Promise.all(
      RESOURCE_KINDS.map(async (kind) => [kind, (await searchIndex(kind, {})).length] as const)
    );

    return countsEntries.reduce<DashboardCounts>(
      (counts, [kind, value]) => ({
        ...counts,
        [kind]: value,
      }),
      {
        skill: 0,
        command: 0,
        rule: 0,
      }
    );
  }

  private async rebuildAllIndexes(): Promise<void> {
    await Promise.all(RESOURCE_KINDS.map((kind) => rebuildIndex(kind)));
    await updateLastReindexAt(new Date().toISOString());
  }
}
