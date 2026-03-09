# ADR-002: VS Code Webview Tech Stack — React 19 + Ant Design 6.x

## Context

VS Code webviews run inside sandboxed iframes. We need a UI framework that:

1. Produces small, efficient bundles
2. Supports theming to match VS Code's appearance
3. Provides a rich component library for rapid feature development
4. Works within CSP (Content Security Policy) restrictions

## Decision

Adopt **React 19** + **Ant Design 6.x** as the webview rendering stack, with a custom theme bridge that maps VS Code CSS custom properties to Ant Design design tokens.

### Key Architecture Decisions

1. **CSS-in-JS (Ant Design 6.x)** — No external CSS imports needed, compatible with CSP `style-src 'unsafe-inline'`
2. **VSCodeThemeProvider** — MutationObserver detects VS Code theme changes and re-maps Ant Design tokens in real-time
3. **esbuild for bundling** — IIFE format for the webview, produces a single JS file loaded via `<script>` tag
4. **ClientBridge singleton** — Matches VS Code's constraint of one `acquireVsCodeApi()` call per webview

## Consequences

### Positive

- Ant Design provides 60+ production-ready components
- CSS-in-JS avoids CSP issues with external stylesheets
- Theme bridge provides automatic light/dark/high-contrast adaptation
- React 19 concurrent features improve perceived performance

### Negative

- Bundle size (~200-400KB gzipped for Ant Design) — mitigated by tree-shaking
- `'unsafe-inline'` required in CSP for CSS-in-JS
- Ant Design 6.x API may have breaking changes from 5.x

## Status

**Accepted**

## Date

2026-03-02
