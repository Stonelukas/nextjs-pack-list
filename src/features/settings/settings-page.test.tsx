// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hookState = vi.hoisted(() => ({
  lists: undefined as unknown[] | undefined,
  listsLoading: true,
  templates: undefined as unknown[] | undefined,
  templatesLoading: true,
  preferences: {
    theme: "system",
    defaultPriority: "medium",
    autoSave: true,
  } as
    | { theme: "light" | "dark" | "system"; defaultPriority: "low" | "medium" | "high" | "essential"; autoSave: boolean }
    | null
    | undefined,
  preferencesLoading: false,
  preferencesPending: false,
  preferenceError: null as null | { title: string; message: string },
  updatePreferences: vi.fn(),
  setTheme: vi.fn(),
}));
const clerkState = vi.hoisted(() => ({ userProfile: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
vi.mock("@clerk/clerk-react", () => ({
  UserProfile: (props: unknown) => {
    clerkState.userProfile(props);
    return <div>Clerk profile</div>;
  },
  useUser: () => ({
    user: {
      id: "user-1",
      fullName: "Test User",
      primaryEmailAddress: { emailAddress: "user@example.com" },
    },
  }),
}));
vi.mock("@/features/lists/hooks/use-lists", () => ({
  useListExportData: () => ({
    lists: hookState.lists,
    loading: hookState.listsLoading,
  }),
}));
vi.mock("@/features/templates/hooks/use-templates", () => ({
  useOwnedTemplateExportData: () => ({
    templates: hookState.templates,
    loading: hookState.templatesLoading,
  }),
}));
vi.mock("@/features/settings/hooks/use-preferences", () => ({
  usePreferences: () => ({
    error: hookState.preferenceError,
    loading: hookState.preferencesLoading,
    pending: hookState.preferencesPending,
    preferences: hookState.preferences,
    updatePreferences: hookState.updatePreferences,
  }),
}));
vi.mock("@/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "system", setTheme: hookState.setTheme }),
}));
vi.mock("@/components/export/import-dialog", () => ({ ImportDialog: () => null }));
vi.mock("@/features/legacy-migration/legacy-import-dialog", () => ({
  LegacyImportDialog: () => <div>Validated legacy migration</div>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SettingsPage } from "./settings-page";

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
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: vi.fn(),
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      length: 0,
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
  });
  hookState.lists = undefined;
  hookState.listsLoading = true;
  hookState.templates = undefined;
  hookState.templatesLoading = true;
  hookState.preferences = {
    theme: "system",
    defaultPriority: "medium",
    autoSave: true,
  };
  hookState.preferencesLoading = false;
  hookState.preferencesPending = false;
  hookState.preferenceError = null;
  hookState.updatePreferences.mockReset().mockResolvedValue("user-1");
  hookState.setTheme.mockReset();
  clerkState.userProfile.mockReset();
  exportedBlob = undefined;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn((blob: Blob) => {
      exportedBlob = blob;
      return "blob:test";
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

describe("SettingsPage", () => {
  it("keeps the page title at h1 and active panel title at h2", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Profile and security" })).toBeInTheDocument();
  });

  it("applies the shared Graphite Clerk theme to account management", () => {
    render(<SettingsPage />);

    expect(clerkState.userProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          userProfile: expect.objectContaining({
            elements: expect.objectContaining({
              card: expect.objectContaining({
                backgroundColor: "var(--card)",
              }),
              navbar: expect.objectContaining({
                backgroundColor: "var(--surface-muted)",
              }),
            }),
          }),
        }),
      }),
    );
  });

  it("applies an appearance draft immediately before it is saved", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /appearance/i }));
    await user.click(screen.getByLabelText("Theme"));
    await user.click(screen.getByRole("option", { name: "Dark" }));

    expect(hookState.setTheme).toHaveBeenCalledWith("dark");
  });

  it("does not offer an auto-save preference that has no distinct runtime behavior", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /preferences/i }));

    expect(screen.queryByRole("switch", { name: /auto-save/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Default item priority")).toBeInTheDocument();
  });

  it("initializes the editable draft from resolved server preferences", async () => {
    const user = userEvent.setup();
    hookState.preferences = {
      theme: "dark",
      defaultPriority: "high",
      autoSave: false,
    };
    render(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /preferences/i }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() =>
      expect(hookState.updatePreferences).toHaveBeenCalledWith({
        theme: "dark",
        defaultPriority: "high",
        autoSave: false,
      }),
    );
  });

  it("announces asynchronous preference failures", async () => {
    const user = userEvent.setup();
    hookState.preferenceError = {
      title: "Could not save preferences",
      message: "Try again.",
    };
    render(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /preferences/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save preferences");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
  });

  it("disables account export until owner-scoped data resolves", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: /data/i }));

    expect(screen.getByRole("button", { name: /export my data/i })).toBeDisabled();
  });

  it("blocks preference edits, saving, and account export while preferences are unresolved", async () => {
    const user = userEvent.setup();
    hookState.lists = [];
    hookState.listsLoading = false;
    hookState.templates = [];
    hookState.templatesLoading = false;
    hookState.preferences = undefined;
    hookState.preferencesLoading = true;

    render(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: /preferences/i }));

    expect(screen.getByLabelText("Default item priority")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save preferences" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(hookState.updatePreferences).not.toHaveBeenCalled();

    await user.click(screen.getByRole("tab", { name: /appearance/i }));
    expect(screen.getByLabelText("Theme")).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: /data/i }));
    expect(screen.getByRole("button", { name: /export my data/i })).toBeDisabled();
  });

  it("exports complete owner templates after every export page resolves", async () => {
    const user = userEvent.setup();
    const firstPageTemplate = {
      _id: "owned-private",
      name: "Private",
      categories: [
        { name: "Documents", items: [{ name: "Passport" }] },
      ],
    };
    const laterPageTemplate = {
      _id: "owned-public",
      name: "Public owned",
      categories: [
        { name: "Clothing", items: [{ name: "Jacket" }] },
      ],
    };
    hookState.lists = [{ _id: "list-1", name: "My list" }];
    hookState.listsLoading = false;
    hookState.templates = [firstPageTemplate, laterPageTemplate];
    hookState.templatesLoading = false;

    render(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: /data/i }));
    await user.click(screen.getByRole("button", { name: /export my data/i }));

    await waitFor(() => expect(exportedBlob).toBeDefined());
    const payload = JSON.parse(await readBlob(exportedBlob!)) as {
      templates: unknown[];
    };
    expect(payload.templates).toEqual([firstPageTemplate, laterPageTemplate]);
  });

  it("mounts the validated one-time migration experience in settings", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole("tab", { name: /legacy migration/i }));

    expect(screen.getByText("Validated legacy migration")).toBeInTheDocument();
  });
});
