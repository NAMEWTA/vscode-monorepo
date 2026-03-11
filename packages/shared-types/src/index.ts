/**
 * @module @vscode-monorepo/shared-types
 *
 * Shared type definitions used across VS Code extensions and webviews.
 * Re-exports all sub-modules for convenience.
 */

export type { WebviewState, WebviewTheme, WebviewPanelConfig } from './webview.js';
export type {
  MessageEnvelope,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
  MessageHandler,
} from './message.js';
export type { ExtensionConfig, ExtensionContext, CommandDefinition } from './extension.js';
export type {
  ManagedItemKind,
  ManagedItemBase,
  SkillItem,
  CommandItem,
  RuleItem,
  ManagedItem,
  ManagedItemSummary,
  Category,
  SearchIndexEntry,
  CategoryFile,
  IndexFile,
  DashboardCounts,
  WorkspaceContext,
  StorageInfo,
  InitializeRequest,
  InitializeResponse,
  ListItemsRequest,
  ListItemsResponse,
  GetItemRequest,
  GetItemResponse,
  SaveItemRequest,
  SaveItemResponse,
  DeleteItemRequest,
  DeleteItemResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
  SaveCategoryRequest,
  SaveCategoryResponse,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  GlobalSearchResult,
  GlobalSearchRequest,
  GlobalSearchResponse,
  CopyItemRef,
  CopyItemsToWorkspaceRequest,
  CopyItemsToWorkspaceResponse,
  OpenStorageDirectoryResponse,
  PersistedWebviewState,
  SystemErrorPayload,
} from './asset-manager.js';
