/**
 * VS Code ↔ Ant Design theme bridge.
 *
 * Reads VS Code CSS custom properties from the webview document
 * and maps them to Ant Design design tokens via ConfigProvider.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import type { WebviewTheme } from '@vscode-monorepo/shared-types';

interface VSCodeThemeContextValue {
  /** Current VS Code color theme kind */
  themeKind: WebviewTheme;
  /** Whether the current theme is dark */
  isDark: boolean;
}

const VSCodeThemeContext = createContext<VSCodeThemeContextValue>({
  themeKind: 'dark',
  isDark: true,
});

/**
 * Read a CSS custom property from the document body.
 */
function getCSSVar(name: string, fallback = ''): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}

/**
 * Detect the VS Code theme kind from the document body class/data attributes.
 */
function detectThemeKind(): WebviewTheme {
  const body = document.body;
  const vscodeTheme = body.getAttribute('data-vscode-theme-kind') ?? '';

  if (vscodeTheme.includes('high-contrast-light')) return 'high-contrast-light';
  if (vscodeTheme.includes('high-contrast')) return 'high-contrast';
  if (vscodeTheme.includes('light')) return 'light';
  return 'dark';
}

/**
 * Build an Ant Design ThemeConfig from VS Code CSS custom properties.
 */
function buildAntdTheme(themeKind: WebviewTheme): ThemeConfig {
  const isDark = themeKind === 'dark' || themeKind === 'high-contrast';

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Map VS Code CSS variables → Ant Design design tokens
      colorPrimary: getCSSVar('--vscode-button-background', isDark ? '#0078d4' : '#007acc'),
      colorBgContainer: getCSSVar('--vscode-editor-background', isDark ? '#1e1e1e' : '#ffffff'),
      colorBgElevated: getCSSVar(
        '--vscode-editorWidget-background',
        isDark ? '#252526' : '#f3f3f3',
      ),
      colorText: getCSSVar('--vscode-foreground', isDark ? '#cccccc' : '#333333'),
      colorTextSecondary: getCSSVar(
        '--vscode-descriptionForeground',
        isDark ? '#9d9d9d' : '#717171',
      ),
      colorBorder: getCSSVar('--vscode-widget-border', isDark ? '#454545' : '#c8c8c8'),
      colorError: getCSSVar('--vscode-errorForeground', '#f14c4c'),
      colorWarning: getCSSVar('--vscode-editorWarning-foreground', '#cca700'),
      colorSuccess: getCSSVar('--vscode-testing-iconPassed', '#73c991'),
      colorLink: getCSSVar('--vscode-textLink-foreground', '#3794ff'),
      fontFamily: getCSSVar(
        '--vscode-font-family',
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ),
      fontSize: parseInt(getCSSVar('--vscode-font-size', '13'), 10),
      borderRadius: 4,
    },
    components: {
      Button: {
        colorPrimary: getCSSVar('--vscode-button-background', '#0078d4'),
        colorPrimaryHover: getCSSVar('--vscode-button-hoverBackground', '#026ec1'),
        colorText: getCSSVar('--vscode-button-foreground', '#ffffff'),
      },
      Input: {
        colorBgContainer: getCSSVar('--vscode-input-background', isDark ? '#3c3c3c' : '#ffffff'),
        colorBorder: getCSSVar('--vscode-input-border', isDark ? '#3c3c3c' : '#cecece'),
        colorText: getCSSVar('--vscode-input-foreground', isDark ? '#cccccc' : '#333333'),
      },
      Select: {
        colorBgContainer: getCSSVar(
          '--vscode-dropdown-background',
          isDark ? '#3c3c3c' : '#ffffff',
        ),
        colorBorder: getCSSVar('--vscode-dropdown-border', isDark ? '#3c3c3c' : '#cecece'),
      },
    },
  };
}

interface VSCodeThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider that bridges VS Code theme → Ant Design.
 * Wrap your webview root component with this provider.
 *
 * @example
 * ```tsx
 * <VSCodeThemeProvider>
 *   <App />
 * </VSCodeThemeProvider>
 * ```
 */
export function VSCodeThemeProvider({ children }: VSCodeThemeProviderProps) {
  const [themeKind, setThemeKind] = useState<WebviewTheme>(detectThemeKind);

  useEffect(() => {
    // Watch for VS Code theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      setThemeKind(detectThemeKind());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-vscode-theme-kind', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  const antdThemeConfig = useMemo(() => buildAntdTheme(themeKind), [themeKind]);

  const contextValue = useMemo<VSCodeThemeContextValue>(
    () => ({
      themeKind,
      isDark: themeKind === 'dark' || themeKind === 'high-contrast',
    }),
    [themeKind],
  );

  return React.createElement(
    VSCodeThemeContext.Provider,
    { value: contextValue },
    React.createElement(ConfigProvider, { theme: antdThemeConfig }, children),
  );
}

/**
 * Hook to access VS Code theme information.
 */
export function useVSCodeTheme(): VSCodeThemeContextValue {
  return useContext(VSCodeThemeContext);
}
