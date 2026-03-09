/**
 * Shared React hooks for VS Code webview ↔ extension communication.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientBridge } from '@vscode-monorepo/webview-bridge/client';

/**
 * Hook to access the singleton ClientBridge instance.
 */
export function useBridge(): ClientBridge {
  const bridgeRef = useRef<ClientBridge>(ClientBridge.getInstance());
  return bridgeRef.current;
}

/**
 * Hook to listen for messages from the extension host.
 *
 * @example
 * ```tsx
 * useExtensionMessage('update-data', (payload) => {
 *   setData(payload);
 * });
 * ```
 */
export function useExtensionMessage<TPayload = unknown>(
  type: string,
  handler: (payload: TPayload) => void,
): void {
  const bridge = useBridge();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    bridge.onMessage<TPayload>(type, (payload) => {
      handlerRef.current(payload);
    });
  }, [bridge, type]);
}

/**
 * Hook to send a request to the extension host and manage loading/error state.
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useExtensionRequest<Input, Output>('fetch-data');
 *
 * useEffect(() => { execute({ query: 'hello' }); }, []);
 * ```
 */
export function useExtensionRequest<TPayload = unknown, TResult = unknown>(type: string) {
  const bridge = useBridge();
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (payload: TPayload): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await bridge.request<TPayload, TResult>(type, payload);
        setData(result);
        return result;
      } catch (err) {
        const wrappedError = err instanceof Error ? err : new Error(String(err));
        setError(wrappedError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bridge, type],
  );

  return { data, loading, error, execute };
}
