import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAppRoute } from "@/test/render";
import {
  adminScenario,
  regularUserScenario,
  signedOutScenario,
} from "@/test/mocks/runtime";

describe("Task 10 real-route component journeys", () => {
  it("AJ-01 returns a signed-out user to the complete protected URL", async () => {
    const { router, user } = renderAppRoute({
      initialUrl: "/lists/list_alpine?status=active#manifest",
      scenario: signedOutScenario(),
    });

    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Sign in" },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sign-in");
    expect(router.state.location.search).toBe(
      "?redirect_url=%2Flists%2Flist_alpine%3Fstatus%3Dactive%23manifest",
    );
    expect(screen.queryByRole("heading", { name: "Alpine weekend" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue as test user" }));

    const alpineDetail = await waitFor(() => {
      const value = document.querySelector<HTMLElement>("[data-list-detail]");
      expect(value).not.toBeNull();
      return value!;
    });
    expect(
      within(alpineDetail).getByRole("heading", { level: 1, name: "Alpine weekend" }),
    ).toBeInTheDocument();
    expect(`${router.state.location.pathname}${router.state.location.search}${router.state.location.hash}`).toBe(
      "/lists/list_alpine?status=active#manifest",
    );
  }, 10_000);

  it("AJ-02 creates a list through the real page and redirects", async () => {
    const { router, user } = renderAppRoute({
      initialUrl: "/lists/new",
      scenario: regularUserScenario(),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Create new list" }),
    ).toBeInTheDocument();
    const create = screen.getByRole("button", { name: "Create list" });
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText("List name"), "Coastal escape");
    await user.type(screen.getByLabelText("Description"), "Wind and rain ready");
    await user.type(screen.getByLabelText("Tags"), "coast");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.click(screen.getByRole("button", { name: "coast ×" }));
    await user.type(screen.getByLabelText("Tags"), "weather");
    await user.keyboard("{Enter}");
    await user.click(create);

    const createdDetail = await waitFor(() => {
      const value = document.querySelector<HTMLElement>("[data-list-detail]");
      expect(value).not.toBeNull();
      return value!;
    });
    expect(
      within(createdDetail).getByRole("heading", { level: 1, name: "Coastal escape" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/lists/list_101");
    expect(screen.getByText("weather")).toBeInTheDocument();
  });

  it("AJ-03 edits a list and renders the updated reactive value", async () => {
    const { router, user } = renderAppRoute({
      initialUrl: "/lists/list_alpine/edit",
      scenario: regularUserScenario(),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit list" }),
    ).toBeInTheDocument();
    const name = screen.getByLabelText("List name");
    await user.clear(name);
    await user.type(name, "Alpine weekend revised");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const updatedDetail = await waitFor(() => {
      const value = document.querySelector<HTMLElement>("[data-list-detail]");
      expect(value).not.toBeNull();
      return value!;
    });
    expect(
      within(updatedDetail).getByRole("heading", {
        level: 1,
        name: "Alpine weekend revised",
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/lists/list_alpine");
  });

  it("AJ-04 propagates an item mutation through the real hook and page", async () => {
    const { user } = renderAppRoute({
      initialUrl: "/lists/list_alpine",
      scenario: regularUserScenario(),
    });

    const alpineDetail = await waitFor(() => {
      const value = document.querySelector<HTMLElement>("[data-list-detail]");
      expect(value).not.toBeNull();
      return value!;
    });
    expect(
      within(alpineDetail).getByRole("heading", { level: 1, name: "Alpine weekend" }),
    ).toBeInTheDocument();
    const packedSummary = within(alpineDetail).getByText("Packed").closest("div");
    expect(packedSummary).toHaveTextContent("2");

    await user.click(
      screen.getAllByRole("checkbox", {
        name: "Mark Insulated jacket packed",
      })[0],
    );

    expect(
      screen.getAllByRole("checkbox", {
        name: "Mark Insulated jacket unpacked",
      })[0],
    ).toBeChecked();
    expect(packedSummary).toHaveTextContent("3");
  });

  it("AJ-05 synchronizes the owned-template filter with the URL", async () => {
    const { router, user } = renderAppRoute({
      initialUrl: "/templates",
      scenario: regularUserScenario(),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Template library" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Weekend Getaway")).toBeInTheDocument();
    expect(screen.getByText("Conference Kit")).toBeInTheDocument();
    expect(screen.queryByText("Hidden private expedition")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "My templates" }));

    expect(router.state.location.search).toBe("?filter=mine");
    expect(screen.queryByText("Weekend Getaway")).not.toBeInTheDocument();
    expect(screen.getByText("Conference Kit")).toBeInTheDocument();
  });

  it("AJ-06 applies theme immediately and saves the supported preference object", async () => {
    const { runtime, user } = renderAppRoute({
      initialUrl: "/settings",
      scenario: regularUserScenario(),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Settings" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Appearance" }));
    await user.click(screen.getByLabelText("Theme"));
    await user.click(await screen.findByRole("option", { name: "Dark" }));
    expect(document.documentElement).toHaveClass("dark");

    await user.click(screen.getByRole("tab", { name: "Preferences" }));
    await user.click(screen.getByLabelText("Default item priority"));
    await user.click(await screen.findByRole("option", { name: "High" }));
    expect(screen.queryByRole("switch", { name: "Auto-save" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() => {
      const currentUser = runtime.query("users:getCurrentUser", {}) as {
        preferences: unknown;
      };
      expect(currentUser.preferences).toEqual({
        theme: "dark",
        defaultPriority: "high",
        autoSave: true,
      });
    });
  });

  it("AJ-07 separates signed-in identity from server-confirmed admin access", async () => {
    const regular = renderAppRoute({
      initialUrl: "/admin",
      scenario: regularUserScenario(),
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Administrator access required",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin dashboard" })).not.toBeInTheDocument();
    regular.unmount();

    renderAppRoute({ initialUrl: "/admin", scenario: adminScenario() });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Admin dashboard" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("tablist", { name: "Administration sections" })).getByRole(
        "tab",
        { name: "Overview" },
      ),
    ).toHaveAttribute("aria-selected", "true");
  });
});
