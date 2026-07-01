export type RedisConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db: number;
  keyPrefix: string;
  connectTimeout: number;
  maxRetries: number;
  sessionTtlSeconds: number;
}

export interface ConnectionMetadata {
  connectedAt: string;
  wsPort: number;
}

export interface SessionState {
  status: "connected" | "disconnected";
  lastConnectedAt?: string | undefined;
  lastDisconnectedAt?: string | undefined;
  lastToolCall?: string | undefined;
  toolCallCount: number;
}
