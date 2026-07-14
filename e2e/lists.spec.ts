import type { Locator, Page } from "@playwright/test";

import { emptyListScenario } from "../src/test/mocks/runtime";
import { expect, gotoApp, test } from "./fixtures/convex";

function categoryCard(page: Page, name: string) {
  return page
    .locator("[data-category-header]", { hasText: name })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
}

function itemRow(category: Locator, name: string) {
  return category
    .locator("[data-item-primary]:visible", { hasText: name })
    .locator("..");
}

test("E2E-LIST-01 renders dashboard filters, search, sort, and layout state", async ({ page }) => {
  await gotoApp(page, "/");
  await expect(page.getByRole("heading", { level: 1, name: "My packing lists" })).toBeVisible();
  const listCardHeadings = page.locator('[data-slot="card"] h2');
  await expect(listCardHeadings).toHaveText(["City conference", "Alpine weekend"]);

  const sortLists = page.getByRole("combobox", { name: "Sort packing lists" });
  await sortLists.click();
  await page.getByRole("option", { name: "Name" }).click();
  await expect(listCardHeadings).toHaveText(["Alpine weekend", "City conference"]);

  await gotoApp(page, "/lists?status=completed");
  await expect(
    page.getByRole("heading", { level: 1, name: "My packing lists" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Completed lists" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Completed/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "City conference" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alpine weekend" })).toHaveCount(0);

  await page.getByPlaceholder("Search packing lists…").fill("missing route");
  await expect(page.getByRole("heading", { name: "No packing lists found" })).toBeVisible();
  await page.getByPlaceholder("Search packing lists…").fill("");
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("E2E-LIST-02 creates and edits a list through real pages", async ({ page }) => {
  await gotoApp(page, "/lists/new");
  const submit = page.getByRole("button", { name: "Create list" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("List name").fill("Coastal escape");
  await page.getByLabel("Description").fill("Wind and rain ready");
  await page.getByLabel("Tags").fill("coast");
  await page.getByRole("button", { name: "Add tag" }).click();
  await page.getByRole("button", { name: "coast ×" }).click();
  await page.getByLabel("Tags").fill("weather");
  await page.getByLabel("Tags").press("Enter");
  await submit.click();

  await expect(page).toHaveURL(/\/lists\/list_101$/);
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Coastal escape",
    }),
  ).toBeVisible();
  await expect(page.getByText("weather", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Edit list" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit list" })).toBeVisible();
  await page.getByLabel("List name").fill("Coastal escape revised");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/lists\/list_101$/);
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Coastal escape revised",
    }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-list-detail]")
      .getByText("Wind and rain ready", { exact: true })
      .first(),
  ).toBeVisible();
});

