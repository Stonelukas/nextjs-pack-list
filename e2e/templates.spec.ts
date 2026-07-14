import { expect, gotoApp, test } from "./fixtures/convex";

test("E2E-TPL-01 keeps template filters and URL state deterministic", async ({ page }) => {
  await gotoApp(page, "/templates");
  await expect(page.getByRole("heading", { level: 1, name: "Template library" })).toBeVisible();
  await expect(page.getByText("Weekend Getaway")).toBeVisible();
  await expect(page.getByText("Conference Kit")).toBeVisible();
  await expect(page.getByText("Hidden private expedition")).toHaveCount(0);

  await page.getByRole("button", { name: "My templates" }).click();
  await expect(page).toHaveURL(/\/templates\?filter=mine$/);
  await expect(page.getByText("Conference Kit")).toBeVisible();
  await expect(page.getByText("Weekend Getaway")).toHaveCount(0);

  await page.getByRole("button", { name: "Recent" }).click();
  await expect(page).toHaveURL(/\/templates\?filter=recent$/);
  await page.getByLabel("Search templates").fill("weekend");
  await page.getByLabel("Template category").click();
  await page.getByRole("option", { name: "travel" }).click();
  await page.getByLabel("Template difficulty").click();
  await page.getByRole("option", { name: "Advanced" }).click();
  await expect(page.getByRole("heading", { name: "No templates found" })).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.getByText("Weekend Getaway")).toBeVisible();
});

test("E2E-TPL-02 previews a template and restores trigger focus", async ({ page }) => {
  await gotoApp(page, "/templates");
  const card = page.locator('[data-slot="card"]', { hasText: "Weekend Getaway" });
  const trigger = card.getByRole("button", { name: "Preview" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Weekend Getaway" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("2 categories")).toBeVisible();
  await expect(dialog.getByText("T-shirts")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("E2E-TPL-03 applies a public template and clones its manifest", async ({ page }) => {
  await gotoApp(page, "/templates");
  const card = page.locator('[data-slot="card"]', { hasText: "Weekend Getaway" });
  await card.getByRole("button", { name: "Use template" }).click();
  await page.getByRole("dialog", { name: "Weekend Getaway" }).getByRole("button", { name: "Use template" }).click();

  const create = page.getByRole("dialog", { name: "Create list from template" });
  await create.getByLabel("List name").fill("Weekend in Porto");
  await create.getByRole("button", { name: "Create list" }).click();

  await expect(page).toHaveURL(/\/lists\/list_101$/);
  const detail = page.locator("[data-list-detail]");
  await expect(detail.getByRole("heading", { level: 1, name: "Weekend in Porto" })).toBeVisible();
  await expect(detail.getByText("Clothing", { exact: true })).toBeVisible();
  await expect(
    detail.locator('button:visible', { hasText: "Phone charger" }),
  ).toBeVisible();
});

test("E2E-TPL-04 saves a private template from a list", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine");
  const trigger = page.getByRole("button", { name: "Save as template" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Save list as template" });
  await dialog.getByLabel("Name").fill("Alpine private kit");
  await dialog.getByLabel("Description").fill("Reusable winter manifest");
  await expect(dialog.getByText("Private template")).toBeVisible();
  await dialog.getByRole("button", { name: "Save template" }).click();
  await expect(dialog).toHaveCount(0);

  await gotoApp(page, "/templates?filter=mine");
  await expect(page.getByText("Alpine private kit")).toBeVisible();
});
