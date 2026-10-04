import { v } from "convex/values";
import {
	paginationOptsValidator,
	paginationResultValidator,
} from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

const itemValidator = v.object({
	_id: v.id("inventoryItems"),
	_creationTime: v.number(),
	sku: v.string(),
	name: v.string(),
	category: v.string(),
	unit: v.string(),
	quantity: v.number(),
	minimumQuantity: v.number(),
	location: v.string(),
	supplier: v.optional(v.string()),
	orderUrl: v.optional(v.string()),
	imageUrl: v.union(v.string(), v.null()),
	updatedAt: v.number(),
});

const itemFields = {
	sku: v.string(),
	name: v.string(),
	category: v.string(),
	unit: v.string(),
	quantity: v.number(),
	minimumQuantity: v.number(),
	location: v.string(),
	supplier: v.optional(v.string()),
	orderUrl: v.optional(v.string()),
};

function normalizeSku(sku: string) {
	return sku.trim().toUpperCase();
}

function normalizeOrderUrl(value: string | undefined) {
  const url = value?.trim();
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    return parsed.href;
  } catch {
    throw new Error("Order URL must be a valid http:// or https:// link.");
  }
}

function validateItem(args: {
	quantity: number;
	minimumQuantity: number;
	name: string;
	category: string;
	unit: string;
	location: string;
}) {
	if (
		!args.name.trim() ||
		!args.category.trim() ||
		!args.unit.trim() ||
		!args.location.trim()
	) {
		throw new Error("Name, category, unit, and location are required.");
	}
	if (
		![args.quantity, args.minimumQuantity].every(
			(value) =>
				Number.isFinite(value) &&
				value >= 0 &&
				value <= Number.MAX_SAFE_INTEGER,
		)
	) {
		throw new Error("Stock quantities must be finite, non-negative numbers.");
	}
}

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(itemValidator),
	handler: async (ctx, args) => {
		await requireIdentity(ctx);
		const items = await ctx.db
			.query("inventoryItems")
			.withIndex("by_sku")
			.order("asc")
			.paginate(args.paginationOpts);
		return {
			...items,
			page: await Promise.all(items.page.map(async (item) => ({
				_id: item._id,
				_creationTime: item._creationTime,
				sku: item.sku,
				name: item.name,
				category: item.category,
				unit: item.unit,
				quantity: item.quantity,
				minimumQuantity: item.minimumQuantity,
				location: item.location,
				...(item.supplier !== undefined ? { supplier: item.supplier } : {}),
				...(item.orderUrl !== undefined ? { orderUrl: item.orderUrl } : {}),
				imageUrl: item.imageId ? await ctx.storage.getUrl(item.imageId) : null,
				updatedAt: item.updatedAt,
			}))),
		};
	},
});

export const create = mutation({
	args: itemFields,
	returns: v.id("inventoryItems"),
	handler: async (ctx, args) => {
		await requireIdentity(ctx);
		validateItem(args);
		const sku = normalizeSku(args.sku);
		if (!sku) throw new Error("SKU is required.");
		if (!args.name.trim()) throw new Error("Item name is required.");
		if (args.quantity < 0 || args.minimumQuantity < 0) {
			throw new Error("Stock quantities cannot be negative.");
		}

		const existing = await ctx.db
			.query("inventoryItems")
			.withIndex("by_sku", (q) => q.eq("sku", sku))
			.first();
		if (existing) throw new Error("That SKU is already in use.");

		return await ctx.db.insert("inventoryItems", {
			...args,
			sku,
			name: args.name.trim(),
			category: args.category.trim(),
			unit: args.unit.trim(),
			location: args.location.trim(),
			supplier: args.supplier?.trim() || undefined,
			orderUrl: normalizeOrderUrl(args.orderUrl),
			updatedAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: { id: v.id("inventoryItems"), ...itemFields },
	returns: v.null(),
	handler: async (ctx, { id, ...args }) => {
		await requireIdentity(ctx);
		validateItem(args);
		const item = await ctx.db.get(id);
		if (!item) throw new Error("Inventory item not found.");
		const sku = normalizeSku(args.sku);
		if (!sku) throw new Error("SKU is required.");
		if (!args.name.trim()) throw new Error("Item name is required.");
		if (args.quantity < 0 || args.minimumQuantity < 0) {
			throw new Error("Stock quantities cannot be negative.");
		}

		const duplicate = await ctx.db
			.query("inventoryItems")
			.withIndex("by_sku", (q) => q.eq("sku", sku))
			.first();
		if (duplicate && duplicate._id !== id) {
			throw new Error("That SKU is already in use.");
		}

		await ctx.db.patch(id, {
			...args,
			sku,
			name: args.name.trim(),
			category: args.category.trim(),
			unit: args.unit.trim(),
			location: args.location.trim(),
			supplier: args.supplier?.trim() || undefined,
			orderUrl: normalizeOrderUrl(args.orderUrl),
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const adjustQuantity = mutation({
	args: { id: v.id("inventoryItems"), change: v.number() },
	returns: v.null(),
	handler: async (ctx, { id, change }) => {
		await requireIdentity(ctx);
		if (!Number.isFinite(change))
			throw new Error("Enter a finite stock adjustment.");
		if (change === 0) throw new Error("Enter a non-zero stock adjustment.");
		const item = await ctx.db.get(id);
		if (!item) throw new Error("Inventory item not found.");
		const quantity = item.quantity + change;
		if (
			!Number.isFinite(quantity) ||
			quantity < 0 ||
			quantity > Number.MAX_SAFE_INTEGER
		)
			throw new Error("Stock must remain a finite, non-negative quantity.");
		await ctx.db.patch(id, { quantity, updatedAt: Date.now() });
		return null;
	},
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setImage = mutation({
  args: { id: v.id("inventoryItems"), imageId: v.union(v.id("_storage"), v.null()) },
  returns: v.null(),
  handler: async (ctx, { id, imageId }) => {
    await requireIdentity(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inventory item not found.");
    if (imageId && !(await ctx.db.system.get(imageId))) throw new Error("Uploaded image not found.");
    if (item.imageId && item.imageId !== imageId) await ctx.storage.delete(item.imageId);
    await ctx.db.patch(id, { imageId: imageId ?? undefined, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
	args: { id: v.id("inventoryItems") },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		await requireIdentity(ctx);
		await ctx.db.delete(id);
		return null;
	},
});
