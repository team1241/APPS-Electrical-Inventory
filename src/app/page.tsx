"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import {
	useConvexAuth,
	useConvexConnectionState,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { InventoryDialog } from "@/components/inventory-dialog";
import { InventoryErrorBoundary } from "@/components/inventory-error-boundary";
import { InlineStockControls } from "@/components/inline-stock-controls";
import { CATEGORY_COLORS, categoryTint } from "@/lib/category-colors";
import { CategoryColorPicker } from "@/components/category-color-picker";
import "./inventory.css";

const defaultCategories = [
	"Cable & Wire",
	"Conduit & Fittings",
	"Circuit Protection",
	"Switches & Outlets",
	"Lighting",
	"Tools & PPE",
	"Other",
];

const units = ["each", "m", "ft", "roll", "box", "pack", "pair"];

type InventoryItem = FunctionReturnType<
	typeof api.inventory.list
>["page"][number];
type InventoryCategory = NonNullable<
	ReturnType<typeof useQuery<typeof api.inventoryCategories.list>>
>[number];

type ItemDraft = {
	sku: string;
	name: string;
	category: string;
	unit: string;
	quantity: string;
	minimumQuantity: string;
	location: string;
	supplier: string;
	orderUrl: string;
};

const emptyDraft: ItemDraft = {
	sku: "",
	name: "",
	category: defaultCategories[0],
	unit: "each",
	quantity: "0",
	minimumQuantity: "2",
	location: "",
	supplier: "",
	orderUrl: "",
};

function itemStatus(item: InventoryItem) {
	if (item.quantity <= 0) return "out";
	if (item.quantity <= item.minimumQuantity) return "low";
	return "good";
}

function formatUpdatedAt(timestamp: number) {
	const elapsed = Date.now() - timestamp;
	if (elapsed < 60_000) return "Just now";
	if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
	if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
	}).format(timestamp);
}

export default function Home() {
	const { isLoaded, isSignedIn } = useAuth();
	const { isAuthenticated, isLoading } = useConvexAuth();
	if (!isLoaded || (isSignedIn && isLoading)) {
		return (
			<main className="access-screen">
				<p role="status">Connecting to stockroom...</p>
			</main>
		);
	}
	if (!isSignedIn) {
		return (
			<main className="access-screen">
				<section className="access-card">
					<Image
						alt="1241"
						height={64}
						src="/theory6-apps-logo.jpg"
						width={64}
					/>
					<p className="eyebrow">1241 ELECTRICAL INVENTORY</p>
					<h1>Your workshop, in stock.</h1>
					<p>
						Sign in to manage shared supplies, track stock, and plan your next
						restock.
					</p>
					<SignInButton mode="modal">
						<button className="primary-button" type="button">
							Sign in to stockroom
						</button>
					</SignInButton>
				</section>
			</main>
		);
	}
	if (!isAuthenticated) {
		return (
			<main className="access-screen">
				<section className="access-card" role="alert">
					<UserButton />
					<h1>Unable to connect your account</h1>
					<p>
						Your sign-in could not be verified by the stockroom. Try signing in
						again or ask the administrator to check the Clerk–Convex connection.
					</p>
					<button
						className="primary-button"
						onClick={() => window.location.reload()}
						type="button"
					>
						Try again
					</button>
				</section>
			</main>
		);
	}
	return (
		<InventoryErrorBoundary>
			<Stockroom />
		</InventoryErrorBoundary>
	);
}

