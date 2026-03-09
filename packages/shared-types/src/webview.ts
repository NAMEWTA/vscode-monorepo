/**
 * Webview-related type definitions.
 * Used by both the extension host and webview React code.
 */

/** Serializable state passed to/from webviews */
export interface WebviewState<T = unknown> {
  /** Unique identifier for the webview panel */
  panelId: string;
  /** Current state data */
  data: T;
  /** Timestamp of last state change */
  updatedAt: number;
}

/** VS Code theme kind mapped for use in webview */
export type WebviewTheme = 'light' | 'dark' | 'high-contrast' | 'high-contrast-light';

/** Configuration for creating a webview panel */
export interface WebviewPanelConfig {
  /** Unique view type identifier */
  viewType: string;
  /** Display title */
  title: string;
  /** Whether to retain context when hidden */
  retainContextWhenHidden?: boolean;
  /** Enable scripts in the webview */
  enableScripts?: boolean;
  /** Local resource roots */
  localResourceRoots?: string[];
  /** Column to show the panel in */
  column?: 'active' | 'beside' | 'one' | 'two' | 'three';
}
