import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  inventoryItems: defineTable({
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unit: v.string(),
    quantity: v.number(),
    minimumQuantity: v.number(),
    location: v.string(),
    supplier: v.optional(v.string()),
    costPerUnit: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_category", ["category"])
    .index("by_updated_at", ["updatedAt"]),
  inventoryCategories: defineTable({
    name: v.string(),
    normalizedName: v.string(),
    sortOrder: v.number(),
  })
    .index("by_normalized_name", ["normalizedName"])
    .index("by_sort_order", ["sortOrder"]),
});import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const categoryValidator = v.union(
  v.literal("Wire & Cable"),
  v.literal("Connectors"),
  v.literal("Terminals & Crimps"),
  v.literal("Breakers & Fuses"),
  v.literal("Conduit & Fittings"),
  v.literal("Switches & Controls"),
  v.literal("Lighting"),
  v.literal("Other")
);

export default defineSchema({
  items: defineTable({
    ownerId: v.string(),
    commonName: v.string(),
    sku: v.string(),
    searchText: v.string(),
    category: categoryValidator,
    location: v.string(),
    quantity: v.number(),
    lowThreshold: v.number(),
    isLow: v.boolean(),
    imageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_and_category", ["ownerId", "category"])
    .index("by_ownerId_and_isLow", ["ownerId", "isLow"])
    .index("by_ownerId_and_category_and_isLow", ["ownerId", "category", "isLow"])
    .index("by_ownerId_and_sku", ["ownerId", "sku"])
    .searchIndex("search_searchText", {
      searchField: "searchText",
      filterFields: ["ownerId", "category", "isLow"],
    }),
  stockMovements: defineTable({
    ownerId: v.string(),
    itemId: v.id("items"),
    amount: v.number(),
    quantityAfter: v.number(),
    createdAt: v.number(),
  }).index("by_ownerId_and_itemId", ["ownerId", "itemId"]),
});
