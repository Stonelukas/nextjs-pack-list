// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

afterEach(cleanup);

describe("PageHeader", () => {
  it("owns one h1 and can opt into one decorative route spine", () => {
    const { container } = render(
      <PageHeader
        eyebrow="Route PL-204"
        spine="default"
        title="Weekend in Copenhagen"
        description="Keep the route, quantities, and packing state in one operational view."
        actions={
          <>
            <button type="button">Create list</button>
            <button type="button">Import</button>
          </>
        }
      />,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Weekend in Copenhagen",
    );
    expect(screen.getByText("Route PL-204")).toHaveClass("font-mono");
    expect(screen.getByText(/operational view/i)).toBeInTheDocument();
    expect(container.querySelectorAll("[data-route-spine]")).toHaveLength(1);
    expect(container.querySelector("[data-route-spine]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Create list",
      "Import",
    ]);
  });

  it("uses the restrained Geist heading scale selected for the Graphite workspace", () => {
    render(<PageHeader title="My packing lists" description="Keep each trip clear." />);

    expect(
      screen.getByRole("heading", { level: 1, name: "My packing lists" }),
    ).toHaveClass("font-sans", "text-3xl", "md:text-4xl");
  });

  it("can suppress its decorative spine when the route extends one shared marker", () => {
    const { container } = render(
      <PageHeader title="Weekend in Copenhagen" spine="none" />,
    );

    expect(container.querySelector("[data-route-spine]")).not.toBeInTheDocument();
    expect(container.querySelector(".route-header__content")).toHaveAttribute(
      "data-route-spine-suppressed",
      "true",
    );
  });
});
