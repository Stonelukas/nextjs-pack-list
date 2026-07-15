// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Section } from "./section";

afterEach(cleanup);

describe("Section", () => {
  it("labels its section with an h2 and keeps an optional action in the heading row", () => {
    render(
      <Section
        title="Packing manifest"
        description="Items grouped by route-ready category."
        action={<button type="button">Add category</button>}
      >
        <p>Manifest rows</p>
      </Section>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Packing manifest" });
    const region = heading.closest("section");
    expect(region).toHaveAttribute("aria-labelledby", heading.id);
    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
    expect(screen.getByText("Manifest rows")).toBeInTheDocument();
  });
});
