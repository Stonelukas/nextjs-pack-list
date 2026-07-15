// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { legacyZustandJson, LEGACY_STORAGE_KEY } from "./__fixtures__/legacy-state";

const convexState = vi.hoisted(() => ({
  status: null as
    | null
    | {
        status: "already_imported";
        listsImported: number;
        templatesImported: number;
      },
  mutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: () => convexState.mutation,
  useQuery: () => convexState.status,
}));

import { LEGACY_ARCHIVE_KEY, useLegacyMigration } from "./use-legacy-migration";

function storage(): Storage {
  const values = new Map([[LEGACY_STORAGE_KEY, legacyZustandJson]]);
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(),
    getItem: vi.fn((key) => values.get(key) ?? null),
    key: vi.fn((index) => [...values.keys()][index] ?? null),
    removeItem: vi.fn((key) => values.delete(key)),
    setItem: vi.fn((key, value) => values.set(key, value)),
  };
}

describe("useLegacyMigration", () => {
  beforeEach(() => {
    convexState.status = null;
    convexState.mutation.mockReset();
  });

  it("keeps confirmed server success when the archive marker cannot be written", async () => {
    const source = storage();
    vi.mocked(source.setItem).mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    convexState.mutation.mockResolvedValue({
      status: "imported",
      listsImported: 1,
      templatesImported: 1,
    });

    const { result } = renderHook(() => useLegacyMigration(source));
    await act(() => result.current.importLegacyData());

    await waitFor(() => expect(result.current.result?.status).toBe("imported"));
    expect(convexState.mutation).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: {
          theme: "dark",
          defaultPriority: "high",
          autoSave: false,
        },
      }),
    );
    expect(source.removeItem).not.toHaveBeenCalled();
    expect(source.setItem).toHaveBeenCalledWith(LEGACY_ARCHIVE_KEY, expect.any(String));
  });

  it("rescans and refuses import when the source changed after preview", async () => {
    const source = storage();
    const changedEnvelope = JSON.parse(legacyZustandJson) as {
      state: { lists: Array<{ name: string }> };
    };
    changedEnvelope.state.lists[0].name = "Changed in another tab";
    const changedRaw = JSON.stringify(changedEnvelope);
    const { result } = renderHook(() => useLegacyMigration(source));

    act(() => source.setItem(LEGACY_STORAGE_KEY, changedRaw));
    await act(() => result.current.importLegacyData());

    expect(convexState.mutation).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.preview?.rawSource).toBe(changedRaw);
      expect(result.current.preview?.lists[0]?.name).toBe("Changed in another tab");
      expect(result.current.error).toMatchObject({
        code: "VALIDATION",
        retryable: false,
        message: expect.stringMatching(/source changed/i),
      });
    });
  });

  it("suppresses an old matching server status until the refreshed source is acknowledged", async () => {
    const source = storage();
    const equivalentRaw = JSON.stringify(JSON.parse(legacyZustandJson), null, 2);
    const { result, rerender } = renderHook(() => useLegacyMigration(source));

    act(() => source.setItem(LEGACY_STORAGE_KEY, equivalentRaw));
    await act(() => result.current.importLegacyData());
    convexState.status = {
      status: "already_imported",
      listsImported: 1,
      templatesImported: 1,
    };
    rerender();

    expect(result.current.sourceChanged).toBe(true);
    expect(result.current.result).toBeNull();
    expect(convexState.mutation).not.toHaveBeenCalled();

    act(() => result.current.acknowledgeSourceChange());
    rerender();
    expect(result.current.sourceChanged).toBe(false);
    expect(result.current.result?.status).toBe("already_imported");
  });

  it("preserves the cached preview and recovery when the source key disappears", async () => {
    const source = storage();
    const { result } = renderHook(() => useLegacyMigration(source));
    const originalRaw = result.current.preview?.rawSource;

    act(() => source.removeItem(LEGACY_STORAGE_KEY));
    await act(() => result.current.importLegacyData());

    expect(convexState.mutation).not.toHaveBeenCalled();
    expect(result.current.preview?.rawSource).toBe(originalRaw);
    expect(result.current.recovery?.raw).toBe(originalRaw);
    expect(result.current.sourceReadState).toBe("missing");
    expect(result.current.sourceChanged).toBe(true);
  });

  it("preserves the cached preview and recovery when storage access is denied", async () => {
    const source = storage();
    const { result } = renderHook(() => useLegacyMigration(source));
    const originalRaw = result.current.preview?.rawSource;
    vi.mocked(source.getItem).mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    await act(() => result.current.importLegacyData());

    expect(convexState.mutation).not.toHaveBeenCalled();
    expect(result.current.preview?.rawSource).toBe(originalRaw);
    expect(result.current.recovery?.raw).toBe(originalRaw);
    expect(result.current.sourceReadState).toBe("inaccessible");
    expect(result.current.sourceChanged).toBe(true);
  });

  it("rescans and refuses cleanup when the source changed after persistence", async () => {
    const source = storage();
    convexState.mutation.mockResolvedValue({
      status: "imported",
      listsImported: 1,
      templatesImported: 1,
    });
    const { result } = renderHook(() => useLegacyMigration(source));
    await act(() => result.current.importLegacyData());
    await waitFor(() => expect(result.current.result?.status).toBe("imported"));

    const changedEnvelope = JSON.parse(legacyZustandJson) as {
      state: { lists: Array<{ name: string }> };
    };
    changedEnvelope.state.lists[0].name = "Newer browser data";
    const changedRaw = JSON.stringify(changedEnvelope);
    act(() => source.setItem(LEGACY_STORAGE_KEY, changedRaw));

    let removed = true;
    act(() => {
      removed = result.current.removeSource();
    });

    expect(removed).toBe(false);
    expect(source.removeItem).not.toHaveBeenCalled();
    expect(result.current.cleanupError).toMatch(/source changed/i);
    expect(result.current.result).toBeNull();
    expect(result.current.preview?.rawSource).toBe(changedRaw);
  });
});
