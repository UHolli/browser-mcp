import { describe, expect, it } from "vitest";

import { AppError, formatToolError } from "@/utils/errors";

describe("formatToolError", () => {
  it("formats Error instances", () => {
    const result = formatToolError(new Error("Connection lost"));
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe("Connection lost");
  });

  it("formats unknown values", () => {
    const result = formatToolError(42);
    expect(result.content[0]?.text).toBe("Unexpected error: 42");
  });
});

describe("AppError", () => {
  it("stores error code", () => {
    const error = new AppError("Failed", "REDIS_UNAVAILABLE");
    expect(error.code).toBe("REDIS_UNAVAILABLE");
    expect(error.message).toBe("Failed");
  });
});
