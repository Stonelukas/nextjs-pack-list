import { describe, expect, it } from "vitest";

import { isExpectedError, mapError } from "@/lib/errors";

describe("mapError", () => {
  it.each([
    ["UNAUTHENTICATED", "Sign in required", false],
    ["FORBIDDEN", "Access denied", false],
    ["NOT_FOUND", "Not found", false],
    ["VALIDATION", "Check your information", false],
    ["OFFLINE", "You are offline", true],
  ] as const)("maps %s domain errors to actionable UI", (code, title, retryable) => {
    const mapped = mapError({ data: { code, message: "Domain detail" } });

    expect(mapped).toEqual({ code, title, message: "Domain detail", retryable });
    expect(isExpectedError(mapped)).toBe(true);
  });

  it("maps unknown failures without exposing internal details", () => {
    const mapped = mapError(new Error("secret stack detail"));

    expect(mapped).toEqual({
      code: "UNEXPECTED",
      title: "Something went wrong",
      message: "An unexpected error interrupted the page. Please try again.",
      retryable: true,
    });
    expect(isExpectedError(mapped)).toBe(false);
  });

  it("does not hide programming TypeErrors merely because the browser is offline", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });

    expect(mapError(new TypeError("Cannot read properties of undefined")).code).toBe(
      "UNEXPECTED",
    );
  });

  it("maps recognizable fetch failures to offline while disconnected", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });

    expect(mapError(new TypeError("Failed to fetch")).code).toBe("OFFLINE");
  });
});
