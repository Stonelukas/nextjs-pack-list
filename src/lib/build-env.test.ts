import { describe, expect, it } from "vitest";

import { parseVitePublicEnv, validateVitePublicEnv } from "./build-env";

const validEnv = {
  VITE_CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsudGVzdCQ=",
  VITE_CONVEX_URL: "https://route-ledger.convex.cloud",
  VITE_APP_URL: "https://route-ledger.example",
  VITE_SENTRY_DSN: "",
};

describe("validateVitePublicEnv", () => {
  it("returns structured issues without throwing", () => {
    expect(parseVitePublicEnv({}, { mode: "development" })).toEqual({
      status: "invalid",
      issues: expect.arrayContaining([
        expect.objectContaining({ key: "VITE_CLERK_PUBLISHABLE_KEY" }),
        expect.objectContaining({ key: "VITE_CONVEX_URL" }),
      ]),
    });
  });

  it("keeps strict build validation", () => {
    expect(() => validateVitePublicEnv({}, { mode: "production" })).toThrow(
      "Missing required environment variable: VITE_CLERK_PUBLISHABLE_KEY",
    );
  });

  it("accepts only the allowlisted non-secret public build values", () => {
    expect(validateVitePublicEnv(validEnv, { mode: "production" })).toEqual(validEnv);
  });

  it("accepts Convex CLI HTTP-actions metadata without adding it to runtime config", () => {
    expect(
      validateVitePublicEnv(
        {
          ...validEnv,
          VITE_CONVEX_SITE_URL: "https://route-ledger.convex.site",
        },
        { mode: "production" },
      ),
    ).toEqual(validEnv);
  });

  it("accepts Vercel-reserved Vite metadata without adding it to runtime config", () => {
    expect(
      validateVitePublicEnv(
        {
          ...validEnv,
          VITE_VERCEL_ENV: "preview",
          VITE_VERCEL_GIT_REPO_ID: "repo_123",
          VITE_VERCEL_GIT_COMMIT_SHA: "abc123",
        },
        { mode: "production" },
      ),
    ).toEqual(validEnv);
  });

  it.each([
    [{ ...validEnv, VITE_CLERK_PUBLISHABLE_KEY: "" }, /VITE_CLERK_PUBLISHABLE_KEY/],
    [{ ...validEnv, VITE_CLERK_PUBLISHABLE_KEY: "clerk-secret" }, /publishable key/i],
    [{ ...validEnv, VITE_CONVEX_URL: "http://route-ledger.convex.cloud" }, /HTTPS Convex URL/i],
    [{ ...validEnv, VITE_CONVEX_URL: "not a url" }, /valid URL/i],
    [
      { ...validEnv, VITE_CONVEX_SITE_URL: "http://route-ledger.convex.site" },
      /HTTPS Convex HTTP actions URL/i,
    ],
    [{ ...validEnv, VITE_ADMIN_KEY: "private-value" }, /not an allowlisted public variable/i],
  ])("rejects an unsafe production build environment", (environment, message) => {
    expect(() =>
      validateVitePublicEnv(environment, { mode: "production" }),
    ).toThrow(message);
  });

  it("allows an HTTP localhost Convex URL only in development mode", () => {
    expect(
      validateVitePublicEnv(
        { ...validEnv, VITE_CONVEX_URL: "http://127.0.0.1:3210" },
        { mode: "development" },
      ).VITE_CONVEX_URL,
    ).toBe("http://127.0.0.1:3210");

    expect(() =>
      validateVitePublicEnv(
        { ...validEnv, VITE_CONVEX_URL: "http://127.0.0.1:3210" },
        { mode: "production" },
      ),
    ).toThrow(/HTTPS Convex URL/i);
  });
});
