/**
 * @module @vscode-monorepo/webview-bridge
 *
 * Typed, bidirectional message bridge between VS Code extension host and webviews.
 *
 * Usage:
 *   Extension side  → import { HostBridge } from '@vscode-monorepo/webview-bridge/host'
 *   Webview side    → import { ClientBridge } from '@vscode-monorepo/webview-bridge/client'
 */

export type {
  MessageEnvelope,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
  MessageHandler,
} from '@vscode-monorepo/shared-types/message';

export { HostBridge } from './host.js';
export { ClientBridge } from './client.js';
