// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Package } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  it("uses a contextual heading, hides the supporting icon, and limits actions", () => {
    render(
      <EmptyState
        icon={Package}
        title="No packing lists found"
        description="Create a list or start from a route template."
        primaryAction={<button type="button">Create list</button>}
        secondaryAction={<a href="/templates">Browse templates</a>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No packing lists found" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/start from a route template/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create list" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse templates" })).toBeInTheDocument();
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
