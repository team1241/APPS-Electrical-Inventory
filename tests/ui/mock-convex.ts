import { useSyncExternalStore } from "react";
import { getFunctionName, type FunctionReference } from "convex/server";
type Item = {
	_id: string;
	_creationTime: number;
	sku: string;
	name: string;
	category: string;
	unit: string;
	quantity: number;
	minimumQuantity: number;
	location: string;
	supplier?: string;
	orderUrl?: string;
	updatedAt: number;
};
let items: Item[] = [
	{
		_id: "item-1",
		_creationTime: 1,
		sku: "WIRE-01",
		name: "Copper wire",
		category: "Cable & Wire",
		unit: "m",
		quantity: 3,
		minimumQuantity: 5,
		location: "Bin A",
		supplier: "Electrical shop",
		updatedAt: Date.now(),
	},
	{
		_id: "item-2",
		_creationTime: 2,
		sku: "FUSE-01",
		name: "Blade fuse",
		category: "Circuit Protection",
		unit: "each",
		quantity: 12,
		minimumQuantity: 2,
		location: "Bin B",
		updatedAt: Date.now(),
	},
];
let categories: { _id: string; _creationTime: number; name: string; normalizedName: string; sortOrder: number; color?: string }[] = ["Cable & Wire", "Circuit Protection", "Other"].map(
	(name, index) => ({
		_id: `category-${index}`,
		_creationTime: index,
		name,
		normalizedName: name.toLowerCase(),
		sortOrder: index,
	}),
);
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
};
const update = () => {
	for (const fn of listeners) fn();
};
let paginationStatus = "Exhausted";
export function useConvexAuth() {
	return { isAuthenticated: true, isLoading: false };
}
export function useConvexConnectionState() {
	return { isWebSocketConnected: true };
}
export function usePaginatedQuery() {
	return {
		results: useSyncExternalStore(subscribe, () => items),
		status: useSyncExternalStore(subscribe, () => paginationStatus),
		loadMore: () => {},
	};
}
export function useQuery() {
	return useSyncExternalStore(subscribe, () => categories);
}
export function useMutation(ref: FunctionReference<"mutation">) {
	const name = getFunctionName(ref);
	const mutation = async (args: Record<string, unknown>) => {
		if (name === "inventory:generateUploadUrl") return "http://127.0.0.1:4173/mock-upload";
		if (name === "inventory:adjustQuantity") {
			paginationStatus = "LoadingMore";
			update();
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
		if (name === "inventory:create")
			items = [
				...items,
				{
					...args,
					_id: `item-${Date.now()}`,
					_creationTime: Date.now(),
					updatedAt: Date.now(),
				} as Item,
			];
		if (name === "inventory:update")
			items = items.map((item) =>
				item._id === args.id
					? { ...item, ...args, updatedAt: Date.now() }
					: item,
			);
		if (name === "inventory:adjustQuantity")
			items = items.map((item) =>
				item._id === args.id
					? { ...item, quantity: item.quantity + Number(args.change) }
					: item,
			);
		if (name === "inventory:remove")
			items = items.filter((item) => item._id !== args.id);
		if (name === "inventory:setImage")
			items = items.map((item) => item._id === args.id ? { ...item, imageUrl: args.imageId ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%233b6ca8'/%3E%3C/svg%3E" : null } : item);
		if (name === "inventoryCategories:create")
			categories = [
				...categories,
				{
					_id: `category-${Date.now()}`,
					_creationTime: Date.now(),
					name: String(args.name),
					normalizedName: String(args.name).toLowerCase(),
					sortOrder: categories.length,
				},
			];
		if (name === "inventoryCategories:rename") {
			const old = categories.find((category) => category._id === args.id)?.name;
			categories = categories.map((category) =>
				category._id === args.id
					? { ...category, name: String(args.name) }
					: category,
			);
			items = items.map((item) =>
				item.category === old ? { ...item, category: String(args.name) } : item,
			);
		}
		if (name === "inventoryCategories:remove")
			categories = categories.filter((category) => category._id !== args.id);
		if (name === "inventoryCategories:setColor") categories = categories.map((category) => category._id === args.id ? { ...category, color: String(args.color) } : category);
		paginationStatus = "Exhausted";
		update();
	};
	mutation.withOptimisticUpdate = () => mutation;
	return mutation;
}
