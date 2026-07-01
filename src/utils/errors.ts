import type { ToolResult } from "@/tools/tool";

export function formatToolError(error: unknown): ToolResult {
  const message =
    error instanceof Error ? error.message : `Unexpected error: ${String(error)}`;

  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
