import { describe, expect, it, beforeEach } from "vitest";

import { loadEnv, resetEnvCache } from "@/config/env";
import { getRedisConfig, getWsPort, isRedisEnabled } from "@/config/index";

describe("env configuration", () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it("loads defaults when env vars are absent", () => {
    loadEnv({});
    expect(getWsPort()).toBe(9009);
    expect(isRedisEnabled()).toBe(false);
  });

  it("parses custom WS port", () => {
    loadEnv({ WS_PORT: "9100" });
    expect(getWsPort()).toBe(9100);
  });

  it("enables Redis when REDIS_ENABLED is true", () => {
    loadEnv({ REDIS_ENABLED: "true" });
    expect(isRedisEnabled()).toBe(true);
  });

  it("returns Redis config from environment", () => {
    loadEnv({
      REDIS_ENABLED: "true",
      REDIS_HOST: "redis.local",
      REDIS_PORT: "6380",
      REDIS_DB: "2",
      REDIS_KEY_PREFIX: "test:",
    });

    const config = getRedisConfig();
    expect(config.host).toBe("redis.local");
    expect(config.port).toBe(6380);
    expect(config.db).toBe(2);
    expect(config.keyPrefix).toBe("test:");
  });
});
