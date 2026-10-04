import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
};

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

export const list = query({
  args: {},
  returns: v.array(itemValidator),
  handler: async (ctx) => {
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_updated_at")
      .order("desc")
      .take(500);
    return items.map((item) => ({
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
      updatedAt: item.updatedAt,
    }));
  },
});

export const create = mutation({
  args: itemFields,
  returns: v.id("inventoryItems"),
  handler: async (ctx, args) => {
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
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("inventoryItems"), ...itemFields },
  returns: v.null(),
  handler: async (ctx, { id, ...args }) => {
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
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const adjustQuantity = mutation({
  args: { id: v.id("inventoryItems"), change: v.number() },
  returns: v.null(),
  handler: async (ctx, { id, change }) => {
    if (change === 0) throw new Error("Enter a non-zero stock adjustment.");
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inventory item not found.");
    const quantity = item.quantity + change;
    if (quantity < 0) throw new Error("Stock cannot fall below zero.");
    await ctx.db.patch(id, { quantity, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("inventoryItems") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});