test.describe("empty list journey", () => {
  test.use({ scenario: emptyListScenario() });

  test("E2E-LIST-03 adds categories and items reactively", async ({ page }) => {
    await gotoApp(page, "/lists/list_alpine");
    await expect(page.getByText("Add a category to start organizing items.")).toBeVisible();

    for (const name of ["Clothing", "Documents"]) {
      await page.getByRole("button", { name: "Add category", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Add category" });
      await dialog.getByLabel("Category name").fill(name);
      await dialog.getByRole("button", { name: "Add category" }).click();
      await expect(categoryCard(page, name)).toBeVisible();
    }

    const clothing = categoryCard(page, "Clothing");
    await clothing.getByRole("button", { name: "Add first item" }).click();
    const itemDialog = page.getByRole("dialog", { name: "Add item" });
    await itemDialog.getByLabel("Name").fill("Rain shell");
    await itemDialog.getByLabel("Quantity").fill("2");
    await itemDialog.getByRole("button", { name: "Add item" }).click();
    await expect(clothing.getByRole("button", { name: "Rain shell", exact: true })).toBeVisible();

    const documents = categoryCard(page, "Documents");
    await documents.getByRole("button", { name: "Add first item" }).click();
    const documentDialog = page.getByRole("dialog", { name: "Add item" });
    await documentDialog.getByLabel("Name").fill("Ferry ticket");
    await documentDialog.getByRole("button", { name: "Add item" }).click();

    const detail = page.locator("[data-list-detail]");
    await expect(detail.getByText("Total items").locator("..")).toContainText("2");
    await expect(
      page.getByRole("progressbar", { name: "Packed against target" }),
    ).toHaveAttribute("aria-valuenow", "0");
  });
});

test("E2E-LIST-04 edits category and item fields and changes quantity", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine");

  const clothing = categoryCard(page, "Clothing");
  await clothing.getByRole("button", { name: "Rename category" }).click();
  const categoryName = page.locator("[data-category-header] input").first();
  await expect(categoryName).toBeFocused();
  await categoryName.fill("Outerwear");
  await page
    .getByRole("button", { name: "Save category name for Clothing" })
    .click();

  const outerwear = categoryCard(page, "Outerwear");
  await expect(outerwear).toBeVisible();
  const jacket = itemRow(outerwear, "Insulated jacket");
  await jacket.getByRole("button", { name: "Edit item" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit item" });
  await dialog.getByLabel("Name").fill("Storm jacket");
  await dialog.getByLabel("Description").fill("Weatherproof outer layer");
  await dialog.getByLabel("Quantity").fill("2");
  await dialog.getByLabel("Priority").click();
  await page.getByRole("option", { name: "High" }).click();
  await dialog.getByLabel("Weight").fill("1.4");
  await dialog.getByLabel("Notes").fill("Keep near the top of the bag");
  await dialog.getByRole("button", { name: "Update item" }).click();

  const updatedJacket = itemRow(outerwear, "Storm jacket");
  await expect(updatedJacket.getByText("Weatherproof outer layer")).toBeVisible();
  await expect(updatedJacket.getByText("high", { exact: true })).toBeVisible();
  await expect(updatedJacket.getByLabel("Quantity 2")).toBeVisible();

  await updatedJacket
    .getByRole("button", { name: "Increase quantity for Storm jacket" })
    .click();
  await expect(updatedJacket.getByLabel("Quantity 3")).toBeVisible();
  await updatedJacket
    .getByRole("button", { name: "Decrease quantity for Storm jacket" })
    .click();
  await expect(updatedJacket.getByLabel("Quantity 2")).toBeVisible();

  await updatedJacket.getByRole("button", { name: "Edit item" }).click();
  const preservedDialog = page.getByRole("dialog", { name: "Edit item" });
  await expect(preservedDialog.getByLabel("Description")).toHaveValue(
    "Weatherproof outer layer",
  );
  await expect(preservedDialog.getByLabel("Notes")).toHaveValue(
    "Keep near the top of the bag",
  );
  await expect(preservedDialog.getByLabel("Weight")).toHaveValue("1.4");
  await expect(preservedDialog.getByRole("combobox", { name: "Priority" })).toHaveText(
    "High",
  );
});

test("E2E-LIST-05 cancels and then confirms automatic completion", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine");
  await page.getByRole("checkbox", { name: "Mark Insulated jacket packed" }).click();
  await page.getByRole("checkbox", { name: "Mark Passport packed" }).click();

  const completion = page.getByRole("alertdialog", { name: "All items packed" });
  await expect(completion).toBeVisible();
  await completion.getByRole("button", { name: "Not yet" }).click();
  await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();

  await page.getByRole("checkbox", { name: "Mark Passport unpacked" }).click();
  await page.getByRole("checkbox", { name: "Mark Passport packed" }).click();
  await completion.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
});

test("E2E-LIST-06 reorders, moves, and deletes normalized records", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine");

  const categoryHeaders = page.locator("[data-category-header]");
  const categoryHandle = categoryHeaders
    .first()
    .locator('[aria-roledescription="sortable"]');
  await categoryHandle.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await categoryHandle.focus();
  await page.keyboard.press("Enter");
  await expect(categoryHandle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("status").filter({
      hasText: "moved over droppable area category_documents",
    }),
  ).toBeAttached();
  await page.keyboard.press("Enter");
  await expect(categoryHeaders.first()).toContainText("Documents");

  const clothing = categoryCard(page, "Clothing");
  const itemRows = clothing.locator("[data-item-primary]:visible");
  const itemHandle = itemRows
    .first()
    .locator('[aria-roledescription="sortable"]');
  await itemHandle.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await itemHandle.focus();
  await page.keyboard.press("Enter");
  await expect(itemHandle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("status").filter({
      hasText: "moved over droppable area item_socks",
    }),
  ).toBeAttached();
  await page.keyboard.press("Enter");
  await expect(itemRows.first()).toContainText("Wool socks");

  const jacketRow = itemRow(clothing, "Insulated jacket");
  await jacketRow.getByRole("button", { name: "Edit item" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit item" });
  await editDialog.getByLabel("Category").click();
  await page.getByRole("option", { name: "Documents" }).click();
  await editDialog.getByRole("button", { name: "Update item" }).click();
  await expect(
    categoryCard(page, "Documents").getByRole("button", {
      name: "Insulated jacket",
      exact: true,
    }),
  ).toBeVisible();

  const movedRow = itemRow(categoryCard(page, "Documents"), "Insulated jacket");
  await movedRow
    .getByRole("button", { name: "Delete Insulated jacket" })
    .click();
  await page
    .getByRole("alertdialog", { name: "Delete item" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText("Insulated jacket", { exact: true })).toHaveCount(0);

  const documents = categoryCard(page, "Documents");
  await documents.getByRole("button", { name: "Delete category" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete category" })
    .getByRole("button", { name: "Delete category" })
    .click();
  await expect(categoryCard(page, "Documents")).toHaveCount(0);

  await gotoApp(page, "/lists");
  const alpineCard = page.locator('[data-slot="card"]', { hasText: "Alpine weekend" });
  await alpineCard.getByRole("button", { name: "List actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete list" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("heading", { name: "Alpine weekend" })).toHaveCount(0);
});

test("E2E-LIST-07 maps a foreign-owner list to access denied", async ({ page }) => {
  await gotoApp(page, "/lists/list_foreign");
  await expect(page.getByRole("heading", { level: 1, name: "Access denied" })).toBeVisible();
  await expect(page.getByText("You do not have access to this list")).toBeVisible();
  await expect(page.locator("[data-list-detail]")).toHaveCount(0);
  await expect(page.getByText("Foreign private route", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Must never appear in another tenant's query", { exact: true }),
  ).toHaveCount(0);
});
