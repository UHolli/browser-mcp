import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Context } from "@/context";
import type { SessionStore } from "@/persistence/redis/session-store";
import type { Resource } from "@/resources/resource";
import type { Tool } from "@/tools/tool";
import { formatToolError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { closeWebSocketServer, createWebSocketServer } from "@/ws";

export type ServerOptions = {
  name: string;
  version: string;
  tools: Tool[];
  resources: Resource[];
  wsPort: number;
  sessionStore?: SessionStore | undefined;
};

export async function createServerWithTools(
  options: ServerOptions,
): Promise<Server> {
  const { name, version, tools, resources, wsPort, sessionStore } = options;
  const context = new Context();
  const server = new Server(
    { name, version },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  const wss = await createWebSocketServer(wsPort);

  wss.on("connection", (websocket) => {
    if (context.hasWs()) {
      logger.info("Replacing existing browser extension connection");
      context.ws.close();
    }
    context.ws = websocket;
    logger.info("Browser extension connected");

    void sessionStore?.recordConnection({
      connectedAt: new Date().toISOString(),
      wsPort,
    });

    websocket.on("close", () => {
      logger.info("Browser extension disconnected");
      void sessionStore?.recordDisconnection();
    });
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => tool.schema),
  }));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map((resource) => resource.schema),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.schema.name === request.params.name);
    if (!tool) {
      return {
        content: [
          { type: "text", text: `Tool "${request.params.name}" not found` },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.handle(context, request.params.arguments);
      void sessionStore?.recordToolCall(request.params.name);
      return result;
    } catch (error) {
      logger.error(`Tool "${request.params.name}" failed`, error);
      return formatToolError(error);
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resources.find(
      (r) => r.schema.uri === request.params.uri,
    );
    if (!resource) {
      return { contents: [] };
    }

    const contents = await resource.read(context, request.params.uri);
    return { contents };
  });

  const baseClose = server.close.bind(server);
  server.close = async () => {
    logger.info("Shutting down MCP server");
    await closeWebSocketServer(wss);
    await context.close();
    await baseClose();
  };

  return server;
}
