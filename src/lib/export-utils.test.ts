import { describe, expect, it } from "vitest";

import { escapeCsvCell, importFromJSON } from "./export-utils";

describe("packing-list CSV export", () => {
  it.each([
    ["=HYPERLINK(\"https://evil.example\")", '"\'=HYPERLINK(""https://evil.example"")"'],
    [" +SUM(1,1)", '"\' +SUM(1,1)"'],
    ["\t@cmd", "'\t@cmd"],
    ["\0-2+3", "'\0-2+3"],
    ["Medication", "Medication"],
  ])("neutralizes formula-like cell %j before CSV quoting", (input, expected) => {
    expect(escapeCsvCell(input)).toBe(expected);
  });
});

describe("packing-list JSON import", () => {
  it("rejects malformed nested values before an import can write", () => {
    expect(() =>
      importFromJSON(
        JSON.stringify({
          list: { name: "Broken" },
          categories: [
            {
              name: "Documents",
              items: [{ name: "Passport", quantity: 0, priority: "urgent" }],
            },
          ],
        }),
      ),
    ).toThrow(/quantity|priority|invalid/i);
  });

  it("preserves exported item details for the Convex import adapter", () => {
    const imported = importFromJSON(
      JSON.stringify({
        version: 1,
        list: {
          name: "Conference",
          description: "Work travel",
          tags: ["work"],
        },
        categories: [
          {
            name: "Documents",
            items: [
              {
                name: "Passport",
                quantity: 1,
                priority: "essential",
                packed: true,
                description: "Keep accessible",
                notes: "Front pocket",
                weight: 0.2,
                tags: ["documents"],
              },
            ],
          },
        ],
      }),
    );

    expect(imported.categories[0]?.items[0]).toEqual({
      name: "Passport",
      quantity: 1,
      priority: "essential",
      packed: true,
      description: "Keep accessible",
      notes: "Front pocket",
      weight: 0.2,
      tags: ["documents"],
    });
  });

  it("rejects imports above the shared category and item limits", () => {
    const oversized = {
      version: 1,
      list: { name: "Oversized" },
      categories: Array.from({ length: 6 }, (_, categoryIndex) => ({
        name: `Category ${categoryIndex}`,
        items: Array.from({ length: 200 }, (_, itemIndex) => ({
          name: `Item ${categoryIndex}-${itemIndex}`,
          quantity: 1,
          priority: "medium",
        })),
      })),
    };

    expect(() => importFromJSON(JSON.stringify(oversized))).toThrow(
      /items|large|limit/i,
    );
  });

  it("rejects import files above the shared byte limit before parsing", () => {
    const oversized = JSON.stringify({
      version: 1,
      list: { name: "Oversized", description: "x".repeat(1_100_000) },
      categories: [],
    });

    expect(() => importFromJSON(oversized)).toThrow(/file|byte|large|limit/i);
  });
});
