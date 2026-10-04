/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import type { FunctionReturnType } from "convex/server";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const sample = {
	sku: " wire-01 ",
	name: "Copper wire",
	category: "Cable & Wire",
	unit: "m",
	quantity: 3.5,
	minimumQuantity: 2,
	location: "Bin A",
	supplier: "Supplier",
};
const page = { paginationOpts: { numItems: 100, cursor: null } };
function setup() {
	const t = convexTest(schema, modules);
	return {
		t,
		member: t.withIdentity({
			subject: "member-a",
			issuer: "https://test.clerk.accounts.dev",
		}),
	};
}

test("signed-out callers cannot read or change shared stock or categories", async () => {
	const { t, member } = setup();
	const id = await member.mutation(api.inventory.create, sample);
	const categoryId = await member.mutation(api.inventoryCategories.create, {
		name: "Test",
	});
	await expect(t.query(api.inventory.list, page)).rejects.toThrow("Sign in");
	await expect(t.mutation(api.inventory.create, sample)).rejects.toThrow(
		"Sign in",
	);
	await expect(
		t.mutation(api.inventory.update, { id, ...sample }),
	).rejects.toThrow("Sign in");
	await expect(
		t.mutation(api.inventory.adjustQuantity, { id, change: 1 }),
	).rejects.toThrow("Sign in");
	await expect(t.mutation(api.inventory.remove, { id })).rejects.toThrow(
		"Sign in",
	);
	await expect(t.query(api.inventoryCategories.list, {})).rejects.toThrow(
		"Sign in",
	);
	await expect(
		t.mutation(api.inventoryCategories.ensureDefaults, {}),
	).rejects.toThrow("Sign in");
	await expect(
		t.mutation(api.inventoryCategories.create, { name: "Unauthorized" }),
	).rejects.toThrow("Sign in");
	await expect(
		t.mutation(api.inventoryCategories.rename, {
			id: categoryId,
			name: "Unauthorized",
		}),
	).rejects.toThrow("Sign in");
	await expect(
		t.mutation(api.inventoryCategories.remove, { id: categoryId }),
	).rejects.toThrow("Sign in");
	await expect(t.mutation(api.inventoryCategories.setColor, { id: categoryId, color: "#3b6ca8" })).rejects.toThrow("Sign in");
});

test("members share inventory; editing can clear supplier; duplicate SKU is rejected", async () => {
	const { t, member } = setup();
	const id = await member.mutation(api.inventory.create, sample);
	const second = t.withIdentity({
		subject: "member-b",
		issuer: "https://test.clerk.accounts.dev",
	});
	expect((await second.query(api.inventory.list, page)).page[0]).toMatchObject({
		_id: id,
		sku: "WIRE-01",
		quantity: 3.5,
	});
	await expect(
		second.mutation(api.inventory.create, { ...sample, sku: "WIRE-01" }),
	).rejects.toThrow("already in use");
	await second.mutation(api.inventory.update, { ...sample, id, supplier: "" });
	expect(
		(await member.query(api.inventory.list, page)).page[0].supplier,
	).toBeUndefined();
	await second.mutation(api.inventory.remove, { id });
	expect((await member.query(api.inventory.list, page)).page).toHaveLength(0);
});

test("stock adjustments preserve fractional units and reject invalid quantities", async () => {
	const { member } = setup();
	const id = await member.mutation(api.inventory.create, sample);
	await member.mutation(api.inventory.adjustQuantity, { id, change: -0.5 });
	expect((await member.query(api.inventory.list, page)).page[0].quantity).toBe(
		3,
	);
	for (const change of [-4, Number.NaN, Number.POSITIVE_INFINITY, 0]) {
		await expect(
			member.mutation(api.inventory.adjustQuantity, { id, change }),
		).rejects.toThrow();
	}
	for (const quantity of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
		await expect(
			member.mutation(api.inventory.create, {
				...sample,
				sku: "INVALID",
				quantity,
			}),
		).rejects.toThrow();
		await expect(
			member.mutation(api.inventory.update, { ...sample, id, quantity }),
		).rejects.toThrow();
	}
	expect((await member.query(api.inventory.list, page)).page[0].quantity).toBe(
		3,
	);
});

test("pagination reaches supplies beyond the previous 500-item cutoff", async () => {
	const { t, member } = setup();
	await t.run(async (ctx) => {
		for (let i = 0; i < 505; i++)
			await ctx.db.insert("inventoryItems", {
				...sample,
				sku: `SKU-${i}`,
				updatedAt: i,
			});
	});
	let cursor: string | null = null;
	const ids = new Set<string>();
	for (;;) {
		const result: FunctionReturnType<typeof api.inventory.list> =
			await member.query(api.inventory.list, {
				paginationOpts: { numItems: 100, cursor },
			});
		for (const item of result.page) ids.add(item._id);
		if (result.isDone) break;
		cursor = result.continueCursor;
	}
	expect(ids.size).toBe(505);
});

test("category rename updates supplies, duplicate names and deleting used categories are rejected", async () => {
	const { member } = setup();
	await member.mutation(api.inventoryCategories.ensureDefaults, {});
	const categories = await member.query(api.inventoryCategories.list, {});
	await member.mutation(api.inventoryCategories.ensureDefaults, {});
	expect(await member.query(api.inventoryCategories.list, {})).toHaveLength(
		categories.length,
	);
	const category = categories.find((row) => row.name === sample.category);
	if (!category) throw new Error("Missing default category");
	const id = await member.mutation(api.inventory.create, sample);
	await expect(
		member.mutation(api.inventoryCategories.remove, { id: category._id }),
	).rejects.toThrow("Move supplies");
	await member.mutation(api.inventoryCategories.rename, {
		id: category._id,
		name: "Wire",
	});
	expect((await member.query(api.inventory.list, page)).page[0].category).toBe(
		"Wire",
	);
	await expect(
		member.mutation(api.inventoryCategories.create, { name: " wire " }),
	).rejects.toThrow("already exists");
	await member.mutation(api.inventory.remove, { id });
	await member.mutation(api.inventoryCategories.remove, { id: category._id });
	expect(
		(await member.query(api.inventoryCategories.list, {})).some(
			(row) => row.name === "Wire",
		),
	).toBe(false);
});
