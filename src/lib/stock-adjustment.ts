import type { OptimisticUpdate } from "convex/browser";
import type { FunctionArgs } from "convex/server";
import { api } from "../../convex/_generated/api";

/** Update cached pages in place; Convex rolls this back if the mutation fails. */
export const optimisticStockChange: OptimisticUpdate<FunctionArgs<typeof api.inventory.adjustQuantity>> = (store, { id, change }) => {
  for (const { args, value } of store.getAllQueries(api.inventory.list)) {
    if (!value?.page.some((item) => item._id === id)) continue;
    store.setQuery(api.inventory.list, args, {
      ...value,
      page: value.page.map((item) => item._id === id && Number.isFinite(item.quantity + change) && item.quantity + change >= 0 && item.quantity + change <= Number.MAX_SAFE_INTEGER
        ? { ...item, quantity: item.quantity + change }
        : item),
    });
  }
};
