/**
 * Extension-side type definitions.
 * Used by the VS Code extension host layer.
 */

/** Extension configuration schema */
export interface ExtensionConfig<T = Record<string, unknown>> {
  /** Extension identifier (publisher.name) */
  extensionId: string;
  /** Configuration section name */
  section: string;
  /** Default configuration values */
  defaults: T;
}

/** Simplified extension context for dependency injection */
export interface ExtensionContext {
  /** Extension storage URI */
  storageUri: string | undefined;
  /** Global storage URI */
  globalStorageUri: string;
  /** Extension URI */
  extensionUri: string;
  /** Extension mode: production, development, test */
  extensionMode: 'production' | 'development' | 'test';
}

/** Command definition for registration */
export interface CommandDefinition {
  /** Full command ID (e.g., 'myExtension.myCommand') */
  id: string;
  /** Human-readable title */
  title: string;
  /** Command category for grouping */
  category?: string;
  /** Handler function */
  handler: (...args: unknown[]) => unknown | Promise<unknown>;
}
