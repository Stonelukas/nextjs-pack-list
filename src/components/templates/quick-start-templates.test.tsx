// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplates: () => ({
    applyTemplate: vi.fn(),
    publicTemplates: [
      {
        _id: "template-1",
        _creationTime: 1,
        name: "Weekend",
        description: "Short trip",
        isPublic: true,
        categoryCount: 0,
        itemCount: 0,
      },
    ],
  }),
  useTemplateDetail: (templateId: string | null | undefined) => ({
    template: templateId
      ? {
          _id: templateId,
          _creationTime: 1,
          name: "Weekend",
          description: "Short trip",
          isPublic: true,
          categoryCount: 0,
          itemCount: 0,
          categories: [],
        }
      : undefined,
    loading: false,
  }),
}));
vi.mock("./template-previewer", () => ({
  TemplatePreviewer: ({ template }: { template: { name: string } | null }) =>
    template ? <p>Previewing {template.name}</p> : null,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { QuickStartTemplates } from "./quick-start-templates";

afterEach(cleanup);

describe("QuickStartTemplates", () => {
  it("opens a template preview through the card's native button", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <QuickStartTemplates />
      </MemoryRouter>,
    );

    const previewButton = screen.getByRole("button", { name: "Preview Weekend template" });
    previewButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("Previewing Weekend")).toBeInTheDocument();
  });
});
