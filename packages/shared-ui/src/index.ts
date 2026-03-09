/**
 * @module @vscode-monorepo/shared-ui
 *
 * Shared React UI layer for VS Code webviews.
 * Provides Ant Design theme integration, reusable components, and hooks.
 */

export { VSCodeThemeProvider, useVSCodeTheme } from './theme/index';
export { WebviewApp } from './components/index';
export { useBridge, useExtensionMessage, useExtensionRequest } from './hooks/index';
