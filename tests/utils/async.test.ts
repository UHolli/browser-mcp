import { describe, expect, it } from "vitest";

import { wait } from "@/utils/async";

describe("wait", () => {
  it("resolves after the specified delay", async () => {
    const start = Date.now();
    await wait(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});
