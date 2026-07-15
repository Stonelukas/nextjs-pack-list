// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  getSystemSettings: Symbol("getSystemSettings"),
  exportSystemSettings: Symbol("exportSystemSettings"),
  updateSystemSettings: Symbol("updateSystemSettings"),
  resetSystemSettings: Symbol("resetSystemSettings"),
  settings: undefined as SystemSettingsFixture | undefined,
  update: vi.fn(),
  reset: vi.fn(),
}));

type SystemSettingsFixture = {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerAccount: number;
    defaultUserRole: "user" | "admin";
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableCaptcha: boolean;
    allowedDomains: string[];
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userWelcomeEmail: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    defaultTheme: string;
    allowThemeSelection: boolean;
    customLogo: string;
    primaryColor: string;
    accentColor: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    maxFileSize: number;
  };
};

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    settings: {
      getSystemSettings: convex.getSystemSettings,
      exportSystemSettings: convex.exportSystemSettings,
      updateSystemSettings: convex.updateSystemSettings,
      resetSystemSettings: convex.resetSystemSettings,
    },
  },
}));
vi.mock("convex/react", () => ({
  useQuery: (reference: symbol) =>
    reference === convex.getSystemSettings ? convex.settings : { settings: convex.settings },
  useMutation: (reference: symbol) =>
    reference === convex.updateSystemSettings ? convex.update : convex.reset,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SystemSettings } from "./system-settings";

const systemSettingsSource = readFileSync(
  path.join(process.cwd(), "src/components/admin/settings/system-settings.tsx"),
  "utf8",
);

const serverSettings: SystemSettingsFixture = {
  general: {
    siteName: "Stored Pack List",
    siteDescription: "Stored description",
    contactEmail: "stored@example.com",
    supportEmail: "help@example.com",
    maintenanceMode: true,
    registrationEnabled: false,
    maxUsersPerAccount: 42,
    defaultUserRole: "admin",
  },
  security: {
    passwordMinLength: 12,
    requireTwoFactor: true,
    sessionTimeout: 6,
    maxLoginAttempts: 4,
    enableCaptcha: true,
    allowedDomains: ["example.com"],
  },
  notifications: {
    emailNotifications: false,
    pushNotifications: false,
    adminAlerts: false,
    userWelcomeEmail: false,
    systemUpdates: false,
  },
  appearance: {
    defaultTheme: "dark",
    allowThemeSelection: false,
    customLogo: "https://example.com/logo.svg",
    primaryColor: "#111111",
    accentColor: "#222222",
  },
  performance: {
    cacheEnabled: false,
    cacheDuration: 120,
    compressionEnabled: false,
    cdnEnabled: true,
    maxFileSize: 25,
  },
};

beforeEach(() => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
  convex.settings = undefined;
  convex.update.mockReset().mockResolvedValue({ success: true });
  convex.reset.mockReset().mockResolvedValue({ success: true });
});

afterEach(cleanup);

describe("SystemSettings", () => {
  it("labels persisted settings as unsupported and prevents operational edits", async () => {
    const user = userEvent.setup();
    convex.settings = serverSettings;
    render(<SystemSettings />);

    expect(screen.getByRole("note")).toHaveTextContent(/stored for reference only/i);
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Maintenance Mode" })).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "Security" }));
    expect(screen.getByRole("switch", { name: "Two-Factor Authentication" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Enable CAPTCHA" })).toBeDisabled();
  });

  it("confirms resetting every stored setting before the destructive mutation", async () => {
    const user = userEvent.setup();
    convex.settings = serverSettings;
    render(<SystemSettings />);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(convex.reset).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/all stored system settings/i);

    await user.click(screen.getByRole("button", { name: "Reset all stored settings" }));
    await waitFor(() => expect(convex.reset).toHaveBeenCalledTimes(1));
  });

  it("wraps header actions and settings tabs without widening mobile viewports", () => {
    convex.settings = serverSettings;
    const { container } = render(<SystemSettings />);

    expect(container.querySelector("[data-system-settings-header]")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    );
    expect(container.querySelector("[data-system-settings-actions]")).toHaveClass(
      "flex-wrap",
      "self-stretch",
    );
    expect(container.querySelector("[data-system-settings-tabs]")).toHaveClass(
      "overflow-x-auto",
      "justify-start",
    );
  });

  it("uses Route Ledger surface and ink tokens for the cache notice", () => {
    expect(systemSettingsSource).toContain(
      'data-cache-notice className="rounded-lg border border-border bg-surface-muted p-4"',
    );
    expect(systemSettingsSource).not.toMatch(
      /(?:blue|purple|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)/,
    );
  });

  it("gives every switch, select, and color text field an accessible name", async () => {
    const user = userEvent.setup();
    convex.settings = serverSettings;
    render(<SystemSettings />);

    expect(screen.getByRole("switch", { name: "Maintenance Mode" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Registration Enabled" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Default User Role" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Security" }));
    expect(screen.getByRole("switch", { name: "Two-Factor Authentication" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable CAPTCHA" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Notifications" }));
    for (const name of [
      "Email Notifications",
      "Push Notifications",
      "Admin Alerts",
      "User Welcome Email",
      "System Updates",
    ]) {
      expect(screen.getByRole("switch", { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("tab", { name: "Appearance" }));
    expect(screen.getByRole("combobox", { name: "Default Theme" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Primary Color hex value" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Accent Color hex value" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Allow Theme Selection" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Performance" }));
    expect(screen.getByRole("switch", { name: "Enable Caching" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable Compression" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable CDN" })).toBeInTheDocument();
  });

  it("hydrates read-only values from resolved server settings without implying enforcement", () => {
    const view = render(<SystemSettings />);
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();

    convex.settings = serverSettings;
    view.rerender(<SystemSettings />);

    expect(screen.getByLabelText("Site Name")).toHaveValue("Stored Pack List");
    expect(screen.getByLabelText("Site Name")).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Default User Role" })).toBeDisabled();
    expect(screen.queryByRole("option", { name: "Moderator" })).not.toBeInTheDocument();
    expect(convex.update).not.toHaveBeenCalled();
  });

  it("disables server mutations offline and explains why", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    convex.settings = serverSettings;

    render(<SystemSettings />);

    const button = screen.getByRole("button", { name: /reset/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "aria-describedby",
      "system-settings-offline-reason",
    );
    expect(screen.getByText(/reconnect to reset stored system settings/i)).toBeInTheDocument();
    expect(convex.update).not.toHaveBeenCalled();
    expect(convex.reset).not.toHaveBeenCalled();
  });
});
