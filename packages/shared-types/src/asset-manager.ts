/**
 * Shared types for the Asset Manager extension.
 */

export type ManagedItemKind = 'skill' | 'command' | 'rule';

export interface ManagedItemBase {
  id: string;
  kind: ManagedItemKind;
  name: string;
  description?: string;
  categoryIds: string[];
  tags: string[];
  source: 'user' | 'system';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillItem extends ManagedItemBase {
  kind: 'skill';
  trigger?: string;
  content: string;
  examples: string[];
}

export interface CommandItem extends ManagedItemBase {
  kind: 'command';
  commandId: string;
  title: string;
  when?: string;
  argsSchema?: Record<string, unknown>;
  notes?: string;
}

export interface RuleItem extends ManagedItemBase {
  kind: 'rule';
  scope: 'global' | 'workspace' | 'language';
  content: string;
  appliesTo: string[];
  priority?: number;
}

export type ManagedItem = SkillItem | CommandItem | RuleItem;

export interface ManagedItemSummary {
  id: string;
  kind: ManagedItemKind;
  name: string;
  description?: string;
  categoryIds: string[];
  tags: string[];
  enabled: boolean;
  source: 'user' | 'system';
  updatedAt: string;
}

export interface Category {
  id: string;
  kind: ManagedItemKind;
  name: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface SearchIndexEntry {
  id: string;
  kind: ManagedItemKind;
  name: string;
  normalizedName: string;
  description?: string;
  categoryIds: string[];
  tags: string[];
  enabled: boolean;
  source: 'user' | 'system';
  updatedAt: string;
}

export interface CategoryFile {
  version: 1;
  items: Category[];
}

export interface IndexFile {
  version: 1;
  updatedAt: string;
  items: SearchIndexEntry[];
}

export interface DashboardCounts {
  skill: number;
  command: number;
  rule: number;
}

export interface WorkspaceContext {
  name: string;
  rootPath: string | null;
  hasWorkspace: boolean;
  defaultTargetPath: string;
}

export interface StorageInfo {
  rootPath: string;
  initialized: boolean;
  lastReindexAt: string | null;
}

export interface InitializeRequest {
  kind?: ManagedItemKind;
}

export interface InitializeResponse {
  counts: DashboardCounts;
  storageInfo: StorageInfo;
  workspace: WorkspaceContext;
  categories: Category[];
  items: ManagedItemSummary[];
}

export interface ListItemsRequest {
  kind?: ManagedItemKind;
  categoryId?: string;
  query?: string;
  global?: boolean;
}

export interface ListItemsResponse {
  items: ManagedItemSummary[];
  counts: DashboardCounts;
}

export interface GetItemRequest {
  kind: ManagedItemKind;
  id: string;
}

export interface GetItemResponse {
  item: ManagedItem;
}

export interface SaveItemRequest {
  item: ManagedItem;
}

export interface SaveItemResponse {
  item: ManagedItem;
  summary: ManagedItemSummary;
  counts: DashboardCounts;
}

export interface DeleteItemRequest {
  kind: ManagedItemKind;
  id: string;
}

export interface DeleteItemResponse {
  success: true;
  counts: DashboardCounts;
}

export interface ListCategoriesRequest {
  kind: ManagedItemKind;
}

export interface ListCategoriesResponse {
  categories: Category[];
}

export interface SaveCategoryRequest {
  category: Category;
}

export interface SaveCategoryResponse {
  category: Category;
  categories: Category[];
}

export interface DeleteCategoryRequest {
  kind: ManagedItemKind;
  id: string;
}

export interface DeleteCategoryResponse {
  success: true;
  categories: Category[];
}

export interface GlobalSearchResult {
  kind: ManagedItemKind;
  item: ManagedItemSummary;
}

export interface GlobalSearchRequest {
  query: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResult[];
}

export interface CopyItemRef {
  kind: ManagedItemKind;
  id: string;
}

export interface CopyItemsToWorkspaceRequest {
  items: CopyItemRef[];
  targetPath: string;
}

export interface CopyItemsToWorkspaceResponse {
  targetAbsolutePath: string;
  writtenFiles: string[];
  overwrittenFiles: string[];
}

export interface OpenStorageDirectoryResponse {
  rootPath: string;
}

export interface PersistedWebviewState {
  activeKind: ManagedItemKind;
  selectedItemId: string | null;
  categoryId?: string;
  query: string;
  globalQuery: string;
}

export interface SystemErrorPayload {
  code: string;
  message: string;
}
