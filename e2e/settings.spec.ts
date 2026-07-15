import {
  LEGACY_STORAGE_KEY,
  legacyZustandJson,
} from "../src/features/legacy-migration/__fixtures__/legacy-state";
import { expect, gotoApp, test } from "./fixtures/convex";

test("E2E-SET-01 applies theme immediately and restores supported preferences", async ({ page }) => {
  await gotoApp(page, "/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Settings sections" })).toBeVisible();

  await page.getByRole("tab", { name: "Appearance" }).click();
  await page.getByLabel("Theme").click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("tab", { name: "Preferences" }).click();
  await page.getByLabel("Default item priority").click();
  await page.getByRole("option", { name: "High" }).click();
  await expect(page.getByRole("switch", { name: "Auto-save" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Preferences saved")).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("tab", { name: "Preferences" }).click();
  await expect(page.getByLabel("Default item priority")).toContainText("High");
  await expect(page.getByRole("switch", { name: "Auto-save" })).toHaveCount(0);
});

test("E2E-SET-02 downloads only owner-scoped account data", async ({ page }) => {
  await page.clock.install({ time: new Date("2025-01-15T12:00:00.000Z") });
  await gotoApp(page, "/settings");
  await page.getByRole("tab", { name: "Data" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("route-ledger-export-2025-01-15.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    lists: Array<{ _id: string }>;
    templates: Array<{ _id: string }>;
  };

  expect(payload.lists.map((list) => list._id)).toEqual([
    "list_alpine",
    "list_completed",
  ]);
  expect(payload.templates.map((template) => template._id)).toEqual([
    "template_conference",
  ]);
  expect(payload.templates.map((template) => template._id)).not.toContain(
    "template_weekend",
  );
});

test("E2E-SET-03 imports a valid JSON file and redirects", async ({ page }) => {
  await gotoApp(page, "/settings");
  await page.getByRole("tab", { name: "Data" }).click();
  await page.getByRole("button", { name: "Import list" }).click();
  const dialog = page.getByRole("dialog", { name: "Import packing list" });
  const payload = {
    version: 1,
    list: {
      name: "Imported coast route",
      description: "Created in Playwright",
      tags: ["imported"],
    },
    categories: [
      {
        name: "Documents",
        items: [
          {
            name: "Boarding pass",
            quantity: 1,
            priority: "essential",
            packed: false,
          },
        ],
      },
    ],
  };
  await dialog.getByLabel("JSON file").setInputFiles({
    name: "imported-list.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  await dialog.getByRole("button", { name: "Import list" }).click();

  await expect(page).toHaveURL(/\/lists\/list_101$/);
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Imported coast route",
    }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-list-detail]")
      .getByRole("button", { name: "Boarding pass", exact: true }),
  ).toBeVisible();
});

test("E2E-SET-04 imports legacy data once and deletes only the source", async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: LEGACY_STORAGE_KEY, value: legacyZustandJson },
  );
  await gotoApp(page, "/settings");
  await page.getByRole("tab", { name: "Legacy migration" }).click();
  await expect(page.getByText("1 list and 1 template can be imported.")).toBeVisible();
  await page.getByRole("button", { name: "Review legacy import" }).click();
  const dialog = page.getByRole("dialog", { name: "Review legacy browser data" });
  await expect(dialog.getByText(/4 rejected records/)).toBeVisible();
  const importButton = dialog.getByRole("button", { name: "Import legacy data" });
  await expect(importButton).toBeDisabled();
  await dialog
    .getByRole("checkbox", {
      name: /reviewed the preview and recovery options/i,
    })
    .click();
  await importButton.click();
  await expect(page.getByText("Legacy data imported successfully.")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Legacy migration" }).click();
  await expect(page.getByText("This legacy data was already imported.")).toBeVisible();
  await page.getByRole("button", { name: "Delete legacy source data" }).click();
  const storage = await page.evaluate(
    ({ sourceKey, archiveKey }) => ({
      source: window.localStorage.getItem(sourceKey),
      archive: window.localStorage.getItem(archiveKey),
    }),
    {
      sourceKey: LEGACY_STORAGE_KEY,
      archiveKey: "pack-list-storage:legacy-import:v1",
    },
  );
  expect(storage.source).toBeNull();
  expect(storage.archive).not.toBeNull();
});
