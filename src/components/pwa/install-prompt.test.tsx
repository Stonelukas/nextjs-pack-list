// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstallPrompt } from "./install-prompt";

interface TestInstallEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function dispatchInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as TestInstallEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });

  act(() => window.dispatchEvent(event));
  return event;
}

afterEach(cleanup);

describe("InstallPrompt", () => {
  it("offers installation only after the browser exposes an install event", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    expect(
      screen.queryByRole("region", { name: /install route ledger/i }),
    ).not.toBeInTheDocument();

    const installEvent = dispatchInstallPrompt();

    expect(
      screen.getByRole("region", { name: /install route ledger/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /install app/i }));

    expect(installEvent.defaultPrevented).toBe(true);
    expect(installEvent.prompt).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(
        screen.queryByRole("region", { name: /install route ledger/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("lets the user dismiss the install offer", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    dispatchInstallPrompt();

    await user.click(screen.getByRole("button", { name: /not now/i }));

    expect(
      screen.queryByRole("region", { name: /install route ledger/i }),
    ).not.toBeInTheDocument();
  });
});
