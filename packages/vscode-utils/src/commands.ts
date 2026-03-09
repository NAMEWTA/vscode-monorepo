/**
 * Command registration utilities.
 *
 * Simplifies registering multiple commands with automatic disposable management.
 */

import * as vscode from 'vscode';
import type { CommandDefinition } from '@vscode-monorepo/shared-types';

/**
 * Register a single command and return its disposable.
 */
export function registerCommand(
  command: CommandDefinition,
): vscode.Disposable {
  return vscode.commands.registerCommand(command.id, command.handler);
}

/**
 * Register multiple commands at once and push disposables to the context.
 *
 * @example
 * ```ts
 * registerCommands(context, [
 *   { id: 'myExt.hello', title: 'Hello', handler: () => vscode.window.showInformationMessage('Hello!') },
 *   { id: 'myExt.bye', title: 'Bye', handler: () => vscode.window.showInformationMessage('Bye!') },
 * ]);
 * ```
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  commands: CommandDefinition[],
): void {
  for (const cmd of commands) {
    context.subscriptions.push(registerCommand(cmd));
  }
}
