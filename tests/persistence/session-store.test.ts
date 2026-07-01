import { describe, expect, it, vi, beforeEach } from "vitest";

import type { RedisConnectionManager } from "@/persistence/redis/connection-manager";
import { SessionStore } from "@/persistence/redis/session-store";

function createMockManager(isReady = true) {
  const store = new Map<string, string>();
  const client = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
  };

  const manager = {
    isReady: vi.fn(() => isReady),
    getClient: vi.fn(() => client),
  } as unknown as RedisConnectionManager;

  return { manager, client, store };
}

describe("SessionStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records connection state", async () => {
    const { manager, store } = createMockManager();
    const sessionStore = new SessionStore(manager, 3600);

    await sessionStore.recordConnection({
      connectedAt: "2026-01-01T00:00:00.000Z",
      wsPort: 9009,
    });

    const raw = store.get("session:state");
    expect(raw).toBeDefined();
    const state = JSON.parse(raw!);
    expect(state.status).toBe("connected");
    expect(state.toolCallCount).toBe(0);
  });

  it("increments tool call count", async () => {
    const { manager } = createMockManager();
    const sessionStore = new SessionStore(manager, 3600);

    await sessionStore.recordConnection({
      connectedAt: "2026-01-01T00:00:00.000Z",
      wsPort: 9009,
    });
    await sessionStore.recordToolCall("browser_navigate");

    const state = await sessionStore.getSessionState();
    expect(state?.toolCallCount).toBe(1);
    expect(state?.lastToolCall).toBe("browser_navigate");
  });

  it("skips writes when Redis is not ready", async () => {
    const { manager, client } = createMockManager(false);
    const sessionStore = new SessionStore(manager, 3600);

    await sessionStore.recordConnection({
      connectedAt: "2026-01-01T00:00:00.000Z",
      wsPort: 9009,
    });

    expect(client.setex).not.toHaveBeenCalled();
  });
});
