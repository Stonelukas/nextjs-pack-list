// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const listScenario = vi.hoisted(() => ({ emptyAccount: false }));

vi.mock("@/features/lists/hooks/use-lists", async () => {
  const React = await import("react");
  const firstPage = [
    {
      _id: "list-new",
      _creationTime: 2,
      name: "New route",
      categoryCount: 0,
      itemCount: 0,
      packedCount: 0,
    },
  ];
  const secondPage = [
    {
      _id: "list-old",
      _creationTime: 1,
      name: "Older completed match",
      completedAt: 10,
      categoryCount: 0,
      itemCount: 0,
      packedCount: 0,
    },
  ];

  return {
    useLists: () => {
      const [pageCount, setPageCount] = React.useState(1);
      return {
        lists: listScenario.emptyAccount
          ? []
          : pageCount === 1
            ? firstPage
            : [...firstPage, ...secondPage],
        loading: false,
        hasMore: !listScenario.emptyAccount && pageCount === 1,
        loadMore: () => setPageCount(2),
      };
    },
  };
});
vi.mock("@/components/search/search-bar", () => ({
  SearchBar: ({ onSearch }: { onSearch: (value: string) => void }) => (
    <input
      aria-label="Search packing lists"
      onChange={(event) => onSearch(event.target.value)}
      type="search"
    />
  ),
}));
vi.mock("@/components/feedback/empty-state", () => ({
  EmptyState: ({ title }: { title: string }) => <p>{title}</p>,
}));
vi.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
    </header>
  ),
}));
vi.mock("@/components/layout/section", () => ({
  Section: ({
    action,
    children,
    title,
  }: {
    action?: React.ReactNode;
    children: React.ReactNode;
    title: string;
  }) => (
    <section aria-label={title}>
      <h2>{title}</h2>
      {action}
      {children}
    </section>
  ),
}));
vi.mock("@/components/templates/quick-start-templates", () => ({
  QuickStartTemplates: () => (
    <section data-testid="quick-start">Quick start templates</section>
  ),
}));
vi.mock("@/components/export/import-dialog", () => ({
  ImportDialog: () => <button type="button">Import list</button>,
}));
vi.mock("./create-list-form", () => ({
  CreateListForm: () => <button type="button">Create list</button>,
}));
vi.mock("./list-card", () => ({
  ListCard: ({ list }: { list: { name: string } }) => <article>{list.name}</article>,
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SelectTrigger: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SelectValue: () => null,
}));

import { ListOverview } from "./list-overview";

afterEach(() => {
  cleanup();
  listScenario.emptyAccount = false;
});

describe("ListOverview hierarchy", () => {
  it("keeps the friendly page title and quick starts directly below it", () => {
    render(
      <MemoryRouter initialEntries={["/lists?status=active"]}>
        <ListOverview />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "My packing lists" }),
    ).toBeVisible();
    const pageHeader = screen.getByTestId("page-header");
    const quickStart = screen.getByTestId("quick-start");
    expect(pageHeader.nextElementSibling).toBe(quickStart);
  });

  it("presents list counts as one accessible stat-tile group", () => {
    render(
      <MemoryRouter>
        <ListOverview />
      </MemoryRouter>,
    );

    const stats = screen.getByRole("group", {
      name: "Packing list statistics",
    });
    expect(within(stats).getByText("Packing lists")).toBeVisible();
    expect(within(stats).getByText("Completed")).toBeVisible();
    expect(within(stats).getByText("Items")).toBeVisible();
    expect(within(stats).getByText("Average packed")).toBeVisible();
    expect(within(stats).queryByText(/trend|change/i)).not.toBeInTheDocument();
  });

  it("keeps zero-value statistics in the empty-account hierarchy", () => {
    listScenario.emptyAccount = true;
    render(
      <MemoryRouter>
        <ListOverview />
      </MemoryRouter>,
    );

    const quickStart = screen.getByTestId("quick-start");
    const stats = screen.getByRole("group", {
      name: "Packing list statistics",
    });
    const expectedStats = [
      ["Packing lists", "0"],
      ["Completed", "0"],
      ["Items", "0"],
      ["Average packed", "0%"],
    ] as const;

    for (const [label, value] of expectedStats) {
      const term = within(stats).getByText(label, { selector: "dt" });
      expect(term.nextElementSibling).toHaveTextContent(new RegExp(`^${value}$`));
    }

    const collection = screen.getByRole("region", { name: "Packing lists" });
    const emptyState = within(collection).getByText("No packing lists found");
    expect(quickStart).toAppearBefore(stats);
    expect(stats).toAppearBefore(emptyState);
  });

  it("keeps search, sorting, layout, import, and create controls with the collection", () => {
    render(
      <MemoryRouter>
        <ListOverview />
      </MemoryRouter>,
    );

    const collection = screen.getByRole("region", { name: "Packing lists" });
    expect(
      within(collection).getByRole("searchbox", { name: "Search packing lists" }),
    ).toBeVisible();
    expect(within(collection).getByLabelText("Sort packing lists")).toBeVisible();
    expect(within(collection).getByRole("group", { name: "List layout" })).toBeVisible();
    expect(within(collection).getByRole("button", { name: "Import list" })).toBeVisible();
    expect(within(collection).getByRole("button", { name: "Create list" })).toBeVisible();
  });
});

describe("ListOverview pagination", () => {
  it("keeps older filtered matches reachable when the loaded page is empty", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ListOverview />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole("searchbox", { name: "Search packing lists" }),
      "Older completed match",
    );

    expect(screen.getByText("No packing lists found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load more/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.getByText("Older completed match")).toBeInTheDocument();
  });
});
