// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/monitoring/sentry", () => ({
  captureUnexpectedError: vi.fn(),
}));

import { RootErrorBoundary } from "@/app/errors/root-error-boundary";

afterEach(cleanup);

function ThrowFalsy(): never {
  throw "";
}

describe("RootErrorBoundary", () => {
  it("renders recovery UI when a descendant throws a falsy value", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <RootErrorBoundary>
        <ThrowFalsy />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
  });
});
