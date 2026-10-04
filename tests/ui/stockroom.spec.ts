import { expect, test } from "@playwright/test";

test("inventory search, quick stock adjustment, and reorder view", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/ui/index.html");
  await expect(page.getByRole("heading", { name: "Inventory", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: "Receive one m of Copper wire" }).click();
  await expect(page.locator("tr", { hasText: "WIRE-01" }).locator(".current-stock strong")).toHaveText("4");
  await page.getByRole("searchbox").fill("Blade");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").clear();
  await page.getByRole("tab", { name: /Reorder list/ }).click();
  await expect(page.locator("tbody")).toContainText("Copper wire");
  await page.screenshot({ path: `test-results/stockroom-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("supply dialog adds and edits a supply", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  await page.getByRole("button", { name: "Add supply", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Item name").fill("Test connector");
  await dialog.getByLabel("SKU / part number").fill("TEST-01");
  await dialog.getByLabel("Quantity on hand").fill("8");
  await dialog.getByLabel("Storage location").fill("Test bin");
  await dialog.getByRole("button", { name: "Add to inventory" }).click();
  await expect(page.locator("tbody")).toContainText("Test connector");
  await page.getByRole("button", { name: "Edit Test connector", exact: true }).click();
  await dialog.getByLabel("Item name").fill("Updated connector");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("tbody")).toContainText("Updated connector");
});

test("category manager supports add, rename, and remove", async ({ page }, info) => {
  await page.goto("/tests/ui/index.html");
  await page.getByRole("button", { name: info.project.name === "mobile" ? "Manage categories" : "Manage supply categories", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("New category").fill("Test equipment");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  const row = dialog.locator(".category-manager-row", { hasText: "Test equipment" });
  await row.getByRole("button", { name: "Rename" }).click();
  await dialog.getByRole("textbox", { name: "Rename Test equipment" }).fill("Meters");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await dialog.getByRole("button", { name: "Remove Meters", exact: true }).click();
  await expect(dialog.getByText("Meters", { exact: true })).toHaveCount(0);
});

test("signed-out visitors cannot see stock", async ({ page }) => {
  await page.goto("/tests/ui/index.html?signedout");
  await expect(page.getByRole("button", { name: "Sign in to stockroom" })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
