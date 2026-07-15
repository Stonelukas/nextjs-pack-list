// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const migration = vi.hoisted(() => ({
  hasImportableData: false,
  statusLoading: false,
  result: null as null | { status: "already_imported" | "imported" },
}));

vi.mock("./use-legacy-migration", () => ({
  useLegacyMigration: () => migration,
}));

import { LegacyMigrationPrompt } from "./legacy-migration-prompt";

beforeEach(() => {
  migration.hasImportableData = false;
  migration.statusLoading = false;
  migration.result = null;
});

afterEach(cleanup);

describe("LegacyMigrationPrompt", () => {
  it("appears after authenticated startup when importable legacy data is unrecorded", () => {
    migration.hasImportableData = true;

    render(
      <MemoryRouter>
        <LegacyMigrationPrompt />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status", { name: /legacy packing data found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review legacy import/i })).toHaveAttribute(
      "href",
      "/settings?section=migration",
    );
  });

  it("stays absent when legacy data is missing", () => {
    render(
      <MemoryRouter>
        <LegacyMigrationPrompt />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/legacy packing data found/i)).not.toBeInTheDocument();
  });

  it("stays absent while status is loading or the source was already imported", () => {
    migration.hasImportableData = true;
    migration.statusLoading = true;
    const view = render(
      <MemoryRouter>
        <LegacyMigrationPrompt />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/legacy packing data found/i)).not.toBeInTheDocument();

    migration.statusLoading = false;
    migration.result = { status: "already_imported" };
    view.rerender(
      <MemoryRouter>
        <LegacyMigrationPrompt />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/legacy packing data found/i)).not.toBeInTheDocument();
  });
});
