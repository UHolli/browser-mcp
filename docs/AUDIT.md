# Repository Audit Summary

> Internal engineering audit of the upstream Browser MCP server (v0.1.3).

## Current Architecture

The server is a **stdio MCP bridge** between AI clients and a Chrome extension:

```
AI Client (stdio) → MCP Server → WebSocket (port 9009) → Chrome Extension → Browser Tab
```

| Layer | Responsibility |
|-------|----------------|
| `index.ts` | CLI entry, tool registration, stdio transport |
| `server.ts` | MCP request handlers (tools/resources) |
| `context.ts` | WebSocket messaging to extension |
| `ws.ts` | WebSocket server lifecycle |
| `tools/*` | Browser automation tool implementations |

**12 TypeScript source files**, ~600 LOC. Fully TypeScript — no JavaScript application code.

## Major Weaknesses

1. **Non-standalone build** — depends on unpublished monorepo packages (`@repo/*`, `@r2r/*`).
2. **No tests** — zero unit or integration test coverage.
3. **No linting** — no ESLint, Prettier, or CI configuration.
4. **Broken shutdown** — `server.close()` infinite recursion bug.
5. **Unauthenticated WebSocket** — any local process can connect and control the browser.
6. **Aggressive port killing** — `kill -9` / `taskkill` on port conflict without validation.
7. **Dead code** — `drag` tool implemented but not registered; unused `debugLog`.
8. **No persistence** — connection state lost on restart; no session recovery.
9. **Minimal configuration** — hardcoded port (9009), no environment variable support.
10. **Sparse documentation** — README cannot guide standalone development.

## Recommended Improvements

1. Extract monorepo dependencies into local modules for standalone builds.
2. Enable strict TypeScript with unused export detection.
3. Add ESLint, Vitest, and CI-ready scripts.
4. Fix shutdown lifecycle and improve error handling.
5. Add structured logging (stderr-only for MCP stdio compatibility).
6. Introduce environment-based configuration.
7. Integrate Redis for session/metadata persistence.
8. Reorganize folder structure for contributor onboarding.
9. Redesign README with architecture diagrams and operational guides.
10. Add unit tests for messaging, config, Redis, and utilities.
