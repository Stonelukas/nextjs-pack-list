import { describe, expect, it } from "vitest";

import { mapRouteError } from "@/app/errors/route-error-boundary";

function routeResponse(status: number) {
  return {
    status,
    statusText: "Route response",
    internal: false,
    data: null,
  };
}

describe("mapRouteError", () => {
  it.each([
    [400, "VALIDATION"],
    [401, "UNAUTHENTICATED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ] as const)("maps router status %s to %s", (status, code) => {
    expect(mapRouteError(routeResponse(status)).code).toBe(code);
  });
});
