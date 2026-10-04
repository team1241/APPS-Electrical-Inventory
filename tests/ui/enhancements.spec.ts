import { expect, test } from "@playwright/test";

test("kiosk layout and size persist, with inline custom stock controls", async ({ page }, info) => {
  await page.goto("/tests/ui/index.html");
  const toggle = page.getByRole("switch", { name: "Kiosk mode" });
  await toggle.click();
  const card = page.getByRole("article", { name: "Copper wire", exact: true });
  await expect(card).toBeVisible();

  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".kiosk-grid")).toHaveClass(/kiosk-list/);
  await page.getByRole("button", { name: "Large", exact: true }).click();
  await expect(page.locator(".stockroom-shell")).toHaveClass(/kiosk-size-large/);
  expect((await card.locator(".kiosk-item-title").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))).toBeGreaterThanOrEqual(30);
  expect((await card.getByRole("button", { name: "Receive one m of Copper wire" }).boundingBox())!.height).toBeGreaterThanOrEqual(58);

  const amount = card.getByRole("spinbutton", { name: "Custom amount for Copper wire" });
  await amount.fill("5");
  await card.getByRole("button", { name: "Add custom amount to Copper wire" }).click();
  await expect(card.locator(".current-stock strong")).toHaveText("8");
  await amount.fill("20");
  await expect(card.getByRole("button", { name: "Remove custom amount from Copper wire" })).toBeDisabled();
  await amount.fill("2.5");
  await card.getByRole("button", { name: "Remove custom amount from Copper wire" }).click();
  await expect(card.locator(".current-stock strong")).toHaveText("5.5");

  await page.screenshot({ path: `test-results/kiosk-${info.project.name}.png`, fullPage: true });
  await page.reload();
  await expect(toggle).toBeChecked();
  await expect(page.getByRole("button", { name: "List", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Large", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("stock refreshes keep table rows mounted and stationary", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  const row = page.locator("tbody tr", { hasText: "WIRE-01" });
  const original = await row.elementHandle();
  const tableTop = (await page.getByRole("table").boundingBox())!.y;
  await row.getByRole("button", { name: "Receive one m of Copper wire" }).click();
  await expect(row.locator(".current-stock strong")).toHaveText("4");
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  expect((await page.getByRole("table").boundingBox())!.y).toBe(tableTop);
});

test("optional order URL can be added and cleared", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  await page.getByRole("button", { name: "Edit Copper wire", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Order URL/).fill("https://example.com/wire");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("link", { name: "Order Copper wire", exact: true })).toHaveAttribute("href", "https://example.com/wire");
  await page.getByRole("button", { name: "Edit Copper wire", exact: true }).click();
  await dialog.getByLabel(/Order URL/).clear();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("link", { name: "Order Copper wire", exact: true })).toHaveCount(0);
});

test("an optional supply photo can be uploaded and removed", async ({ page }) => {
  await page.route("**/mock-upload", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ storageId: "storage-test" }) });
  });
  await page.goto("/tests/ui/index.html");
  await page.getByRole("button", { name: "Edit Copper wire", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="file"]').setInputFiles({ name: "wire.png", mimeType: "image/png", buffer: Buffer.from("test image") });
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("tbody tr", { hasText: "WIRE-01" }).locator(".supply-photo")).toBeVisible();
  await page.getByRole("button", { name: "Edit Copper wire", exact: true }).click();
  await dialog.getByRole("button", { name: "Remove photo" }).click();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("tbody tr", { hasText: "WIRE-01" }).locator(".supply-photo")).toHaveCount(0);
});

test("category palette and custom colors update accents", async ({ page }, info) => {
  await page.goto("/tests/ui/index.html");
  await page.getByRole("button", { name: info.project.name === "mobile" ? "Manage categories" : "Manage supply categories", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const trigger = dialog.getByRole("button", { name: "Change color for Cable & Wire" });
  await trigger.click();
  await dialog.getByRole("button", { name: "Teal", exact: true }).click();
  await expect(trigger).toHaveCSS("background-color", "rgb(46, 125, 117)");
  await dialog.getByRole("textbox", { name: "Hex color for Cable & Wire" }).fill("#9c4c79");
  await dialog.getByRole("button", { name: "Apply color" }).click();
  await expect(trigger).toHaveCSS("background-color", "rgb(156, 76, 121)");
});

test("non-circular controls use the shared corner radius", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  const radii = await page.locator(".search-field, .inventory-tabs, .table-frame, .primary-button").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).borderRadius));
  expect(new Set(radii)).toEqual(new Set(["6px"]));
});

test("cursor light stays on the hovered item and clears over page background", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  const item = page.locator("tbody tr", { hasText: "WIRE-01" }).locator(".item-edit-target");
  await item.hover();
  await expect(item).toHaveClass(/cursor-glow-target/);
  expect(await item.evaluate((element) => getComputedStyle(element, "::after").position)).toBe("absolute");
  await page.screenshot({ path: "test-results/cursor-glow-contained.png" });
  await page.mouse.move(1, 900);
  await expect(page.locator(".cursor-glow-target")).toHaveCount(0);
  await expect(page.locator(".cursor-glow")).toHaveCount(0);
});

test("dropdowns match the theme and the full header logo is visible", async ({ page }) => {
  await page.goto("/tests/ui/index.html");
  const categorySelect = page.locator(".mobile-filters select").first();
  await expect(categorySelect).toHaveCSS("border-radius", "6px");
  await expect(categorySelect).toHaveCSS("color", "rgb(47, 67, 90)");
  expect(await categorySelect.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe("none");

  const logo = page.locator(".brand-mark");
  await expect(logo).toBeVisible();
  await expect(logo).toHaveCSS("object-fit", "contain");
  const logoBox = await logo.boundingBox();
  expect(logoBox?.width).toBe(48);
  expect(logoBox?.height).toBe(48);
});
