/**
 * Extension host side of the webview bridge.
 *
 * Wraps a vscode.Webview instance and provides typed message sending/receiving.
 * Used inside the VS Code extension (Node.js context).
 */

import type {
  MessageEnvelope,
  MessageHandler,
  ResponseMessage,
} from '@vscode-monorepo/shared-types/message';
import { generateId } from '@vscode-monorepo/shared-utils';

/** Minimal Webview interface to avoid importing the full vscode module */
interface WebviewLike {
  postMessage(message: unknown): Thenable<boolean>;
  onDidReceiveMessage(listener: (message: unknown) => void): { dispose(): void };
}

export class HostBridge {
  private readonly handlers = new Map<string, MessageHandler>();
  private readonly disposables: Array<{ dispose(): void }> = [];

  constructor(private readonly webview: WebviewLike) {
    const disposable = this.webview.onDidReceiveMessage(
      (raw: unknown) => void this.handleMessage(raw),
    );
    this.disposables.push(disposable);
  }

  /**
   * Register a handler for a specific message type.
   */
  onMessage<TPayload = unknown, TResult = unknown>(
    type: string,
    handler: MessageHandler<TPayload, TResult>,
  ): this {
    this.handlers.set(type, handler as MessageHandler);
    return this;
  }

  /**
   * Send a notification to the webview (fire-and-forget).
   */
  notify<TPayload = unknown>(type: string, payload: TPayload): void {
    const message: MessageEnvelope<string, TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    void this.webview.postMessage(message);
  }

  /**
   * Process incoming message from webview.
   */
  private async handleMessage(raw: unknown): Promise<void> {
    const message = raw as MessageEnvelope;
    if (!message?.type) return;

    const handler = this.handlers.get(message.type);
    if (!handler) return;

    try {
      const result = await handler(message.payload);

      if (message.id) {
        const response: ResponseMessage = {
          type: message.type,
          payload: result,
          id: message.id,
          direction: 'response',
          timestamp: Date.now(),
        };
        void this.webview.postMessage(response);
      }
    } catch (error) {
      if (message.id) {
        const errorResponse: ResponseMessage = {
          type: message.type,
          payload: null,
          id: message.id,
          direction: 'response',
          timestamp: Date.now(),
          error: {
            code: 'HANDLER_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        };
        void this.webview.postMessage(errorResponse);
      }
    }
  }

  /**
   * Clean up all listeners.
   */
  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
    this.handlers.clear();
  }
}

// Re-export generateId for convenience
export { generateId };
