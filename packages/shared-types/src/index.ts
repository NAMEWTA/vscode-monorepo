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
