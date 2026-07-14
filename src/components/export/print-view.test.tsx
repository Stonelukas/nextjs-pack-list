// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PrintView } from "./print-view";

const list = {
  _id: "list-1",
  _creationTime: 1,
  userId: "user-1",
  name: "Weekend",
  isTemplate: false,
  categories: [
    {
      _id: "category-1",
      _creationTime: 2,
      listId: "list-1",
      name: "Documents",
      order: 0,
      collapsed: true,
      items: [
        {
          _id: "item-1",
          _creationTime: 3,
          categoryId: "category-1",
          name: "Passport",
          quantity: 1,
          packed: false,
          priority: "essential",
          order: 0,
        },
      ],
    },
  ],
} as never;

afterEach(cleanup);

describe("PrintView", () => {
  it("renders every item even when its interactive category is collapsed", () => {
    render(<PrintView list={list} />);

    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
  });
});
