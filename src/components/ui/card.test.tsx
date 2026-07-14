// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Card, CardTitle } from "./card";

afterEach(cleanup);

describe("Card", () => {
  it("provides the shared restrained radius and flat Graphite surface", () => {
    render(<Card>Trip notes</Card>);

    expect(screen.getByText("Trip notes")).toHaveClass(
      "rounded-[var(--radius)]",
      "shadow-none",
    );
  });
});

describe("CardTitle", () => {
  it("renders the heading level selected by the route hierarchy", () => {
    render(
      <>
        <CardTitle as="h2">Route summary</CardTitle>
        <CardTitle as="h3">Nested panel</CardTitle>
      </>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Route summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Nested panel" })).toBeInTheDocument();
  });
});
