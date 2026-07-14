// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useOnlineStatus } from "./use-online-status";

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

beforeEach(() => setOnline(true));
afterEach(() => setOnline(true));

describe("useOnlineStatus", () => {
  it("tracks browser online and offline events", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toEqual({ online: true });

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toEqual({ online: false });

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toEqual({ online: true });
  });
});
