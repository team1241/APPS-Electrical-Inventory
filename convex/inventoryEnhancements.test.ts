/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const page = { paginationOpts: { numItems: 100, cursor: null } };
const sample = {
  sku: "WIRE-01",
  name: "Copper wire",
  category: "Cable & Wire",
  unit: "m",
  quantity: 3.5,
  minimumQuantity: 2,
  location: "Bin A",
  supplier: "Supplier",
};

function member() {
  return convexTest(schema, modules).withIdentity({
    subject: "member-a",
    issuer: "https://test.clerk.accounts.dev",
  });
}

test("order URLs are optional, normalized, clearable, and limited to web URLs", async () => {
  const t = member();
  const id = await t.mutation(api.inventory.create, {
    ...sample,
    orderUrl: " https://example.com/parts/wire ",
  });
  expect((await t.query(api.inventory.list, page)).page[0].orderUrl).toBe(
    "https://example.com/parts/wire",
  );

  for (const orderUrl of [
    "javascript:alert(1)",
    "file:///tmp/file",
    "not-a-url",
    "https://user:password@example.com",
  ]) {
    await expect(
      t.mutation(api.inventory.update, { ...sample, id, orderUrl }),
    ).rejects.toThrow("Order URL");
  }

  await t.mutation(api.inventory.update, { ...sample, id, orderUrl: "" });
  expect((await t.query(api.inventory.list, page)).page[0].orderUrl).toBeUndefined();
});

test("category colors persist through rename and reject malformed colors", async () => {
  const t = member();
  const id = await t.mutation(api.inventoryCategories.create, {
    name: "Colored category",
  });
  await t.mutation(api.inventoryCategories.setColor, {
    id,
    color: "#AABBCC",
  });
  await t.mutation(api.inventoryCategories.rename, {
    id,
    name: "Renamed category",
  });
  expect((await t.query(api.inventoryCategories.list, {}))[0]).toMatchObject({
    color: "#aabbcc",
    name: "Renamed category",
  });
  await expect(
    t.mutation(api.inventoryCategories.setColor, {
      id,
      color: "red; color: blue",
    }),
  ).rejects.toThrow("valid");
});

test("stock changes preserve row order and pagination boundaries", async () => {
  const t = member();
  const first = await t.mutation(api.inventory.create, {
    ...sample,
    sku: "A-01",
  });
  const second = await t.mutation(api.inventory.create, {
    ...sample,
    sku: "B-01",
  });
  const before = await t.query(api.inventory.list, {
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(before.page[0]._id).toBe(first);

  await t.mutation(api.inventory.adjustQuantity, { id: second, change: 5 });
  await t.mutation(api.inventory.adjustQuantity, { id: first, change: -0.5 });

  const after = await t.query(api.inventory.list, {
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(after.page[0]._id).toBe(first);
  const next = await t.query(api.inventory.list, {
    paginationOpts: { numItems: 1, cursor: after.continueCursor },
  });
  expect(next.page[0]._id).toBe(second);
});
