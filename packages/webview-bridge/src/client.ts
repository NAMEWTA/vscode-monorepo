/**
 * Webview (browser) side of the webview bridge.
 *
 * Communicates with the VS Code extension host via the acquireVsCodeApi().
 * Used inside React webview code (browser context).
 */

import type {
  MessageEnvelope,
  MessageHandler,
  ResponseMessage,
} from '@vscode-monorepo/shared-types/message';
import { generateId, createDeferred } from '@vscode-monorepo/shared-utils';
import type { Deferred } from '@vscode-monorepo/shared-utils';

/** VS Code API shape available inside webviews */
interface VsCodeApi {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): T;
}

/** Global function injected by VS Code into the webview iframe */
declare function acquireVsCodeApi(): VsCodeApi;

export class ClientBridge {
  private static instance: ClientBridge | undefined;
  private readonly vscode: VsCodeApi;
  private readonly handlers = new Map<string, MessageHandler>();
  private readonly pendingRequests = new Map<string, Deferred<unknown>>();

  private constructor() {
    this.vscode = acquireVsCodeApi();

    window.addEventListener('message', (event: MessageEvent) => {
      void this.handleMessage(event.data);
    });
  }

  /**
   * Get singleton instance (VS Code only allows one acquireVsCodeApi call).
   */
  static getInstance(): ClientBridge {
    if (!ClientBridge.instance) {
      ClientBridge.instance = new ClientBridge();
    }
    return ClientBridge.instance;
  }

  /**
   * Register a handler for notifications from the extension host.
   */
  onMessage<TPayload = unknown>(type: string, handler: MessageHandler<TPayload>): this {
    this.handlers.set(type, handler as MessageHandler);
    return this;
  }

  /**
   * Send a request to the extension host and await a typed response.
   */
  async request<TPayload = unknown, TResult = unknown>(
    type: string,
    payload: TPayload,
  ): Promise<TResult> {
    const id = generateId();
    const deferred = createDeferred<TResult>();

    this.pendingRequests.set(id, deferred as Deferred<unknown>);

    const message: MessageEnvelope<string, TPayload> = {
      type,
      payload,
      id,
      timestamp: Date.now(),
    };

    this.vscode.postMessage(message);

    // Timeout after 30 seconds
    const timer = setTimeout(() => {
      this.pendingRequests.delete(id);
      deferred.reject(new Error(`Request "${type}" timed out after 30s`));
    }, 30_000);

    try {
      return await deferred.promise;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Send a one-way notification to the extension host.
   */
  notify<TPayload = unknown>(type: string, payload: TPayload): void {
    const message: MessageEnvelope<string, TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    this.vscode.postMessage(message);
  }

  /**
   * Get persisted webview state.
   */
  getState<T>(): T | undefined {
    return this.vscode.getState<T>();
  }

  /**
   * Persist webview state (survives panel hide/show but not VS Code restart).
   */
  setState<T>(state: T): T {
    return this.vscode.setState(state);
  }

  /**
   * Handle incoming messages from the extension host.
   */
  private async handleMessage(raw: unknown): Promise<void> {
    const message = raw as MessageEnvelope & { direction?: string; error?: ResponseMessage['error'] };
    if (!message?.type) return;

    // If it's a response to a pending request
    if (message.direction === 'response' && message.id) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.payload);
        }
        return;
      }
    }

    // Otherwise treat as a notification
    const handler = this.handlers.get(message.type);
    if (handler) {
      await handler(message.payload);
    }
  }
}
