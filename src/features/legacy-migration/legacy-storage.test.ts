import { describe, expect, it, vi } from "vitest";

import {
  LEGACY_STORAGE_KEY,
  legacyZustandJson,
  malformedLegacyJson,
} from "./__fixtures__/legacy-state";
import {
  LEGACY_SOURCE_KEY,
  inspectLegacyStorage,
  readLegacyRecovery,
  readLegacySource,
} from "./legacy-storage";

function createStorage(values: Record<string, string>): Storage {
  const keys = Object.keys(values);
  return {
    get length() {
      return keys.length;
    },
    clear: vi.fn(),
    getItem: vi.fn((key: string) => values[key] ?? null),
    key: vi.fn((index: number) => keys[index] ?? null),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  };
}

describe("inspectLegacyStorage", () => {
  it("reads only the supported Zustand key and returns valid siblings with explicit rejections", () => {
    const storage = createStorage({
      unrelated: JSON.stringify({ state: { lists: [{ name: "Ignore me" }] } }),
      [LEGACY_STORAGE_KEY]: legacyZustandJson,
    });

    const preview = inspectLegacyStorage(storage);

    expect(preview).not.toBeNull();
    expect(preview).toMatchObject({
      sourceKey: LEGACY_SOURCE_KEY,
      lists: [{ name: "Alpine weekend" }],
      templates: [{ name: "Custom conference" }],
    });
    expect(preview?.rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "state.lists[0].categories[0].items[1]" }),
        expect.objectContaining({ path: "state.lists[1]" }),
        expect.objectContaining({ path: "state.templates[1]" }),
      ]),
    );
    expect(storage.getItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEY);
    expect(storage.getItem).not.toHaveBeenCalledWith("unrelated");
  });

  it("distinguishes a missing source from inaccessible storage", () => {
    expect(readLegacySource(createStorage({ other: "{}" }))).toEqual({
      state: "missing",
    });
    const inaccessible = createStorage({});
    vi.mocked(inaccessible.getItem).mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(readLegacySource(inaccessible)).toEqual({ state: "inaccessible" });
  });

  it("validates supported preferences and explicitly rejects unsupported fields", () => {
    const envelope = JSON.parse(legacyZustandJson) as {
      state: {
        user: {
          preferences: Record<string, unknown>;
        };
      };
    };
    envelope.state.user.preferences.compactMode = true;

    const preview = inspectLegacyStorage(
      createStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(envelope) }),
    );

    expect(preview?.preferences).toEqual({
      theme: "dark",
      defaultPriority: "high",
      autoSave: false,
    });
    expect(preview?.rejected).toContainEqual({
      path: "state.user.preferences.compactMode",
      reason: "Unsupported legacy preference",
      raw: true,
    });
  });

  it("preserves malformed JSON as an individually rejected raw recovery record", () => {
    const storage = createStorage({ [LEGACY_STORAGE_KEY]: malformedLegacyJson });

    const preview = inspectLegacyStorage(storage);

    expect(preview).toMatchObject({
      sourceKey: LEGACY_SOURCE_KEY,
      lists: [],
      templates: [],
      rejected: [
        {
          path: "$",
          reason: expect.stringMatching(/JSON/i),
          raw: malformedLegacyJson,
        },
      ],
    });
    expect(readLegacyRecovery(storage)).toEqual({
      fileName: "pack-list-legacy-recovery-raw.json",
      raw: malformedLegacyJson,
    });
  });

  it("rejects unsupported Zustand envelope versions without discarding the raw recovery", () => {
    const raw = JSON.stringify({ state: { lists: [], templates: [] }, version: 99 });
    const storage = createStorage({ [LEGACY_STORAGE_KEY]: raw });

    expect(inspectLegacyStorage(storage)).toMatchObject({
      lists: [],
      templates: [],
      rejected: [expect.objectContaining({ path: "version", raw: 99 })],
    });
    expect(readLegacyRecovery(storage)?.raw).toBe(raw);
  });

  it("requires manual export before an 8,193-item category reaches Convex validation", () => {
    const raw = JSON.stringify({
      version: 0,
      state: {
        lists: [
          {
            name: "Oversized list",
            categories: [
              {
                name: "Oversized category",
                items: Array.from({ length: 8_193 }, (_, index) => ({
                  name: `Item ${index}`,
                  quantity: 1,
                })),
              },
            ],
          },
        ],
        templates: [],
      },
    });
    const preview = inspectLegacyStorage(
      createStorage({ [LEGACY_STORAGE_KEY]: raw }),
    );

    expect(preview).toMatchObject({
      rawSource: raw,
      manualExportRequired: expect.stringMatching(/manual export/i),
    });
    expect(preview?.rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "state.lists[0].categories[0].items",
          reason: expect.stringMatching(/manual export/i),
        }),
      ]),
    );
  });
});
