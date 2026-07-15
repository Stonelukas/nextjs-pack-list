// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { PublicHomePage } from "./public-home-page";

afterEach(cleanup);

describe("PublicHomePage", () => {
  it("explains the product with provider-independent account actions", () => {
    render(
      <MemoryRouter>
        <PublicHomePage authStatus="ready" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /everything you need/i,
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /create a list/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(
      screen.queryByText(/packing operations|manifest|route state/i),
    ).not.toBeInTheDocument();
  });

  it("uses clear feature headings instead of decorative labels", () => {
    render(
      <MemoryRouter>
        <PublicHomePage authStatus="ready" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Keep every trip clear" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Start with a useful template" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "See what is ready" }),
    ).toBeVisible();
  });
});
