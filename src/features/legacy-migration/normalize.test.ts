import { describe, expect, it } from "vitest";

import { legacyZustandEnvelope } from "./__fixtures__/legacy-state";
import {
  fingerprintLegacyData,
  normalizeLegacyList,
  normalizeLegacyTemplate,
} from "./normalize";

const rejected: Array<{ path: string; reason: string; raw: unknown }> = [];

function collectRejection(path: string, reason: string, raw: unknown) {
  rejected.push({ path, reason, raw });
}

describe("legacy normalization", () => {
  it("normalizes historical dates, priorities, optional fields, categories, and items", () => {
    rejected.length = 0;
    const normalized = normalizeLegacyList(
      legacyZustandEnvelope.state.lists[0],
      "state.lists[0]",
      collectRejection,
    );

    expect(normalized).toMatchObject({
      name: "Alpine weekend",
      description: "Cold-weather trip",
      tags: ["mountains", "winter"],
      completedAt: Date.parse("2024-01-02T03:04:05.000Z"),
      createdAt: Date.parse("2020-01-02T03:04:05.000Z"),
      updatedAt: 1_704_164_645_000,
      categories: [
        {
          name: "Clothing",
          color: "#334455",
          icon: "shirt",
          order: 4,
          collapsed: true,
          items: [
            {
              name: "Wool socks",
              quantity: 3,
              packed: true,
              priority: "high",
              notes: "Two hiking pairs",
              description: "Warm merino socks",
              weight: 0.2,
              tags: ["warm", "feet"],
              order: 0,
            },
          ],
        },
      ],
    });
    expect(rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "state.lists[0].tags[2]",
          reason: expect.stringMatching(/tag/i),
        }),
        expect.objectContaining({
          path: "state.lists[0].categories[0].items[1]",
          reason: expect.stringMatching(/name/i),
        }),
      ]),
    );
  });

  it("normalizes a custom template without carrying packed state or legacy ownership", () => {
    rejected.length = 0;
    const normalized = normalizeLegacyTemplate(
      legacyZustandEnvelope.state.templates[0],
      "state.templates[0]",
      collectRejection,
    );

    expect(normalized).toMatchObject({
      name: "Custom conference",
      description: "A personal event template",
      isPublic: false,
      usageCount: 2,
      icon: "briefcase-business",
      duration: "3 days",
      difficulty: "intermediate",
      season: "all",
      categories: [
        {
          name: "Work",
          order: 0,
          items: [
            {
              name: "Laptop",
              quantity: 1,
              packed: false,
              priority: "essential",
            },
          ],
        },
      ],
    });
    expect(normalized).not.toHaveProperty("createdBy");
    expect(rejected).toEqual([]);
  });

  it("rejects overlong required names and safely removes overlong optional text and tags", () => {
    rejected.length = 0;
    const validList = structuredClone(legacyZustandEnvelope.state.lists[0]);
    const invalidList = {
      ...structuredClone(validList),
      name: "L".repeat(201),
    };
    const listWithMixedItems = {
      ...structuredClone(validList),
      name: "Mixed items",
      description: "D".repeat(5_001),
      tags: [
        ...Array.from({ length: 50 }, (_, index) => `tag-${index}`),
        "extra-tag",
        "T".repeat(101),
      ],
      categories: [
        {
          name: "Equipment",
          items: [
            { name: "I".repeat(201), quantity: 1 },
            { name: "Valid sibling", quantity: 1, notes: "N".repeat(5_001) },
          ],
        },
      ],
    };
    const invalidTemplate = {
      ...structuredClone(legacyZustandEnvelope.state.templates[0]),
      name: "T".repeat(201),
    };

    expect(
      normalizeLegacyList(invalidList, "state.lists[1]", collectRejection),
    ).toBeNull();
    expect(
      normalizeLegacyTemplate(
        invalidTemplate,
        "state.templates[1]",
        collectRejection,
      ),
    ).toBeNull();
    const normalized = normalizeLegacyList(
      listWithMixedItems,
      "state.lists[2]",
      collectRejection,
    );

    expect(normalized).toMatchObject({
      name: "Mixed items",
      tags: expect.arrayContaining(["tag-0", "tag-49"]),
      categories: [
        {
          items: [
            {
              name: "Valid sibling",
              notes: undefined,
            },
          ],
        },
      ],
    });
    expect(normalized?.tags).toHaveLength(50);
    expect(normalized?.description).toBeUndefined();
    expect(rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "state.lists[1]", raw: invalidList }),
        expect.objectContaining({ path: "state.templates[1]", raw: invalidTemplate }),
        expect.objectContaining({
          path: "state.lists[2].categories[0].items[0]",
        }),
        expect.objectContaining({ path: "state.lists[2].description" }),
        expect.objectContaining({ path: "state.lists[2].tags[50]" }),
        expect.objectContaining({ path: "state.lists[2].tags[51]" }),
        expect.objectContaining({
          path: "state.lists[2].categories[0].items[1].notes",
        }),
      ]),
    );
  });

  it("fingerprints equivalent normalized data deterministically", () => {
    rejected.length = 0;
    const first = normalizeLegacyList(
      legacyZustandEnvelope.state.lists[0],
      "state.lists[0]",
      collectRejection,
    )!;
    const equivalentRaw = structuredClone(legacyZustandEnvelope.state.lists[0]) as Record<string, unknown>;
    equivalentRaw.createdAt = Date.parse("2020-01-02T03:04:05.000Z");
    equivalentRaw.name = "Alpine weekend";
    const second = normalizeLegacyList(
      equivalentRaw,
      "state.lists[0]",
      collectRejection,
    )!;

    expect(fingerprintLegacyData({ lists: [first], templates: [] })).toBe(
      fingerprintLegacyData({ lists: [second], templates: [] }),
    );
    expect(fingerprintLegacyData({ lists: [first], templates: [] })).toMatch(
      /^fnv1a128:[0-9a-f]{32}$/,
    );
  });
});
