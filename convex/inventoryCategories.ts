import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const defaultCategories = [
  "Cable & Wire",
  "Conduit & Fittings",
  "Circuit Protection",
  "Switches & Outlets",
  "Lighting",
  "Tools & PPE",
  "Other",
];

const categoryValidator = v.object({
  _id: v.id("inventoryCategories"),
  _creationTime: v.number(),
  name: v.string(),
  normalizedName: v.string(),
  sortOrder: v.number(),
});

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export const list = query({
  args: {},
  returns: v.array(categoryValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("inventoryCategories")
      .withIndex("by_sort_order")
      .take(100);
  },
});

export const ensureDefaults = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existingCategories = await ctx.db
      .query("inventoryCategories")
      .withIndex("by_sort_order")
      .take(100);
    if (existingCategories.length > 0) return null;

    const existingItems = await ctx.db
      .query("inventoryItems")
      .withIndex("by_updated_at")
      .order("desc")
      .take(500);
    const names = [...new Set([...defaultCategories, ...existingItems.map((item) => item.category)])];
    for (const [sortOrder, name] of names.entries()) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;
      await ctx.db.insert("inventoryCategories", {
        name: trimmedName,
        normalizedName: normalizeName(trimmedName),
        sortOrder,
      });
    }
    return null;
  },
});

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("inventoryCategories"),
  handler: async (ctx, { name }) => {
    const trimmedName = name.trim();
    const normalizedName = normalizeName(trimmedName);
    if (!trimmedName || trimmedName.length > 40) {
      throw new Error("Category names must be 1 to 40 characters long.");
    }
    const duplicate = await ctx.db
      .query("inventoryCategories")
      .withIndex("by_normalized_name", (q) => q.eq("normalizedName", normalizedName))
      .first();
    if (duplicate) throw new Error("That category already exists.");

    const lastCategory = await ctx.db
      .query("inventoryCategories")
      .withIndex("by_sort_order")
      .order("desc")
      .first();
    return await ctx.db.insert("inventoryCategories", {
      name: trimmedName,
      normalizedName,
      sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
    });
  },
});

export const rename = mutation({
  args: { id: v.id("inventoryCategories"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, name }) => {
    const category = await ctx.db.get(id);
    if (!category) throw new Error("Category not found.");
    const trimmedName = name.trim();
    const normalizedName = normalizeName(trimmedName);
    if (!trimmedName || trimmedName.length > 40) {
      throw new Error("Category names must be 1 to 40 characters long.");
    }
    const duplicate = await ctx.db
      .query("inventoryCategories")
      .withIndex("by_normalized_name", (q) => q.eq("normalizedName", normalizedName))
      .first();
    if (duplicate && duplicate._id !== id) {
      throw new Error("That category already exists.");
    }

    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_category", (q) => q.eq("category", category.name))
      .take(201);
    if (items.length > 200) {
      throw new Error("This category has more than 200 supplies. Split the rename into smaller groups first.");
    }

    for (const item of items) {
      await ctx.db.patch(item._id, { category: trimmedName, updatedAt: Date.now() });
    }
    await ctx.db.patch(id, { name: trimmedName, normalizedName });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("inventoryCategories") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const category = await ctx.db.get(id);
    if (!category) return null;
    const item = await ctx.db
      .query("inventoryItems")
      .withIndex("by_category", (q) => q.eq("category", category.name))
      .first();
    if (item) throw new Error("Move supplies to another category before removing this one.");
    await ctx.db.delete(id);
    return null;
  },
});