function Stockroom() {
	const {
		results: inventory,
		status: inventoryStatus,
		loadMore,
	} = usePaginatedQuery(api.inventory.list, {}, { initialNumItems: 100 });
	const { isWebSocketConnected } = useConvexConnectionState();
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const inventoryLoaded = initialLoadComplete || inventoryStatus === "Exhausted";
	useEffect(() => {
		if (inventoryStatus === "CanLoadMore") loadMore(100);
		if (inventoryStatus === "Exhausted") setInitialLoadComplete(true);
	}, [inventoryStatus, loadMore]);
	const categoryRecords = useQuery(api.inventoryCategories.list, {});
	const ensureDefaultCategories = useMutation(
		api.inventoryCategories.ensureDefaults,
	);
	const createItem = useMutation(api.inventory.create);
	const updateItem = useMutation(api.inventory.update);
	const removeItem = useMutation(api.inventory.remove);
	const generateUploadUrl = useMutation(api.inventory.generateUploadUrl);
	const setItemImage = useMutation(api.inventory.setImage);
	const createCategory = useMutation(api.inventoryCategories.create);
	const renameCategory = useMutation(api.inventoryCategories.rename);
	const removeCategory = useMutation(api.inventoryCategories.remove);
	const setCategoryColor = useMutation(api.inventoryCategories.setColor);

	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("All supplies");
	const [statusFilter, setStatusFilter] = useState("all");
	const [activeTab, setActiveTab] = useState<"inventory" | "reorder">(
		"inventory",
	);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isFormClosing, setIsFormClosing] = useState(false);
	const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
	const [isCategoryManagerClosing, setIsCategoryManagerClosing] = useState(false);
	const formCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const categoryCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const colorMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [closingColorCategoryId, setClosingColorCategoryId] = useState<string | null>(null);
	const [editingCategory, setEditingCategory] =
		useState<InventoryCategory | null>(null);
	const [editedCategoryName, setEditedCategoryName] = useState("");
	const [newCategoryName, setNewCategoryName] = useState("");
	const [categoryError, setCategoryError] = useState("");
	const [isCategorySaving, setIsCategorySaving] = useState(false);
	const [colorCategoryId, setColorCategoryId] = useState<string | null>(null);
	const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
	const [formError, setFormError] = useState("");
	const [notice, setNotice] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isKiosk, setIsKiosk] = useState(false);
	const [kioskView, setKioskView] = useState<"grid" | "list">("grid");
	const [kioskSize, setKioskSize] = useState<"compact" | "standard" | "large">("standard");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [removePhoto, setRemovePhoto] = useState(false);
	const categorySeedRequested = useRef(false);
	useEffect(() => {
		try {
			setIsKiosk(localStorage.getItem("stockroom-kiosk") === "true");
			const savedView = localStorage.getItem("stockroom-kiosk-view");
			const savedSize = localStorage.getItem("stockroom-kiosk-size");
			if (savedView === "grid" || savedView === "list") setKioskView(savedView);
			if (savedSize === "compact" || savedSize === "standard" || savedSize === "large") setKioskSize(savedSize);
		} catch { /* Storage may be unavailable on shared tablets. */ }
	}, []);
	function toggleKiosk() {
		const next = !isKiosk;
		setIsKiosk(next);
		try { localStorage.setItem("stockroom-kiosk", String(next)); } catch { /* The current session still supports kiosk mode. */ }
	}
	function changeKioskView(view: "grid" | "list") {
		setKioskView(view);
		try { localStorage.setItem("stockroom-kiosk-view", view); } catch { /* Keep the current session setting. */ }
	}
	function changeKioskSize(size: "compact" | "standard" | "large") {
		setKioskSize(size);
		try { localStorage.setItem("stockroom-kiosk-size", size); } catch { /* Keep the current session setting. */ }
	}

	useEffect(() => {
		if (
			!categoryRecords ||
			categoryRecords.length > 0 ||
			categorySeedRequested.current
		)
			return;
		categorySeedRequested.current = true;
		void ensureDefaultCategories({}).catch((error: unknown) => {
			setNotice(
				error instanceof Error
					? error.message
					: "Could not load supply categories.",
			);
		});
	}, [categoryRecords, ensureDefaultCategories]);

	const lowStockCount = inventory.filter(
		(item) => itemStatus(item) === "low",
	).length;
	const outOfStockCount = inventory.filter(
		(item) => itemStatus(item) === "out",
	).length;
	const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
	const categoryCounts = inventory.reduce<Record<string, number>>(
		(counts, item) => {
			counts[item.category] = (counts[item.category] ?? 0) + 1;
			return counts;
		},
		{},
	);
	const categories = [
		...new Set([
			...(categoryRecords?.length
				? categoryRecords.map((category) => category.name)
				: defaultCategories),
			...inventory.map((item) => item.category),
		]),
	];
	const filteredItems = inventory.filter((item) => {
		const query = search.trim().toLowerCase();
		const matchesSearch =
			!query ||
			[item.sku, item.name, item.category, item.location, item.supplier ?? ""]
				.join(" ")
				.toLowerCase()
				.includes(query);
		const matchesCategory =
			categoryFilter === "All supplies" || item.category === categoryFilter;
		const status = itemStatus(item);
		const matchesStatus =
			activeTab === "inventory"
				? statusFilter === "all" || statusFilter === status
				: status !== "good" &&
					(statusFilter === "all" || statusFilter === status);
		return matchesSearch && matchesCategory && matchesStatus;
	});

	const reorderCount = lowStockCount + outOfStockCount;
	function categoryColor(name: string) {
		const record = categoryRecords?.find((category) => category.name === name);
		return record?.color ?? CATEGORY_COLORS[(record?.sortOrder ?? Math.max(0, categories.indexOf(name))) % CATEGORY_COLORS.length].value;
	}
	async function saveCategoryColor(category: InventoryCategory, color: string) {
		setCategoryError(""); setIsCategorySaving(true);
		try { await setCategoryColor({ id: category._id, color }); }
		catch (error) { setCategoryError(error instanceof Error ? error.message : "Could not save color."); }
		finally { setIsCategorySaving(false); }
	}

	function closeItemForm() {
		if (isFormClosing) return;
		setIsFormClosing(true);
		formCloseTimer.current = setTimeout(() => {
			setIsFormOpen(false);
			setIsFormClosing(false);
			formCloseTimer.current = null;
		}, 260);
	}

	function closeCategoryManager() {
		if (isCategoryManagerClosing) return;
		setIsCategoryManagerClosing(true);
		categoryCloseTimer.current = setTimeout(() => {
			setIsCategoryManagerOpen(false);
			setIsCategoryManagerClosing(false);
			categoryCloseTimer.current = null;
		}, 260);
	}

	function toggleCategoryColor(categoryId: string) {
		if (colorCategoryId === categoryId) {
			setClosingColorCategoryId(categoryId);
			colorMenuCloseTimer.current = setTimeout(() => {
				setColorCategoryId(null);
				setClosingColorCategoryId(null);
				colorMenuCloseTimer.current = null;
			}, 190);
			return;
		}
		if (colorMenuCloseTimer.current) clearTimeout(colorMenuCloseTimer.current);
		setClosingColorCategoryId(null);
		setColorCategoryId(categoryId);
	}

	function openNewItem() {
		if (formCloseTimer.current) clearTimeout(formCloseTimer.current);
		setIsFormClosing(false);
		setEditingItem(null);
		setDraft({ ...emptyDraft, category: categories[0] ?? "Other" });
		setFormError("");
		setPhotoFile(null);
		setRemovePhoto(false);
		setIsFormOpen(true);
	}

	function openEditItem(item: InventoryItem) {
		if (formCloseTimer.current) clearTimeout(formCloseTimer.current);
		setIsFormClosing(false);
		setEditingItem(item);
		setDraft({
			sku: item.sku,
			name: item.name,
			category: item.category,
			unit: item.unit,
			quantity: String(item.quantity),
			minimumQuantity: String(item.minimumQuantity),
			location: item.location,
			supplier: item.supplier ?? "",
			orderUrl: item.orderUrl ?? "",
		});
		setFormError("");
		setPhotoFile(null);
		setRemovePhoto(false);
		setIsFormOpen(true);
	}

	function openCategoryManager() {
		if (categoryCloseTimer.current) clearTimeout(categoryCloseTimer.current);
		setIsCategoryManagerClosing(false);
		setEditingCategory(null);
		setCategoryError("");
		setIsCategoryManagerOpen(true);
	}

	async function addCategory(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setCategoryError("");
		setIsCategorySaving(true);
		try {
			await createCategory({ name: newCategoryName });
			setNewCategoryName("");
		} catch (error) {
			setCategoryError(
				error instanceof Error ? error.message : "Could not add this category.",
			);
		} finally {
			setIsCategorySaving(false);
		}
	}

	async function saveCategory(category: InventoryCategory) {
		setCategoryError("");
		setIsCategorySaving(true);
		try {
			await renameCategory({ id: category._id, name: editedCategoryName });
			if (categoryFilter === category.name)
				setCategoryFilter(editedCategoryName.trim());
			setEditingCategory(null);
		} catch (error) {
			setCategoryError(
				error instanceof Error
					? error.message
					: "Could not rename this category.",
			);
		} finally {
			setIsCategorySaving(false);
		}
	}

	async function deleteCategory(category: InventoryCategory) {
		setCategoryError("");
		setIsCategorySaving(true);
		try {
			await removeCategory({ id: category._id });
			if (categoryFilter === category.name) setCategoryFilter("All supplies");
		} catch (error) {
			setCategoryError(
				error instanceof Error
					? error.message
					: "Could not remove this category.",
			);
		} finally {
			setIsCategorySaving(false);
		}
	}

	async function saveItem(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");
		const quantity = Number(draft.quantity);
		const minimumQuantity = Number(draft.minimumQuantity);
		if (
			!Number.isFinite(quantity) ||
			quantity < 0 ||
			!Number.isFinite(minimumQuantity) ||
			minimumQuantity < 0
		) {
			setFormError("Enter valid, non-negative stock quantities.");
			return;
		}

		const supplier = draft.supplier.trim();
		if (photoFile && !photoFile.type.startsWith("image/")) {
			setFormError("Choose a JPG, PNG, or WebP image for the supply photo.");
			return;
		}
		if (photoFile && photoFile.size > 8 * 1024 * 1024) {
			setFormError("Supply photos must be 8 MB or smaller.");
			return;
		}
		const itemData = {
			sku: draft.sku,
			name: draft.name,
			category: draft.category,
			unit: draft.unit,
			quantity,
			minimumQuantity,
			location: draft.location,
			orderUrl: draft.orderUrl.trim(),
			...(supplier ? { supplier } : {}),
		};

		setIsSaving(true);
		let itemSaved = false;
		try {
			let itemId: Id<"inventoryItems">;
			if (editingItem) {
				await updateItem({ id: editingItem._id, ...itemData });
				itemId = editingItem._id;
				setNotice(`${draft.name.trim()} updated`);
			} else {
				itemId = await createItem(itemData);
				setNotice(`${draft.name.trim()} added to inventory`);
			}
			itemSaved = true;

			if (photoFile) {
				const uploadUrl = await generateUploadUrl({});
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": photoFile.type },
					body: photoFile,
				});
				if (!response.ok) throw new Error("The supply was saved, but its photo could not be uploaded.");
				const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
				await setItemImage({ id: itemId, imageId: storageId });
			} else if (editingItem && removePhoto) {
				await setItemImage({ id: itemId, imageId: null });
			}
			closeItemForm();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Could not save this item.";
			if (itemSaved) {
				setNotice(message);
				closeItemForm();
			} else {
				setFormError(message);
			}
		} finally {
			setIsSaving(false);
		}
	}

	async function deleteItem(item: InventoryItem) {
		if (!window.confirm(`Remove ${item.name} (${item.sku}) from inventory?`))
			return;
		try {
			await removeItem({ id: item._id });
			setNotice(`${item.name} removed`);
		} catch (error) {
			setNotice(
				error instanceof Error ? error.message : "Could not remove this item.",
			);
		}
	}

	return (
		<main className={`stockroom-shell${isKiosk ? ` kiosk kiosk-view-${kioskView} kiosk-size-${kioskSize}` : ""}`}>
			<header className="topbar">
				<a
					className="brand"
					href="/"
					onClick={() => {
						setActiveTab("inventory");
						setStatusFilter("all");
						setCategoryFilter("All supplies");
						setSearch("");
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					aria-label="1241 Electrical Inventory Tracker home"
				>
					<Image
						alt=""
						className="brand-mark"
						height={48}
						priority
						src="/theory6-apps-logo.jpg"
						width={48}
					/>
					<span className="brand-copy">
						<strong>1241</strong>
						<small>ELECTRICAL INVENTORY</small>
					</span>
				</a>
				<div className="topbar-divider" />
				<div className="workspace-label">
					<span className="workspace-dot" />
					Workshop inventory
				</div>
				<div className="topbar-spacer" />
				<span className="sync-indicator">
					<span />
					{isWebSocketConnected ? "Live inventory" : "Reconnecting..."}
				</span>
				<UserButton />
				<button className="kiosk-toggle" type="button" role="switch" aria-label="Kiosk mode" aria-checked={isKiosk} onClick={toggleKiosk}><span className="toggle-track" aria-hidden="true"><span /></span>{isKiosk ? "Exit kiosk" : "Kiosk mode"}</button>
			</header>

			<div className="workspace" id="inventory">
				<aside className="sidebar">
					<div className="sidebar-label">WORKSPACE</div>
					<button
						className="nav-current"
						onClick={() => {
							setActiveTab("inventory");
							setStatusFilter("all");
							setCategoryFilter("All supplies");
							setSearch("");
						}}
						type="button"
					>
						<span className="nav-icon" aria-hidden="true">
							▦
						</span>
						<span>Inventory</span>
						<span className="nav-count">{inventory.length}</span>
					</button>

					<div className="sidebar-section-heading">
						<span>SUPPLY CATEGORIES</span>
						<button
							aria-label="Manage supply categories"
							className="category-manage-trigger"
							onClick={openCategoryManager}
							title="Manage supply categories"
							type="button"
						>
							Edit
						</button>
						<span className="sidebar-rule" />
					</div>
					<button
						className={`category-link ${categoryFilter === "All supplies" ? "selected" : ""}`}
						onClick={() => setCategoryFilter("All supplies")}
						type="button"
					>
						<span className="category-dot all-dot" />
						All supplies
						<span className="category-count">{inventory.length}</span>
					</button>
				{categories.map((category) => (
						<button
							className={`category-link ${categoryFilter === category ? "selected" : ""}`}
							key={category}
							onClick={() =>
								setCategoryFilter(
									categoryFilter === category ? "All supplies" : category,
								)
							}
							type="button"
						>
							<span className="category-dot" style={{ backgroundColor: categoryColor(category) }} />
							<span className="category-name">{category}</span>
							<span className="category-count">
								{categoryCounts[category] ?? 0}
							</span>
						</button>
					))}

					<div className="sidebar-section-heading status-heading">
						<span>STOCK STATUS</span>
						<span className="sidebar-rule" />
					</div>
					<button
						className={`status-link ${statusFilter === "low" ? "selected" : ""}`}
						onClick={() => {
							setActiveTab("reorder");
							setStatusFilter(statusFilter === "low" ? "all" : "low");
						}}
						type="button"
					>
						<span className="status-dot low-dot" />
						Low stock<span className="category-count">{lowStockCount}</span>
					</button>
					<button
						className={`status-link ${statusFilter === "out" ? "selected" : ""}`}
						onClick={() => {
							setActiveTab("reorder");
							setStatusFilter(statusFilter === "out" ? "all" : "out");
						}}
						type="button"
					>
						<span className="status-dot out-dot" />
						Out of stock
						<span className="category-count">{outOfStockCount}</span>
					</button>

					<div className="sidebar-footnote">
						<Image
							alt=""
							className="footnote-mark"
							height={27}
							src="/theory6-apps-logo.jpg"
							width={27}
						/>
						<span>
							Keep every connection
							<br />
							in good supply.
						</span>
					</div>
				</aside>

				<section className="main-panel">
					<div className="page-heading">
						<div>
							<div className="eyebrow">
								<span /> ELECTRICAL SUPPLIES
							</div>
							<h1>{activeTab === "reorder" ? "Reorder list" : "Inventory"}</h1>
							<p className="page-subtitle">
								{activeTab === "reorder"
									? "Supplies at or below their minimum stock level."
									: isKiosk ? "Find a supply, then add or remove stock." : "A clear view of what is on the shelf and what needs a restock."}
							</p>
						</div>
						<button
							className={isKiosk ? "cancel-button new-supply-secondary" : "primary-button"}
							onClick={openNewItem}
							type="button"
						>
							<span aria-hidden="true">+</span> Add supply
						</button>
					</div>

					<section aria-label="Inventory summary" className="metrics-row">
						<div className="metric">
							<span className="metric-label">ITEMS TRACKED</span>
							<strong>
								{inventoryLoaded ? inventory.length.toLocaleString() : "…"}
							</strong>
							<span className="metric-note">unique supply lines</span>
						</div>
						<div className="metric">
							<span className="metric-label">UNITS ON HAND</span>
							<strong>
								{inventoryLoaded ? totalUnits.toLocaleString() : "…"}
							</strong>
							<span className="metric-note">across all supplies</span>
						</div>
						<div className="metric metric-alert">
							<span className="metric-label">NEEDS ATTENTION</span>
							<strong>
								{inventoryLoaded
									? (lowStockCount + outOfStockCount).toLocaleString()
									: "…"}
							</strong>
							<span className="metric-note">at or below minimum</span>
						</div>
					</section>

					<div className="inventory-toolbar">
						<div className="toolbar-title">
							<h2>
								{activeTab === "reorder"
									? "Supplies to reorder"
									: "Supply list"}
							</h2>
							<span className="result-count">{filteredItems.length}</span>
							<button
								className="category-toolbar-action"
								onClick={openCategoryManager}
								type="button"
							>
								Manage categories
							</button>
						</div>
						<label className="search-field">
							<span className="search-icon" aria-hidden="true" />
							<input
								aria-label="Search inventory"
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search name, SKU, location..."
								type="search"
								value={search}
							/>
						</label>
						<div
							aria-label="Inventory views"
							className="inventory-tabs"
							role="tablist"
						>
							<button
								aria-selected={activeTab === "inventory"}
								className={activeTab === "inventory" ? "active" : ""}
								aria-controls="inventory-panel"
								id="inventory-tab"
								onClick={() => {
									setActiveTab("inventory");
									setStatusFilter("all");
								}}
								role="tab"
								type="button"
							>
								Inventory
							</button>
							<button
								aria-selected={activeTab === "reorder"}
								className={activeTab === "reorder" ? "active" : ""}
								aria-controls="reorder-panel"
								id="reorder-tab"
								onClick={() => {
									setActiveTab("reorder");
									setStatusFilter("all");
								}}
								role="tab"
								type="button"
							>
								Reorder list<span className="tab-count">{reorderCount}</span>
							</button>
						</div>
					</div>

					{isKiosk && <div className="kiosk-display-controls">
						<fieldset className="segmented-control"><legend>View</legend><button type="button" aria-pressed={kioskView === "grid"} onClick={() => changeKioskView("grid")}>Grid</button><button type="button" aria-pressed={kioskView === "list"} onClick={() => changeKioskView("list")}>List</button></fieldset>
						<fieldset className="segmented-control"><legend>Size</legend><button type="button" aria-pressed={kioskSize === "compact"} onClick={() => changeKioskSize("compact")}>Compact</button><button type="button" aria-pressed={kioskSize === "standard"} onClick={() => changeKioskSize("standard")}>Standard</button><button type="button" aria-pressed={kioskSize === "large"} onClick={() => changeKioskSize("large")}>Large</button></fieldset>
					</div>}
					<div className="mobile-filters">
						<label>
							Category
							<select
								value={categoryFilter}
								onChange={(event) => setCategoryFilter(event.target.value)}
							>
								<option>All supplies</option>
								{categories.map((category) => (
									<option key={category}>{category}</option>
								))}
							</select>
						</label>
						<label>
							Stock status
							<select
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
							>
								<option value="all">All statuses</option>
								<option value="low">Low stock</option>
								<option value="out">Out of stock</option>
								{activeTab === "inventory" && (
									<option value="good">In stock</option>
								)}
							</select>
						</label>
					</div>
					<div className="notice-slot">{notice && (
						<div className="notice" role="status">
							{notice}
							<button
								aria-label="Dismiss message"
								onClick={() => setNotice("")}
								type="button"
							>
								×
							</button>
						</div>
					)}</div>

					<section
						aria-labelledby={
							activeTab === "reorder" ? "reorder-tab" : "inventory-tab"
						}
						className="table-frame"
						id={activeTab === "reorder" ? "reorder-panel" : "inventory-panel"}
						role="tabpanel"
					>
						{isKiosk ? <div className={`kiosk-grid ${kioskView === "list" ? "kiosk-list" : ""}`}>
							{inventoryStatus === "LoadingFirstPage" ? <p className="kiosk-empty" role="status">Loading supplies...</p> : filteredItems.length === 0 ? <p className="kiosk-empty">{inventoryLoaded ? "No supplies in this view. Try another search or filter." : "Loading more supplies..."}</p> : filteredItems.map((item) => {
								const status = itemStatus(item);
								return <article className={`kiosk-card stock-${status}`} key={item._id} aria-label={item.name}>
									<div className="kiosk-card-heading"><span className="kiosk-category" style={categoryTint(categoryColor(item.category))}><span style={{ backgroundColor: categoryColor(item.category) }} />{item.category}</span><span className={`stock-badge ${status}`}><span />{status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "In stock"}</span></div>
									<button className="kiosk-item-identity item-edit-target" type="button" aria-label={`Edit ${item.name}`} title="Click to edit supply" onClick={() => openEditItem(item)}>{item.imageUrl ? <Image unoptimized className="supply-photo kiosk-photo" alt="" src={item.imageUrl} width={88} height={88} /> : <span className="item-monogram" style={categoryTint(categoryColor(item.category))} aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>}<span><strong className="kiosk-item-title">{item.name}</strong><span className="kiosk-item-meta">{item.sku} · {item.location}</span></span></button>
									<div className="kiosk-stock"><strong>{item.quantity.toLocaleString()}</strong><span>{item.unit} on hand</span><small>Minimum {item.minimumQuantity.toLocaleString()}</small></div>
									<InlineStockControls item={item} kiosk onNotice={setNotice} />
									{item.orderUrl && <div className="kiosk-card-footer"><a className="order-link" href={item.orderUrl} target="_blank" rel="noopener noreferrer">Order supply ↗</a></div>}
								</article>;
							})}
						</div> : <div className="table-scroll">
							<table
								aria-labelledby={
									activeTab === "reorder" ? "reorder-tab" : "inventory-tab"
								}
								className="inventory-table"
							>
								<thead>
									<tr>
										<th className="item-column">SUPPLY</th>
										<th>SKU</th>
										{activeTab === "reorder" ? (
											<>
												<th>ON HAND</th>
												<th>MINIMUM</th>
												<th>SUGGESTED QTY</th>
												<th>LOCATION / SUPPLIER</th>
											</>
										) : (
											<>
												<th>ON HAND</th>
												<th>STATUS</th>
												<th>LOCATION</th>
												<th>UPDATED</th>
											</>
										)}
										<th>
											<span className="visually-hidden">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{inventoryStatus === "LoadingFirstPage" ? (
										<tr>
											<td className="table-state" colSpan={7}>
												<span className="loading-mark" />
												Connecting to stockroom...
											</td>
										</tr>
									) : filteredItems.length === 0 ? (
										<tr>
											<td className="table-state" colSpan={7}>
												<div className="empty-state">
													<span className="empty-mark" aria-hidden="true">
														⌁
													</span>
													<strong>
														{activeTab === "reorder"
															? "Nothing needs reordering"
															: inventory.length === 0
																? "Your supply list starts here"
																: "No supplies match this view"}
													</strong>
													<span>
														{activeTab === "reorder"
															? "Low- and out-of-stock supplies will appear here."
															: inventory.length === 0
																? "Add the electrical materials you keep on hand."
																: "Try another search or category."}
													</span>
													{activeTab === "inventory" &&
														inventory.length === 0 && (
															<button
																className="text-action"
																onClick={openNewItem}
																type="button"
															>
																Add your first supply{" "}
																<span aria-hidden="true">→</span>
															</button>
														)}
												</div>
											</td>
										</tr>
									) : (
										filteredItems.map((item) => {
											const status = itemStatus(item);
											return (
								<tr key={item._id} className={`stock-${status}`}>
									<td className="item-cell">
										<button className="item-edit-target" type="button" aria-label={`Edit ${item.name}`} title="Click to edit supply" onClick={() => openEditItem(item)}>
											{item.imageUrl ? <Image unoptimized className="supply-photo" alt="" src={item.imageUrl} width={40} height={40} /> : <span
																className={`item-monogram monogram-${categories.indexOf(item.category) < 0 ? 6 : categories.indexOf(item.category)}`}
																aria-hidden="true"
																style={categoryTint(categoryColor(item.category))}
															>
																{item.name.slice(0, 1).toUpperCase()}
															</span>}
														<span className="item-description">
															<strong>{item.name}</strong>
															<small>{item.category}</small>
														</span>
														</button>
													</td>
													<td className="sku-cell">{item.sku}</td>
													{activeTab === "reorder" ? (
														<>
															<td>
																<span className={`stock-badge ${status}`}>
																	<span />
																	{item.quantity.toLocaleString()} {item.unit}
																</span>
															</td>
															<td className="reorder-minimum">
																{item.minimumQuantity.toLocaleString()}{" "}
																{item.unit}
															</td>
															<td>
																<strong className="suggested-quantity">
																	{Math.max(
																		1,
																		Math.ceil(
																			item.minimumQuantity + 1 - item.quantity,
																		),
																	).toLocaleString()}{" "}
																	{item.unit}
																</strong>
															</td>
															<td className="reorder-location">
																<strong>{item.location}</strong>
																<span>
																	{item.supplier || "Supplier not set"}
																</span>
															</td>
														</>
													) : (
														<>
															<td>
															<InlineStockControls item={item} onNotice={setNotice} />
															</td>
															<td>
																<span className={`stock-badge ${status}`}>
																	<span />
																	{status === "good"
																		? "In stock"
																		: status === "low"
																			? "Low stock"
																			: "Out of stock"}
																</span>
															</td>
															<td className="location-cell">{item.location}</td>
															<td className="updated-cell">
																{formatUpdatedAt(item.updatedAt)}
															</td>
														</>
													)}
													<td>
														<div className="row-actions">
															{item.orderUrl && <a className="order-link" href={item.orderUrl} target="_blank" rel="noopener noreferrer" aria-label={`Order ${item.name}`}>Order ↗</a>}
															<button
																aria-label={`Edit ${item.name}`}
																onClick={() => openEditItem(item)}
																title="Edit item"
																type="button"
															>
																Edit
															</button>
															<button
																aria-label={`Remove ${item.name}`}
																className="remove-action"
																onClick={() => void deleteItem(item)}
																title="Remove item"
																type="button"
															>
																×
															</button>
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>}
						<footer className="table-footer">
							<span>
								Stock counts update as supplies are received or issued.
							</span>
							<span>
								<span className="footer-live-dot" />{" "}
								{isWebSocketConnected
									? "Synced live"
									: "Reconnecting — changes may be delayed"}
							</span>
						</footer>
					</section>

					<div className="restock-strip">
						<div className="restock-symbol" aria-hidden="true">
							!
						</div>
						<div>
							<strong>
								{outOfStockCount > 0
									? `${outOfStockCount} item${outOfStockCount === 1 ? "" : "s"} out of stock`
									: lowStockCount > 0
										? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} running low`
										: "Stock levels look good"}
							</strong>
							<span>
								{outOfStockCount + lowStockCount > 0
									? "Review supplies at or below their minimum level."
									: "Items below their minimum level will appear here."}
							</span>
						</div>
						<button
							onClick={() => {
								setActiveTab("reorder");
								setStatusFilter("all");
							}}
							type="button"
						>
							Open reorder list <span aria-hidden="true">→</span>
						</button>
					</div>
				</section>
			</div>

			{isFormOpen && (
				<InventoryDialog
					titleId="item-form-title"
					className={isFormClosing ? "is-closing" : ""}
					onClose={closeItemForm}
				>
					<div className="modal-heading">
						<div>
							<span className="modal-kicker">STOCKROOM RECORD</span>
							<h2 id="item-form-title">
								{editingItem ? "Edit supply" : "Add a supply"}
							</h2>
						</div>
						<button
							aria-label="Close dialog"
							className="modal-close"
							onClick={closeItemForm}
							type="button"
						>
							×
						</button>
					</div>
					<form onSubmit={(event) => void saveItem(event)}>
						<div className="form-grid">
							<label className="form-field span-two">
								<span>
									Item name <i>*</i>
								</span>
								<input
									onChange={(event) =>
										setDraft({ ...draft, name: event.target.value })
									}
									placeholder="e.g. THHN copper wire, 12 AWG"
									required
									value={draft.name}
								/>
							</label>
							<label className="form-field">
								<span>
									SKU / part number <i>*</i>
								</span>
								<input
									onChange={(event) =>
										setDraft({ ...draft, sku: event.target.value })
									}
									placeholder="e.g. WIR-THHN-12-BLK"
									required
									value={draft.sku}
								/>
							</label>
							<label className="form-field">
								<span>
									Category <i>*</i>
								</span>
								<select
									onChange={(event) =>
										setDraft({ ...draft, category: event.target.value })
									}
									value={draft.category}
								>
									{[
										...new Set([
											...categories,
											...(draft.category && !categories.includes(draft.category)
												? [draft.category]
												: []),
										]),
									].map((category) => (
										<option key={category}>{category}</option>
									))}
								</select>
							</label>
							<label className="form-field">
								<span>
									Quantity on hand <i>*</i>
								</span>
								<div className="number-with-unit">
									<input
										min="0"
										onChange={(event) =>
											setDraft({ ...draft, quantity: event.target.value })
										}
										required
										step="any"
										type="number"
										value={draft.quantity}
									/>
									<select
										aria-label="Stock unit"
										onChange={(event) =>
											setDraft({ ...draft, unit: event.target.value })
										}
										value={draft.unit}
									>
										{units.map((unit) => (
											<option key={unit}>{unit}</option>
										))}
									</select>
								</div>
							</label>
							<label className="form-field">
								<span>
									Minimum stock <i>*</i>
								</span>
								<input
									min="0"
									onChange={(event) =>
										setDraft({ ...draft, minimumQuantity: event.target.value })
									}
									required
									step="any"
									type="number"
									value={draft.minimumQuantity}
								/>
							</label>
							<label className="form-field">
								<span>
									Storage location <i>*</i>
								</span>
								<input
									onChange={(event) =>
										setDraft({ ...draft, location: event.target.value })
									}
									placeholder="e.g. Aisle 2 · Bin 04"
									required
									value={draft.location}
								/>
							</label>
							<label className="form-field">
								<span>Supplier</span>
								<input
									onChange={(event) =>
										setDraft({ ...draft, supplier: event.target.value })
									}
									placeholder="Supplier name"
									value={draft.supplier}
								/>
							</label>
							<label className="form-field span-two"><span>Order URL <small>Optional</small></span><input type="url" inputMode="url" placeholder="https://supplier.com/product" value={draft.orderUrl} onChange={(event) => setDraft({ ...draft, orderUrl: event.target.value })} /><small className="field-hint">Link to the supplier page for reordering this supply.</small></label>
							<div className="form-field span-two supply-photo-field">
								<span>Supply photo <small>Optional · JPG, PNG, or WebP · 8 MB max</small></span>
								<div className="photo-upload-row">
									{editingItem?.imageUrl && !removePhoto ? <Image unoptimized className="photo-preview" alt={`Current photo of ${editingItem.name}`} src={editingItem.imageUrl} width={72} height={72} /> : <span className="photo-placeholder" aria-hidden="true">+</span>}
									<label className="photo-file-button">{photoFile ? "Change photo" : "Choose photo"}<input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => { setPhotoFile(event.target.files?.[0] ?? null); setRemovePhoto(false); }} /></label>
									{photoFile && <span className="photo-file-name">{photoFile.name}</span>}
									{editingItem?.imageUrl && !removePhoto && !photoFile && <button className="category-row-action subtle" type="button" onClick={() => setRemovePhoto(true)}>Remove photo</button>}
									{removePhoto && <button className="category-row-action" type="button" onClick={() => setRemovePhoto(false)}>Keep current photo</button>}
								</div>
							</div>
						</div>
						{formError && (
							<p className="form-error" role="alert">
								{formError}
							</p>
						)}
						<div className="modal-actions">
							<button
								className="cancel-button"
								onClick={closeItemForm}
								type="button"
							>
								Cancel
							</button>
							<button
								className="primary-button"
								disabled={isSaving}
								type="submit"
							>
								{isSaving
									? "Saving..."
									: editingItem
										? "Save changes"
										: "Add to inventory"}
							</button>
						</div>
					</form>
				</InventoryDialog>
			)}

			{isCategoryManagerOpen && (
				<InventoryDialog
					titleId="category-manager-title"
					className={`category-manager${isCategoryManagerClosing ? " is-closing" : ""}`}
					onClose={closeCategoryManager}
				>
					<div className="modal-heading">
						<div>
							<span className="modal-kicker">INVENTORY SETTINGS</span>
							<h2 id="category-manager-title">Supply categories</h2>
						</div>
						<button
							aria-label="Close category manager"
							className="modal-close"
							onClick={closeCategoryManager}
							type="button"
						>
							×
						</button>
					</div>
					<p className="category-manager-copy">
						Renaming a category updates its supplies. Move supplies to another
						category before removing it.
					</p>
					<div className="category-manager-list">
						{categoryRecords === undefined ? (
							<p className="category-manager-empty">Loading categories...</p>
						) : (
							categoryRecords.map((category) => {
								const itemCount = categoryCounts[category.name] ?? 0;
								const isEditing = editingCategory?._id === category._id;
								return (
									<div className="category-manager-entry" key={category._id}><div className="category-manager-row">
										<button className="category-color-trigger" type="button" aria-label={`Change color for ${category.name}`} aria-expanded={colorCategoryId === category._id && closingColorCategoryId !== category._id} style={{ backgroundColor: categoryColor(category.name) }} onClick={() => toggleCategoryColor(category._id)} />
										{isEditing ? (
											<input
												aria-label={`Rename ${category.name}`}
												maxLength={40}
												onChange={(event) =>
													setEditedCategoryName(event.target.value)
												}
												value={editedCategoryName}
											/>
										) : (
											<strong>{category.name}</strong>
										)}
										<span className="category-manager-count">
											{itemCount} {itemCount === 1 ? "supply" : "supplies"}
										</span>
										{isEditing ? (
											<>
												<button
													className="category-row-action"
													disabled={isCategorySaving}
													onClick={() => void saveCategory(category)}
													type="button"
												>
													Save
												</button>
												<button
													className="category-row-action subtle"
													onClick={() => setEditingCategory(null)}
													type="button"
												>
													Cancel
												</button>
											</>
										) : (
											<>
												<button
													className="category-row-action"
													onClick={() => {
														setEditingCategory(category);
														setEditedCategoryName(category.name);
														setCategoryError("");
													}}
													type="button"
												>
													Rename
												</button>
												<button
													aria-label={`Remove ${category.name}`}
													className="category-row-action subtle"
													disabled={isCategorySaving || itemCount > 0}
													onClick={() => void deleteCategory(category)}
													title={
														itemCount > 0
															? "Move supplies before removing this category"
															: "Remove category"
													}
													type="button"
												>
													Remove
												</button>
											</>
										)}
					</div>{(colorCategoryId === category._id || closingColorCategoryId === category._id) && <CategoryColorPicker className={closingColorCategoryId === category._id ? "is-closing" : ""} name={category.name} color={categoryColor(category.name)} disabled={isCategorySaving} onSave={(color) => saveCategoryColor(category, color)} />}</div>
								);
							})
						)}
					</div>
					<form
						className="category-add-form"
						onSubmit={(event) => void addCategory(event)}
					>
						<label className="form-field" htmlFor="new-category-name">
							<span>New category</span>
						</label>
						<div className="category-add-controls">
							<input
								id="new-category-name"
								maxLength={40}
								onChange={(event) => setNewCategoryName(event.target.value)}
								placeholder="e.g. Test equipment"
								required
								value={newCategoryName}
							/>
							<button
								className="primary-button"
								disabled={isCategorySaving}
								type="submit"
							>
								Add
							</button>
						</div>
					</form>
					{categoryError && (
						<p className="form-error" role="alert">
							{categoryError}
						</p>
					)}
				</InventoryDialog>
			)}
		</main>
	);
}
