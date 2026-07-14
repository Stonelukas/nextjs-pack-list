// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet";

afterEach(cleanup);

describe("shared overlay close controls", () => {
  it("uses a 44px minimum touch target for dialog close", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
  });

  it("uses a 44px minimum touch target for sheet close", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
  });
});
