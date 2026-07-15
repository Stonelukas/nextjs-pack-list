// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { parseRuntimeEnv } from "./env";

describe("parseRuntimeEnv", () => {
  it("returns unconfigured state instead of throwing", () => {
    expect(parseRuntimeEnv({}, "http://localhost:5173", "development")).toMatchObject({
      status: "unconfigured",
      issues: expect.arrayContaining([
        expect.objectContaining({ key: "VITE_CLERK_PUBLISHABLE_KEY" }),
      ]),
    });
  });

  it("falls back to the current origin for appUrl", () => {
    expect(
      parseRuntimeEnv(
        {
          VITE_CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsudGVzdCQ=",
          VITE_CONVEX_URL: "https://example.convex.cloud",
        },
        "http://localhost:5173",
        "development",
      ),
    ).toEqual({
      status: "configured",
      env: {
        clerkPublishableKey: "pk_test_Y2xlcmsudGVzdCQ=",
        convexUrl: "https://example.convex.cloud",
        appUrl: "http://localhost:5173",
        sentryDsn: undefined,
      },
    });
  });
});
