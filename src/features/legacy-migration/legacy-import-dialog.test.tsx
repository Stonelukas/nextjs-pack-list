// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LEGACY_STORAGE_KEY,
  legacyZustandJson,
  malformedLegacyJson,
} from "./__fixtures__/legacy-state";
import { LEGACY_ARCHIVE_KEY } from "./use-legacy-migration";

const convexState = vi.hoisted(() => ({
  status: null as
    | null
    | {
        status: "already_imported";
        listsImported: number;
        templatesImported: number;
      },
  importLegacyData: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: () => convexState.importLegacyData,
  useQuery: (_reference: unknown, args: unknown) =>
    args === "skip" ? undefined : convexState.status,
}));

import { LegacyImportDialog } from "./legacy-import-dialog";

function createStorage(raw: string | null): Storage {
  const values = new Map<string, string>();
  if (raw !== null) values.set(LEGACY_STORAGE_KEY, raw);
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

let exportedBlob: Blob | undefined;

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  convexState.status = null;
  convexState.importLegacyData.mockReset();
  convexState.importLegacyData.mockResolvedValue({
    status: "imported",
    listsImported: 1,
    templatesImported: 1,
  });
  exportedBlob = undefined;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn((blob: Blob) => {
      exportedBlob = blob;
      return "blob:legacy";
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LegacyImportDialog", () => {
  it("previews valid and rejected records, requires confirmation, and deletes source only after success", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    render(<LegacyImportDialog storage={storage} />);

    expect(screen.getByText(/1 list and 1 template can be imported/i)).toBeInTheDocument();
    expect(screen.getByText(/preferences.*will also be imported/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    expect(screen.getByText(/4 rejected records/i)).toBeInTheDocument();
    expect(screen.getByText(/state\.lists\[1\]/i)).toBeInTheDocument();
    const importButton = screen.getByRole("button", { name: /import legacy data/i });
    expect(importButton).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    await user.click(importButton);

    await waitFor(() => expect(convexState.importLegacyData).toHaveBeenCalledTimes(1));
    expect(convexState.importLegacyData).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceKey: "zustand:pack-list-storage:v1",
        fingerprint: expect.stringMatching(/^fnv1a128:/),
        lists: [expect.objectContaining({ name: "Alpine weekend" })],
        templates: [expect.objectContaining({ name: "Custom conference" })],
        preferences: {
          theme: "dark",
          defaultPriority: "high",
          autoSave: false,
        },
      }),
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      LEGACY_ARCHIVE_KEY,
      expect.stringContaining("imported"),
    );
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(screen.getByText(/imported successfully/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete legacy source data/i }));
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEY);
    expect(storage.removeItem).not.toHaveBeenCalledWith(LEGACY_ARCHIVE_KEY);
    expect(screen.getByText(/source data removed/i)).toBeInTheDocument();
  });

  it("requires explicit review when the raw source changes to an equivalent fingerprint", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    render(<LegacyImportDialog storage={storage} />);

    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    storage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(JSON.parse(legacyZustandJson), null, 2),
    );
    await user.click(screen.getByRole("button", { name: /import legacy data/i }));

    expect(convexState.importLegacyData).not.toHaveBeenCalled();
    expect(await screen.findAllByText(/legacy source changed/i)).not.toHaveLength(0);
    convexState.status = {
      status: "already_imported",
      listsImported: 1,
      templatesImported: 1,
    };
    await user.click(screen.getByRole("button", { name: /use refreshed preview/i }));
    expect(await screen.findByText(/already imported/i)).toBeInTheDocument();
  });

  it("requires reconfirmation after a materially changed source is refreshed", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    render(<LegacyImportDialog storage={storage} />);

    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    const changedEnvelope = JSON.parse(legacyZustandJson) as {
      state: { lists: Array<{ name: string }> };
    };
    changedEnvelope.state.lists[0].name = "Materially changed trip";
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(changedEnvelope));

    await user.click(screen.getByRole("button", { name: /import legacy data/i }));
    expect(convexState.importLegacyData).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /use refreshed preview/i }));

    const importButton = screen.getByRole("button", { name: /import legacy data/i });
    expect(importButton).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    ).not.toBeChecked();
  });

  it("shows an inaccessible stale-source condition while preserving recovery", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    render(<LegacyImportDialog storage={storage} />);

    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    await user.click(screen.getByRole("button", { name: /import legacy data/i }));

    expect(convexState.importLegacyData).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/storage.*inaccessible/i);
    expect(screen.getByRole("button", { name: /download recovery copy/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /use refreshed preview/i })).not.toBeInTheDocument();
  });

  it("keeps source data and offers retry after an import failure", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    convexState.importLegacyData
      .mockRejectedValueOnce(new TypeError("temporary failure"))
      .mockResolvedValueOnce({
        status: "imported",
        listsImported: 1,
        templatesImported: 1,
      });
    render(<LegacyImportDialog storage={storage} />);

    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    await user.click(screen.getByRole("button", { name: /import legacy data/i }));

    expect(await screen.findByText(/unexpected error interrupted/i)).toBeInTheDocument();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalledWith(
      LEGACY_ARCHIVE_KEY,
      expect.any(String),
    );

    await user.click(screen.getByRole("button", { name: /retry import/i }));
    await waitFor(() => expect(convexState.importLegacyData).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/imported successfully/i)).toBeInTheDocument();
  });

  it("keeps manual recovery available without retrying a validation failure", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    convexState.importLegacyData.mockRejectedValue({
      data: {
        code: "VALIDATION",
        message:
          "This legacy import is too large for the automatic migration. Download the recovery file and use manual export support instead.",
      },
    });
    render(<LegacyImportDialog storage={storage} />);

    await user.click(screen.getByRole("button", { name: /review legacy import/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /reviewed the preview and recovery options/i }),
    );
    await user.click(screen.getByRole("button", { name: /import legacy data/i }));

    expect(await screen.findByText(/manual export support/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download recovery copy/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /retry import/i })).not.toBeInTheDocument();
    expect(convexState.importLegacyData).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("downloads malformed source exactly and never offers automatic import", async () => {
    const user = userEvent.setup();
    const storage = createStorage(malformedLegacyJson);
    render(<LegacyImportDialog storage={storage} />);

    expect(screen.getByText(/could not be parsed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import legacy data/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /download raw recovery copy/i }));

    await waitFor(() => expect(exportedBlob).toBeDefined());
    expect(await readBlob(exportedBlob!)).toBe(malformedLegacyJson);
  });

  it("recognizes a server-recorded import and offers cleanup without reimporting", async () => {
    const user = userEvent.setup();
    const storage = createStorage(legacyZustandJson);
    convexState.status = {
      status: "already_imported",
      listsImported: 1,
      templatesImported: 1,
    };
    render(<LegacyImportDialog storage={storage} />);

    expect(await screen.findByText(/already imported/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import legacy data/i })).not.toBeInTheDocument();
    expect(storage.setItem).toHaveBeenCalledWith(
      LEGACY_ARCHIVE_KEY,
      expect.stringContaining("already_imported"),
    );
    await user.click(screen.getByRole("button", { name: /delete legacy source data/i }));
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEY);
    expect(convexState.importLegacyData).not.toHaveBeenCalled();
  });
});
