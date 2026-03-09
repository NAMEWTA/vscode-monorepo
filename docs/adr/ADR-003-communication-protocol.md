# ADR-003: Extension ↔ Webview Communication Protocol

## Context

VS Code webviews communicate with the extension host via `postMessage`. We need a typed, reliable protocol that supports:

1. Request/response patterns (webview asks, extension responds)
2. One-way notifications (extension pushes updates)
3. Error handling and timeouts
4. Type safety at compile time

## Decision

Implement a **typed message envelope protocol** with three message kinds:

### Message Envelope

```typescript
interface MessageEnvelope<TType, TPayload> {
  type: TType;        // Discriminant string
  payload: TPayload;  // Typed payload
  id?: string;        // Correlation ID for request/response
  timestamp: number;  // Creation time
}
```

### Communication Patterns

| Pattern | Direction | `id` | `direction` |
|---------|-----------|------|-------------|
| **Request** | webview → extension | required | `'request'` |
| **Response** | extension → webview | matches request | `'response'` |
| **Notification** | either → either | absent | `'notification'` |

### Implementation

- **HostBridge** (Node.js) — wraps `vscode.Webview`, auto-responds to requests
- **ClientBridge** (browser) — singleton, manages pending requests with 30s timeout

## Consequences

### Positive

- Full type safety from extension to webview
- Promise-based `request()` simplifies async workflows
- Automatic timeout prevents stuck UIs
- Error propagation across the bridge

### Negative

- Custom protocol vs. established alternatives (tRPC, JSON-RPC)
- Correlation IDs add minor overhead

## Status

**Accepted**

## Date

2026-03-02
