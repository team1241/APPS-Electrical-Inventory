import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { categoryValidator } from "./schema";

const itemResult = v.object({
  _id: v.id("items"),
  _creationTime: v.number(),
  commonName: v.string(),
  sku: v.string(),
  category: categoryValidator,
  location: v.string(),
  quantity: v.number(),
  lowThreshold: v.number(),
  isLow: v.boolean(),
  imageUrl: v.union(v.string(), v.null()),
  updatedAt: v.number(),
});

function wholeNumber(value: number, label: string, allowZero = true) {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`${label} must be ${allowZero ? "zero or a positive" : "a positive"} whole number.`);
  }
}

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(categoryValidator),
    lowOnly: v.boolean(),
    search: v.string(),
  },
  returns: paginationResultValidator(itemResult),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to view inventory.");
    const ownerId = identity.tokenIdentifier;
    const search = args.search.trim();

    const result = search
      ? await ctx.db
          .query("items")
          .withSearchIndex("search_searchText", (q) => {
            let range = q.search("searchText", search).eq("ownerId", ownerId);
            if (args.category) range = range.eq("category", args.category);
            if (args.lowOnly) range = range.eq("isLow", true);
            return range;
          })
          .paginate(args.paginationOpts)
      : args.category && args.lowOnly
        ? await ctx.db
            .query("items")
            .withIndex("by_ownerId_and_category_and_isLow", (q) =>
              q.eq("ownerId", ownerId).eq("category", args.category!).eq("isLow", true)
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : args.category
          ? await ctx.db
              .query("items")
              .withIndex("by_ownerId_and_category", (q) =>
                q.eq("ownerId", ownerId).eq("category", args.category!)
              )
              .order("desc")
              .paginate(args.paginationOpts)
          : args.lowOnly
            ? await ctx.db
                .query("items")
                .withIndex("by_ownerId_and_isLow", (q) =>
                  q.eq("ownerId", ownerId).eq("isLow", true)
                )
                .order("desc")
                .paginate(args.paginationOpts)
            : await ctx.db
                .query("items")
                .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
                .order("desc")
                .paginate(args.paginationOpts);

    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (item) => ({
          _id: item._id,
          _creationTime: item._creationTime,
          commonName: item.commonName,
          sku: item.sku,
          category: item.category,
          location: item.location,
          quantity: item.quantity,
          lowThreshold: item.lowThreshold,
          isLow: item.isLow,
          imageUrl: item.imageId ? await ctx.storage.getUrl(item.imageId) : null,
          updatedAt: item.updatedAt,
        }))
      ),
    };
  },
});

export const lowPreview = query({
  args: {},
  returns: v.array(itemResult),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to view inventory.");
    const items = await ctx.db
      .query("items")
      .withIndex("by_ownerId_and_isLow", (q) =>
        q.eq("ownerId", identity.tokenIdentifier).eq("isLow", true)
      )
      .order("desc")
      .take(5);
    return await Promise.all(
      items.map(async (item) => ({
        _id: item._id,
        _creationTime: item._creationTime,
        commonName: item.commonName,
        sku: item.sku,
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        lowThreshold: item.lowThreshold,
        isLow: item.isLow,
        imageUrl: item.imageId ? await ctx.storage.getUrl(item.imageId) : null,
        updatedAt: item.updatedAt,
      }))
    );
  },
});

export const create = mutation({
  args: {
    commonName: v.string(),
    sku: v.string(),
    category: categoryValidator,
    location: v.string(),
    quantity: v.number(),
    lowThreshold: v.number(),
    imageId: v.optional(v.id("_storage")),
  },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to add inventory.");
    const commonName = args.commonName.trim();
    const sku = args.sku.trim();
    const location = args.location.trim();
    if (!commonName || !sku || !location) {
      throw new Error("Name, SKU or part number, and location are required.");
    }
    wholeNumber(args.quantity, "Quantity");
    wholeNumber(args.lowThreshold, "Low-stock threshold");
    const existing = await ctx.db
      .query("items")
      .withIndex("by_ownerId_and_sku", (q) =>
        q.eq("ownerId", identity.tokenIdentifier).eq("sku", sku)
      )
      .unique();
    if (existing) throw new Error("An item with that SKU or part number already exists.");
    if (args.imageId && !(await ctx.db.system.get("_storage", args.imageId))) {
      throw new Error("The uploaded image could not be found.");
    }
    const now = Date.now();
    const itemId = await ctx.db.insert("items", {
      ownerId: identity.tokenIdentifier,
      commonName,
      sku,
      searchText: `${commonName} ${sku}`,
      category: args.category,
      location,
      quantity: args.quantity,
      lowThreshold: args.lowThreshold,
      isLow: args.quantity <= args.lowThreshold,
      imageId: args.imageId,
      updatedAt: now,
    });
    if (args.quantity > 0) {
      await ctx.db.insert("stockMovements", {
        ownerId: identity.tokenIdentifier,
        itemId,
        amount: args.quantity,
        quantityAfter: args.quantity,
        createdAt: now,
      });
    }
    return itemId;
  },
});

export const adjustStock = mutation({
  args: {
    itemId: v.id("items"),
    amount: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to adjust stock.");
    if (!Number.isSafeInteger(args.amount) || args.amount === 0) {
      throw new Error("Enter a nonzero whole-number adjustment.");
    }
    const item = await ctx.db.get("items", args.itemId);
    if (!item || item.ownerId !== identity.tokenIdentifier) {
      throw new Error("Item not found.");
    }
    const quantity = item.quantity + args.amount;
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error("There is not enough stock for that adjustment.");
    }
    const now = Date.now();
    await ctx.db.patch("items", item._id, {
      quantity,
      isLow: quantity <= item.lowThreshold,
      updatedAt: now,
    });
    await ctx.db.insert("stockMovements", {
      ownerId: identity.tokenIdentifier,
      itemId: item._id,
      amount: args.amount,
      quantityAfter: quantity,
      createdAt: now,
    });
    return quantity;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) {
      throw new Error("Sign in to upload a photo.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
