/**
 * Configuration utilities for VS Code extensions.
 *
 * Provides typed access to extension settings and change listeners.
 */

import * as vscode from 'vscode';

/**
 * Get a typed configuration value.
 *
 * @example
 * ```ts
 * const apiKey = getConfig<string>('myExtension', 'apiKey', '');
 * ```
 */
export function getConfig<T>(section: string, key: string, defaultValue: T): T {
  const config = vscode.workspace.getConfiguration(section);
  return config.get<T>(key, defaultValue);
}

/**
 * Listen for configuration changes on a specific section.
 *
 * @example
 * ```ts
 * const disposable = onConfigChange('myExtension', (e) => {
 *   if (e.affectsConfiguration('myExtension.apiKey')) {
 *     // reload
 *   }
 * });
 * ```
 */
export function onConfigChange(
  section: string,
  handler: (e: vscode.ConfigurationChangeEvent) => void,
): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(section)) {
      handler(e);
    }
  });
}
