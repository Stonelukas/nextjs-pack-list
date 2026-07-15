// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registration = vi.hoisted(() => ({
  needRefresh: true,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [registration.needRefresh, registration.setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: registration.updateServiceWorker,
  }),
}));

import { PwaUpdatePrompt } from "./pwa-update-prompt";

beforeEach(() => {
  registration.needRefresh = true;
  registration.setNeedRefresh.mockReset();
  registration.updateServiceWorker.mockReset();
});

afterEach(cleanup);

describe("PwaUpdatePrompt", () => {
  it("waits for the user before activating an updated worker", async () => {
    const user = userEvent.setup();
    render(<PwaUpdatePrompt />);

    expect(
      screen.getByRole("region", { name: /application update available/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /update now/i }));

    expect(registration.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("lets the user defer the update", async () => {
    const user = userEvent.setup();
    render(<PwaUpdatePrompt />);

    await user.click(screen.getByRole("button", { name: /later/i }));

    expect(registration.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(registration.updateServiceWorker).not.toHaveBeenCalled();
  });

  it("stays hidden until an update is waiting", () => {
    registration.needRefresh = false;

    render(<PwaUpdatePrompt />);

    expect(
      screen.queryByRole("region", { name: /application update available/i }),
    ).not.toBeInTheDocument();
  });
});
