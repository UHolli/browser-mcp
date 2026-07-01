import type { RedisConnectionManager } from "@/persistence/redis/connection-manager";
import type {
  ConnectionMetadata,
  SessionState,
} from "@/persistence/redis/types";
import { logger } from "@/utils/logger";

const SESSION_KEY = "session:state";

export class SessionStore {
  constructor(
    private readonly manager: RedisConnectionManager,
    private readonly ttlSeconds: number,
  ) {}

  private getClient() {
    return this.manager.getClient();
  }

  async getSessionState(): Promise<SessionState | null> {
    if (!this.manager.isReady()) {
      return null;
    }

    const raw = await this.getClient().get(SESSION_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SessionState;
  }

  async recordConnection(metadata: ConnectionMetadata): Promise<void> {
    if (!this.manager.isReady()) {
      return;
    }

    const state: SessionState = {
      status: "connected",
      lastConnectedAt: metadata.connectedAt,
      toolCallCount: 0,
    };

    await this.getClient().setex(
      SESSION_KEY,
      this.ttlSeconds,
      JSON.stringify(state),
    );
    logger.debug("Session connection recorded in Redis");
  }

  async recordDisconnection(): Promise<void> {
    if (!this.manager.isReady()) {
      return;
    }

    const existing = await this.getSessionState();
    const state: SessionState = {
      status: "disconnected",
      lastConnectedAt: existing?.lastConnectedAt,
      lastDisconnectedAt: new Date().toISOString(),
      lastToolCall: existing?.lastToolCall,
      toolCallCount: existing?.toolCallCount ?? 0,
    };

    await this.getClient().setex(
      SESSION_KEY,
      this.ttlSeconds,
      JSON.stringify(state),
    );
    logger.debug("Session disconnection recorded in Redis");
  }

  async recordToolCall(toolName: string): Promise<void> {
    if (!this.manager.isReady()) {
      return;
    }

    const existing = (await this.getSessionState()) ?? {
      status: "connected" as const,
      toolCallCount: 0,
    };

    const state: SessionState = {
      ...existing,
      lastToolCall: toolName,
      toolCallCount: existing.toolCallCount + 1,
    };

    await this.getClient().setex(
      SESSION_KEY,
      this.ttlSeconds,
      JSON.stringify(state),
    );
  }

  async clear(): Promise<void> {
    if (!this.manager.isReady()) {
      return;
    }
    await this.getClient().del(SESSION_KEY);
  }
}

export async function createSessionStore(
  manager: RedisConnectionManager,
  ttlSeconds: number,
): Promise<SessionStore> {
  await manager.connect();
  return new SessionStore(manager, ttlSeconds);
}
