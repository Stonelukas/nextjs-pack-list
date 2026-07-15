import { describe, expect, it } from "vitest";

import type { LegacyImportPreview } from "./schema";

describe("LegacyImportPreview contract", () => {
  it("keeps preview, rejection, and fingerprint fields explicit", () => {
    const preview = {
      sourceKey: "zustand:pack-list-storage:v1",
      rawSource: "raw",
      fingerprint: "fnv1a128:00000000000000000000000000000000",
      lists: [],
      templates: [],
      rejected: [{ path: "$", reason: "invalid", raw: "raw" }],
    } satisfies LegacyImportPreview;

    expect(preview.sourceKey).toBe("zustand:pack-list-storage:v1");
  });
});
