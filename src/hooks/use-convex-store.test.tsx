// @vitest-environment node

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Task 6 compatibility facade removal", () => {
  it("removes the legacy use-convex-store implementation after consumers migrate", () => {
    const facadePath = fileURLToPath(new URL("./use-convex-store.ts", import.meta.url));
    expect(existsSync(facadePath)).toBe(false);
  });
});
