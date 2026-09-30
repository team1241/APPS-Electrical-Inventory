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
});