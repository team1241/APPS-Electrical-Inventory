import { v } from "convex/values";
import {
	paginationOptsValidator,
	paginationResultValidator,
} from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

const weightUnitValidator = v.union(
	v.literal("g"),
	v.literal("kg"),
	v.literal("oz"),
	v.literal("lb"),
);
type WeightUnit = "g" | "kg" | "oz" | "lb";

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
	partWeight: v.optional(v.number()),
	emptyContainerWeight: v.optional(v.number()),
	weightUnit: v.optional(weightUnitValidator),
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
	partWeight: v.optional(v.union(v.number(), v.null())),
	emptyContainerWeight: v.optional(v.union(v.number(), v.null())),
	weightUnit: v.optional(weightUnitValidator),
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

function validateWeightSettings(args: {
	partWeight?: number | null;
	emptyContainerWeight?: number | null;
	weightUnit?: WeightUnit;
}): {
	partWeight: number | undefined;
	emptyContainerWeight: number | undefined;
	weightUnit: WeightUnit | undefined;
} {
	const partWeight = args.partWeight ?? undefined;
	const emptyContainerWeight = args.emptyContainerWeight ?? undefined;
	if (
		(partWeight === undefined) !== (emptyContainerWeight === undefined)
	) {
		throw new Error(
			"Enter both the weight per part and the empty container weight.",
		);
	}
	if (partWeight === undefined || emptyContainerWeight === undefined) {
		return {
			partWeight: undefined,
			emptyContainerWeight: undefined,
			weightUnit: undefined,
		};
	}
	if (
		!Number.isFinite(partWeight) ||
		partWeight <= 0 ||
		!Number.isFinite(emptyContainerWeight) ||
		emptyContainerWeight < 0
	) {
		throw new Error(
			"Part weight must be greater than zero and container weight cannot be negative.",
		);
	}
	if (!args.weightUnit) throw new Error("Choose a weight unit.");
	return {
		partWeight,
		emptyContainerWeight,
		weightUnit: args.weightUnit,
	};
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
				...(item.partWeight !== undefined
					? { partWeight: item.partWeight }
					: {}),
				...(item.emptyContainerWeight !== undefined
					? { emptyContainerWeight: item.emptyContainerWeight }
					: {}),
				...(item.weightUnit !== undefined
					? { weightUnit: item.weightUnit }
					: {}),
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

		const weights = validateWeightSettings(args);
		return await ctx.db.insert("inventoryItems", {
			...args,
			...weights,
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

		const weights = validateWeightSettings(args);
		await ctx.db.patch(id, {
			...args,
			...weights,
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

export const setQuantityFromWeight = mutation({
	args: { id: v.id("inventoryItems"), totalWeight: v.number() },
	returns: v.number(),
	handler: async (ctx, { id, totalWeight }) => {
		await requireIdentity(ctx);
		if (!Number.isFinite(totalWeight) || totalWeight < 0) {
			throw new Error("Enter a valid, non-negative measured weight.");
		}
		const item = await ctx.db.get(id);
		if (!item) throw new Error("Inventory item not found.");
		if (
			item.partWeight === undefined ||
			item.emptyContainerWeight === undefined ||
			item.weightUnit === undefined
		) {
			throw new Error("Add part and container weights before counting by weight.");
		}
		if (totalWeight < item.emptyContainerWeight) {
			throw new Error("Measured weight cannot be less than the empty container.");
		}
		const quantity = Math.round(
			(totalWeight - item.emptyContainerWeight) / item.partWeight,
		);
		if (!Number.isSafeInteger(quantity) || quantity < 0) {
			throw new Error("The calculated quantity is too large.");
		}
		await ctx.db.patch(id, { quantity, updatedAt: Date.now() });
		return quantity;
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
