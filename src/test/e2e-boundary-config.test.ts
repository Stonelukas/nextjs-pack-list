// @vitest-environment node

import type { ConfigEnv, UserConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import { createViteConfig } from "../../vite.config";

const configEnv = (
  mode: string,
  command: ConfigEnv["command"] = "serve",
): ConfigEnv => ({
  command,
  mode,
  isSsrBuild: false,
  isPreview: false,
});

function resolveConfig(
  mode: string,
  command: ConfigEnv["command"] = "serve",
): UserConfig {
  return createViteConfig(configEnv(mode, command), {
    VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL,
    VITE_APP_URL: process.env.VITE_APP_URL,
    VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN,
  });
}

function aliases(config: UserConfig) {
  const value = config.resolve?.alias;
  return Array.isArray(value) ? value : [];
}

function aliasNames(config: UserConfig) {
  return aliases(config).map((entry) => String(entry.find));
}

function aliasReplacements(config: UserConfig) {
  return aliases(config).map((entry) => String(entry.replacement));
}

beforeEach(() => {
  process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_Y2xlcmsudGVzdCQ=";
  process.env.VITE_CONVEX_URL = "https://route-ledger-test.convex.cloud";
  process.env.VITE_APP_URL = "https://route-ledger-test.example";
  process.env.VITE_SENTRY_DSN = "";
});

afterEach(() => {
  delete process.env.ROUTE_LEDGER_E2E;
  delete process.env.VITE_CLERK_PUBLISHABLE_KEY;
  delete process.env.VITE_CONVEX_URL;
  delete process.env.VITE_APP_URL;
  delete process.env.VITE_SENTRY_DSN;
});

describe("Task 10 E2E Vite boundary", () => {
  it("EC-01 leaves external packages untouched in ordinary modes", () => {
    delete process.env.ROUTE_LEDGER_E2E;

    const names = aliasNames(resolveConfig("development"));

    expect(names).toContain("@");
    expect(names.join(" ")).not.toMatch(/clerk|convex|pwa-register/i);
    expect(aliasReplacements(resolveConfig("development")).join(" ")).not.toMatch(
      /src[\\/]test[\\/]mocks/,
    );
  });

  it("EC-02 refuses e2e mode without the server-only flag", () => {
    delete process.env.ROUTE_LEDGER_E2E;

    expect(() => resolveConfig("e2e")).toThrow("ROUTE_LEDGER_E2E=1");
  });

  it("EC-03 aliases only client service edges in e2e serve mode", () => {
    process.env.ROUTE_LEDGER_E2E = "1";

    const names = aliasNames(resolveConfig("e2e"));

    expect(names.join(" ")).toMatch(/@clerk\\\/clerk-react/);
    expect(names.join(" ")).toMatch(/convex\\\/react/);
    expect(names.join(" ")).toMatch(/convex\\\/react-clerk/);
    expect(names.join(" ")).toMatch(/virtual:pwa-register\\\/react/);
    expect(names.join(" ")).toMatch(/@vercel\\\/analytics\\\/react/);
    expect(names.join(" ")).toMatch(/@vercel\\\/speed-insights\\\/react/);
    expect(names.join(" ")).not.toMatch(/convex\\\/server/);
  });

  it("EC-04 refuses to activate the test boundary in a production build", () => {
    process.env.ROUTE_LEDGER_E2E = "1";

    expect(() => resolveConfig("e2e", "build")).toThrow(
      /development server only|cannot be used for production builds/i,
    );
  });

  it("EC-05 ignores the server-only flag for ordinary production builds", () => {
    process.env.ROUTE_LEDGER_E2E = "1";

    const config = resolveConfig("production", "build");

    expect(aliasNames(config)).toEqual(["@"]);
    expect(aliasReplacements(config).join(" ")).not.toMatch(/src[\\/]test[\\/]mocks/);
    expect(config.define).toBeUndefined();
  });

  it("EC-06 smoke-tests the ordinary preview artifact instead of the mocked development server", () => {
    const command = packageJson.scripts["test:build-smoke"];

    expect(command).toMatch(/smoke-built-artifact/);
    expect(command).not.toMatch(/--mode e2e|vite dev/);
  });
});
