/**
 * Shared reusable components for VS Code webviews.
 */

import React from 'react';
import { VSCodeThemeProvider } from '../theme/index';

interface WebviewAppProps {
  children: React.ReactNode;
}

/**
 * Root wrapper component for all webview applications.
 * Provides VS Code theme integration, Ant Design ConfigProvider, and error boundary.
 *
 * @example
 * ```tsx
 * import { WebviewApp } from '@vscode-monorepo/shared-ui/components';
 *
 * function MyWebview() {
 *   return (
 *     <WebviewApp>
 *       <MyContent />
 *     </WebviewApp>
 *   );
 * }
 * ```
 */
export function WebviewApp({ children }: WebviewAppProps) {
  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(VSCodeThemeProvider, null, children),
  );
}

/* ---------- Error Boundary ---------- */

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        {
          style: {
            padding: 16,
            color: 'var(--vscode-errorForeground, #f14c4c)',
            fontFamily: 'var(--vscode-font-family)',
          },
        },
        React.createElement('h3', null, 'Something went wrong'),
        React.createElement(
          'pre',
          { style: { whiteSpace: 'pre-wrap', fontSize: 12 } },
          this.state.error?.message,
        ),
      );
    }
    return this.props.children;
  }
}
