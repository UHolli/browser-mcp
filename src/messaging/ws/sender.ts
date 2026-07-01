import type { WebSocket } from "ws";
import WebSocketLib from "ws";

import { MESSAGE_RESPONSE_TYPE } from "@/messaging/types";
import type {
  MessagePayload,
  MessageResult,
  MessageType,
} from "@/types/messages/ws";

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
}

type SendOptions = { timeoutMs?: number };

export function createSocketMessageSender<
  TMap extends Record<string, { payload: unknown; result: unknown }>,
>(ws: WebSocket) {
  async function sendSocketMessage<K extends MessageType<TMap>>(
    type: K,
    payload: MessagePayload<TMap, K>,
    options: SendOptions = { timeoutMs: 30_000 },
  ): Promise<MessageResult<TMap, K>> {
    const { timeoutMs } = options;
    const id = generateId();
    const message = { id, type, payload };

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        ws.off("message", messageHandler);
        ws.off("error", errorHandler);
        ws.off("close", closeHandler);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`WebSocket response timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      const messageHandler = (data: WebSocketLib.RawData) => {
        const raw = typeof data === "string" ? data : data.toString();
        const parsed = JSON.parse(raw) as {
          type: string;
          payload: { requestId: string; result?: unknown; error?: string };
        };

        if (parsed.type !== MESSAGE_RESPONSE_TYPE) {
          return;
        }

        if (parsed.payload.requestId !== id) {
          return;
        }

        const { result, error } = parsed.payload;
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result as MessageResult<TMap, K>);
        }
        cleanup();
      };

      const errorHandler = () => {
        cleanup();
        reject(new Error("WebSocket error occurred"));
      };

      const closeHandler = () => {
        cleanup();
        reject(new Error("WebSocket closed before response"));
      };

      ws.on("message", messageHandler);
      ws.on("error", errorHandler);
      ws.on("close", closeHandler);

      if (ws.readyState === WebSocketLib.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        cleanup();
        reject(new Error("WebSocket is not open"));
      }
    });
  }

  return { sendSocketMessage };
}
