import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function createTestBackend() {
  return convexTest(schema, modules);
}

describe("current-user preference validation", () => {
  it("rejects unsupported theme and priority values", async () => {
    const t = createTestBackend();
    await t.run((ctx) =>
      ctx.db.insert("users", {
        clerkId: "preference-user",
        name: "Preference User",
      }),
    );
    const invalidPreferences = {
      theme: "sepia",
      defaultPriority: "urgent",
      autoSave: true,
    } as unknown as {
      theme: "light" | "dark" | "system";
      defaultPriority: "low" | "medium" | "high" | "essential";
      autoSave: boolean;
    };

    await expect(
      t.withIdentity({ subject: "preference-user" }).mutation(
        api.users.updateCurrentUserPreferences,
        { preferences: invalidPreferences },
      ),
    ).rejects.toThrow();
  });
});
