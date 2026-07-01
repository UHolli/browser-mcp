import { getRedisConfig, isRedisEnabled } from "@/config/index";
import {
  createRedisConnectionManager,
  type RedisConnectionManager,
} from "@/persistence/redis/connection-manager";
import {
  createSessionStore,
  type SessionStore,
} from "@/persistence/redis/session-store";
import { logger } from "@/utils/logger";

export type PersistenceLayer = {
  sessionStore: SessionStore | undefined;
  redisManager: RedisConnectionManager | undefined;
  shutdown: () => Promise<void>;
};

export async function initializePersistence(): Promise<PersistenceLayer> {
  if (!isRedisEnabled()) {
    logger.info("Redis persistence disabled");
    return {
      sessionStore: undefined,
      redisManager: undefined,
      shutdown: async () => {},
    };
  }

  const config = getRedisConfig();
  const redisManager = createRedisConnectionManager(config);

  try {
    const sessionStore = await createSessionStore(
      redisManager,
      config.sessionTtlSeconds,
    );
    logger.info(
      `Redis persistence enabled (${config.host}:${config.port}, db=${config.db})`,
    );

    return {
      sessionStore,
      redisManager,
      shutdown: async () => {
        await redisManager.shutdown();
      },
    };
  } catch (error) {
    logger.error("Failed to initialize Redis persistence", error);
    await redisManager.shutdown();
    return {
      sessionStore: undefined,
      redisManager: undefined,
      shutdown: async () => {},
    };
  }
}

export function registerShutdownHandlers(
  persistence: PersistenceLayer,
): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    await persistence.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
