// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OfflineBanner } from "./offline-banner";

beforeEach(() => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: false,
  });
});

afterEach(cleanup);

describe("OfflineBanner", () => {
  it("announces connectivity loss without promising offline editing", () => {
    render(<OfflineBanner />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/offline/i);
    expect(status).toHaveTextContent(/changes require a connection/i);
    expect(status).not.toHaveTextContent(/sync later|edit offline/i);
  });
});
