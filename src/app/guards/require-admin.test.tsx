// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({
  value: undefined as
    | undefined
    | { authenticated: false; role: null }
    | { authenticated: true; role: "user" | "admin" },
}));

vi.mock("convex/react", () => ({
  useQuery: () => queryState.value,
}));

import { RequireAdmin } from "@/app/guards/require-admin";

function PrivilegedContent() {
  return <p>Administrative controls</p>;
}

afterEach(cleanup);

describe("RequireAdmin", () => {
  it("keeps privileged descendants unmounted while access is pending", () => {
    queryState.value = undefined;

    render(
      <RequireAdmin>
        <PrivilegedContent />
      </RequireAdmin>,
    );

    expect(screen.getByRole("status", { name: /checking administrator access/i })).toBeInTheDocument();
    expect(screen.queryByText("Administrative controls")).not.toBeInTheDocument();
  });

  it.each([
    { authenticated: false as const, role: null },
    { authenticated: true as const, role: "user" as const },
  ])("renders a forbidden state for access %#", (access) => {
    queryState.value = access;

    render(
      <RequireAdmin>
        <PrivilegedContent />
      </RequireAdmin>,
    );

    expect(screen.getByRole("heading", { name: /administrator access required/i })).toBeInTheDocument();
    expect(screen.queryByText("Administrative controls")).not.toBeInTheDocument();
  });

  it("renders privileged descendants only for a server-confirmed admin", () => {
    queryState.value = { authenticated: true, role: "admin" };

    render(
      <RequireAdmin>
        <PrivilegedContent />
      </RequireAdmin>,
    );

    expect(screen.getByText("Administrative controls")).toBeInTheDocument();
  });
});
