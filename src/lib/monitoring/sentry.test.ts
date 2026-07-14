import { describe, expect, it } from "vitest";

import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/lib/monitoring/sentry";

describe("sanitizeSentryEvent", () => {
  it("redacts credentials, identity, mutation arguments, and legacy payloads", () => {
    const event = {
      request: {
        headers: {
          authorization: "Bearer secret-token",
          cookie: "__session=cookie-secret",
          "set-cookie": "__session=set-cookie-secret",
          "x-safe-header": "visible",
        },
        data: {
          email: "traveler@example.com",
          mutationArgs: { name: "Passport" },
          variables: { notes: "Medication schedule" },
          input: { destination: "Private retreat" },
        },
        body: JSON.stringify({
          args: { notes: "Serialized medical notes" },
          legacyPayload: { lists: ["serialized-private-list"] },
        }),
      },
      contexts: {
        auth: { token: "jwt-secret", userId: "user_123" },
        migration: {
          legacyPayload: { lists: ["private-list"] },
          payload: { templates: ["private-template"] },
        },
      },
      extra: {
        safe: "visible",
        arguments: [{ private: true }],
      },
      user: {
        id: "user_123",
        email: "traveler@example.com",
      },
      users: [{ id: "user_456", displayName: "Visible name" }],
    };

    const sanitized = sanitizeSentryEvent(event);
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("cookie-secret");
    expect(serialized).not.toContain("set-cookie-secret");
    expect(serialized).not.toContain("traveler@example.com");
    expect(serialized).not.toContain("Passport");
    expect(serialized).not.toContain("Medication schedule");
    expect(serialized).not.toContain("Private retreat");
    expect(serialized).not.toContain("private-list");
    expect(serialized).not.toContain("private-template");
    expect(serialized).not.toContain("Serialized medical notes");
    expect(serialized).not.toContain("serialized-private-list");
    expect(serialized).not.toContain("jwt-secret");
    expect(serialized).not.toContain("user_123");
    expect(serialized).not.toContain("user_456");
    expect(serialized).toContain("visible");
    expect(serialized).toContain("Visible name");
  });

  it("scrubs tokens and emails embedded in generic string fields", () => {
    const sanitized = sanitizeSentryEvent({
      message: "Login failed for traveler@example.com with Bearer abc.def.ghi",
      request: {
        url: "https://pack.example/callback?token=secret-token&next=%2Flists",
      },
    });
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain("traveler@example.com");
    expect(serialized).not.toContain("abc.def.ghi");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).toContain("next");
  });

  it("removes private DOM selector content from UI breadcrumbs and final events", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      category: "ui.click",
      message: 'button[aria-label="Delete Medication"]',
      data: { target: 'button[aria-label="Delete Medication"]' },
    });

    expect(breadcrumb.message).toBe("[Filtered UI interaction]");
    expect(breadcrumb.data).toBeUndefined();

    const sanitizedEvent = sanitizeSentryEvent({ breadcrumbs: [breadcrumb] });
    expect(JSON.stringify(sanitizedEvent)).not.toContain("Medication");
  });

  it("handles cyclic arrays without overflowing", () => {
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);

    expect(() => sanitizeSentryEvent({ extra: cyclic })).not.toThrow();
  });
});
