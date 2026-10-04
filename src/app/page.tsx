"use client";

import { Show } from "@clerk/nextjs";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from "convex/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const CATEGORIES = [
	"Wire & Cable",
	"Connectors",
	"Terminals & Crimps",
	"Breakers & Fuses",
	"Conduit & Fittings",
	"Switches & Controls",
	"Lighting",
	"Other",
] as const;
type Category = (typeof CATEGORIES)[number];
type Item = {
	_id: Id<"items">;
	commonName: string;
	sku: string;
	category: Category;
	location: string;
	quantity: number;
	lowThreshold: number;
	isLow: boolean;
	imageUrl: string | null;
};
type IconName =
	| "bolt"
	| "grid"
	| "alert"
	| "plus"
	| "search"
	| "box"
	| "arrow"
	| "close"
	| "upload"
	| "minus"
	| "check";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
	const paths: Record<IconName, ReactNode> = {
		bolt: <path d="m13 2-8 11h6l-1 9 9-12h-6l1-8Z" />,
		grid: (
			<>
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
			</>
		),
		alert: (
			<>
				<path d="M12 3 2 20h20L12 3Z" />
				<path d="M12 9v5m0 3h.01" />
			</>
		),
		plus: <path d="M12 5v14M5 12h14" />,
		search: (
			<>
				<circle cx="10.8" cy="10.8" r="7" />
				<path d="m16 16 5 5" />
			</>
		),
		box: (
			<>
				<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z" />
				<path d="m3 7 9 4 9-4M12 11v10" />
			</>
		),
		arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
		close: <path d="M5 5 19 19M19 5 5 19" />,
		upload: (
			<>
				<path d="M12 16V3m-5 5 5-5 5 5" />
				<path d="M4 16v4h16v-4" />
			</>
		),
		minus: <path d="M5 12h14" />,
		check: <path d="m4 12 5 5L20 6" />,
	};
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height={size}
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width={size}
		>
			{paths[name]}
		</svg>
	);
}

function ItemImage({ item, small = false }: { item: Item; small?: boolean }) {
	return (
		<div className={`item-image ${small ? "item-image-sm" : ""}`}>
			{item.imageUrl ? (
				// biome-ignore lint/performance/noImgElement: Convex returns a signed storage URL for this small catalog thumbnail.
				<img alt={item.commonName} src={item.imageUrl} />
			) : (
				<Icon name="bolt" size={small ? 18 : 24} />
			)}
		</div>
	);
}

export default function Home() {
	return (
		<Show
			when="signed-in"
			fallback={
				<div className="signin-screen">
					<div className="signin-card">
						<div className="brand-mark">
							<Icon name="bolt" size={24} />
						</div>
						<span className="eyebrow">ELECTRICAL INVENTORY</span>
						<h1>Know what you have. Find what you need.</h1>
						<p>
							Keep your parts, locations, and stock levels organized in one easy
							place. Sign in or create an account above to continue.
						</p>
					</div>
				</div>
			}
		>
			<Authenticated>
				<InventoryDashboard />
			</Authenticated>
			<AuthLoading>
				<div className="signin-screen">
					<div className="signin-card">
						<div className="brand-mark">
							<Icon name="bolt" size={24} />
						</div>
						<h1>Connecting to inventory</h1>
						<p>Verifying your sign-in…</p>
					</div>
				</div>
			</AuthLoading>
			<Unauthenticated>
				<div className="signin-screen">
					<div className="signin-card">
						<div className="brand-mark">
							<Icon name="bolt" size={24} />
						</div>
						<h1>Inventory access unavailable</h1>
						<p>
							Your sign-in could not be verified for inventory. Refresh the page;
							if this continues, check the Clerk and Convex connection.
						</p>
					</div>
				</div>
			</Unauthenticated>
		</Show>
	);
}

function InventoryDashboard() {
	const [view, setView] = useState<"all" | "low">("all");
	const [category, setCategory] = useState<Category | "">("");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [showAdd, setShowAdd] = useState(false);
	const [adjustItem, setAdjustItem] = useState<Item | null>(null);
	const [pendingItem, setPendingItem] = useState<string | null>(null);
	const [error, setError] = useState("");
	const adjustStock = useMutation(api.items.adjustStock);
	const lowPreview = useQuery(api.items.lowPreview);
	const { results, status, loadMore } = usePaginatedQuery(
		api.items.list,
		{ category: category || undefined, lowOnly: view === "low", search },
		{ initialNumItems: 24 },
	);
	useEffect(() => {
		const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
		return () => clearTimeout(timer);
	}, [searchInput]);

	async function quickAdjust(item: Item, amount: number) {
		setError("");
		setPendingItem(item._id);
		try {
			await adjustStock({ itemId: item._id, amount });
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not update stock.",
			);
		} finally {
			setPendingItem(null);
		}
	}

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<div className="brand">
					<span className="brand-mark">
						<Icon name="bolt" size={23} />
					</span>
					<div>
						<strong>VOLT</strong>
						<small>INVENTORY</small>
					</div>
				</div>
				<div className="sidebar-section-label">WORKSPACE</div>
				<nav aria-label="Main navigation" className="side-nav">
					<button
						className={view === "all" ? "active" : ""}
						onClick={() => setView("all")}
						type="button"
					>
						<Icon name="grid" size={18} /> All inventory
					</button>
					<button
						className={view === "low" ? "active" : ""}
						onClick={() => setView("low")}
						type="button"
					>
						<Icon name="alert" size={18} /> Low stock{" "}
						{lowPreview && lowPreview.length > 0 && (
							<span className="nav-dot" />
						)}
					</button>
				</nav>
				<div className="sidebar-bottom">
					<div className="sidebar-tip">
						<span className="tip-icon">
							<Icon name="box" size={18} />
						</span>
						<strong>Stay stocked.</strong>
						<p>
							Set a low-stock level for each part and see what needs attention.
						</p>
					</div>
					<div className="sidebar-user">
						<span className="workspace-avatar">V</span>
						<div>
							<strong>Your workspace</strong>
							<span>Inventory manager</span>
						</div>
					</div>
				</div>
			</aside>
			<main className="main-content">
				<div className="topbar">
					<span>
						WORKSPACE <span className="slash">/</span>{" "}
						{view === "all" ? "INVENTORY" : "LOW STOCK"}
					</span>
					<div className="topbar-right">
						<span className="live-dot" /> LIVE INVENTORY{" "}
					</div>
				</div>
				<div className="content-inner">
					<div className="page-heading">
						<div>
							<span className="eyebrow">YOUR PARTS, ALL IN ONE PLACE</span>
							<h1>{view === "all" ? "Inventory overview" : "Low stock"}</h1>
							<p>
								{view === "all"
									? "A clear view of every electrical part you keep on hand."
									: "Parts at or below their reorder level."}
							</p>
						</div>
						<button
							className="primary-button"
							onClick={() => setShowAdd(true)}
							type="button"
						>
							<Icon name="plus" size={18} /> Add new item
						</button>
					</div>
					{view === "all" && (
						<section className="attention-panel">
							<div className="attention-copy">
								<span className="attention-icon">
									<Icon name="alert" size={19} />
								</span>
								<div>
									<span className="attention-kicker">STOCK WATCH</span>
									<h2>
										{lowPreview === undefined
											? "Checking stock levels…"
											: lowPreview.length
												? "A few parts need your attention"
												: "Everything is looking good"}
									</h2>
									<p>
										{lowPreview?.length
											? "These parts are at or below their low-stock threshold."
											: "Parts that run low will appear here automatically."}
									</p>
									{lowPreview && lowPreview.length > 0 && (
										<div className="low-preview-list">
											{lowPreview.slice(0, 3).map((item) => (
												<span key={item._id}>
													{item.commonName}{" "}
													<strong>{item.quantity} left</strong>
												</span>
											))}
										</div>
									)}
								</div>
							</div>
							{lowPreview && lowPreview.length > 0 && (
								<button
									className="text-link"
									onClick={() => setView("low")}
									type="button"
								>
									View low stock <Icon name="arrow" size={16} />
								</button>
							)}
						</section>
					)}
					<section aria-label="Inventory items" className="inventory-card">
						<div className="card-header">
							<div>
								<span className="eyebrow">PARTS CATALOG</span>
								<h2>{view === "all" ? "All inventory" : "Needs restocking"}</h2>
							</div>
							<span className="result-count">
								{results.length} {status === "Exhausted" ? "items" : "shown"}
							</span>
						</div>
						<div className="toolbar">
							<label className="search-box">
								<Icon name="search" size={18} />
								<input
									aria-label="Search by name or SKU"
									onChange={(event) => setSearchInput(event.target.value)}
									placeholder="Search by name or SKU..."
									type="search"
									value={searchInput}
								/>
							</label>
							<label className="filter-box">
								<span>Category</span>
								<select
									aria-label="Filter by category"
									onChange={(event) =>
										setCategory(event.target.value as Category | "")
									}
									value={category}
								>
									<option value="">All categories</option>
									{CATEGORIES.map((value) => (
										<option key={value} value={value}>
											{value}
										</option>
									))}
								</select>
							</label>
						</div>
						{error && (
							<div className="inline-error" role="alert">
								{error}
								<button
									aria-label="Dismiss error"
									onClick={() => setError("")}
									type="button"
								>
									<Icon name="close" size={16} />
								</button>
							</div>
						)}
						<div className="table-scroll">
							<table className="inventory-table">
								<thead>
									<tr>
										<th>ITEM</th>
										<th>CATEGORY</th>
										<th>LOCATION</th>
										<th>ON HAND</th>
										<th>STATUS</th>
										<th className="actions-col">QUICK ADJUST</th>
									</tr>
								</thead>
								<tbody>
									{results.map((item) => (
										<tr key={item._id}>
											<td>
												<div className="item-cell">
													<ItemImage item={item} />
													<div>
														<strong>{item.commonName}</strong>
														<span>{item.sku}</span>
													</div>
												</div>
											</td>
											<td>
												<span className="category-text">{item.category}</span>
											</td>
											<td>
												<span className="location-text">{item.location}</span>
											</td>
											<td>
												<div className="quantity-cell">
													<strong>{item.quantity.toLocaleString()}</strong>
													<span>min. {item.lowThreshold.toLocaleString()}</span>
												</div>
											</td>
											<td>
												<span
													className={`status-pill ${item.isLow ? "status-low" : "status-good"}`}
												>
													<i />
													{item.isLow ? "Low stock" : "In stock"}
												</span>
											</td>
											<td>
												<div className="adjust-actions">
													<button
														aria-label={`Remove one ${item.commonName}`}
														disabled={
															pendingItem === item._id || item.quantity === 0
														}
														onClick={() => quickAdjust(item, -1)}
														type="button"
													>
														<Icon name="minus" size={16} />
													</button>
													<button
														aria-label={`Add one ${item.commonName}`}
														disabled={pendingItem === item._id}
														onClick={() => quickAdjust(item, 1)}
														type="button"
													>
														<Icon name="plus" size={16} />
													</button>
													<button
														className="adjust-custom"
														disabled={pendingItem === item._id}
														onClick={() => setAdjustItem(item)}
														type="button"
													>
														Custom
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{status === "LoadingFirstPage" && (
							<div className="empty-state">
								<span className="empty-icon">
									<Icon name="box" size={30} />
								</span>
								<h3>Loading inventory…</h3>
							</div>
						)}
						{status !== "LoadingFirstPage" && results.length === 0 && (
							<div className="empty-state">
								<span className="empty-icon">
									<Icon name={view === "low" ? "check" : "box"} size={30} />
								</span>
								<h3>
									{search || category
										? "No parts found"
										: view === "low"
											? "No parts are low in stock"
											: "Your inventory starts here"}
								</h3>
								<p>
									{search || category
										? "Try a different search or category."
										: view === "low"
											? "You’re all caught up for now."
											: "Add your first electrical part to start tracking stock."}
								</p>
								{!search && !category && view === "all" && (
									<button
										className="primary-button"
										onClick={() => setShowAdd(true)}
										type="button"
									>
										<Icon name="plus" size={17} /> Add first item
									</button>
								)}
							</div>
						)}
						{(status === "CanLoadMore" || status === "LoadingMore") && (
							<div className="load-more">
								<button
									disabled={status === "LoadingMore"}
									onClick={() => loadMore(24)}
									type="button"
								>
									{status === "LoadingMore" ? "Loading…" : "Load more items"}
								</button>
							</div>
						)}
					</section>
					<footer className="page-footer">
						VOLT INVENTORY <span>·</span> Keep every part accounted for.
					</footer>
				</div>
			</main>
			{showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
			{adjustItem && (
				<AdjustModal item={adjustItem} onClose={() => setAdjustItem(null)} />
			)}
		</div>
	);
}

function ModalFrame({
	title,
	subtitle,
	onClose,
	children,
}: {
	title: string;
	subtitle: string;
	onClose: () => void;
	children: ReactNode;
}) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);
	return (
		<div className="modal-backdrop">
			<div
				aria-labelledby="inventory-modal-title"
				aria-modal="true"
				className="modal-card"
				role="dialog"
			>
				<div className="modal-header">
					<div>
						<span className="eyebrow">INVENTORY MANAGEMENT</span>
						<h2 id="inventory-modal-title">{title}</h2>
						<p>{subtitle}</p>
					</div>
					<button
						aria-label="Close dialog"
						className="close-button"
						onClick={onClose}
						type="button"
					>
						<Icon name="close" size={20} />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}

function AddItemModal({ onClose }: { onClose: () => void }) {
	const createItem = useMutation(api.items.create);
	const generateUploadUrl = useMutation(api.items.generateUploadUrl);
	const [commonName, setCommonName] = useState("");
	const [sku, setSku] = useState("");
	const [category, setCategory] = useState<Category>("Terminals & Crimps");
	const [location, setLocation] = useState("");
	const [quantity, setQuantity] = useState("0");
	const [lowThreshold, setLowThreshold] = useState("10");
	const [photo, setPhoto] = useState<File | null>(null);
	const [preview, setPreview] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		if (!photo) {
			setPreview("");
			return;
		}
		const url = URL.createObjectURL(photo);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [photo]);
	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		const parsedQuantity = Number(quantity);
		const parsedThreshold = Number(lowThreshold);
		if (
			!Number.isSafeInteger(parsedQuantity) ||
			parsedQuantity < 0 ||
			!Number.isSafeInteger(parsedThreshold) ||
			parsedThreshold < 0
		) {
			setError(
				"Quantity and low-stock level must be whole numbers of zero or more.",
			);
			return;
		}
		setSaving(true);
		try {
			let imageId: Id<"_storage"> | undefined;
			if (photo) {
				const uploadUrl = await generateUploadUrl({});
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": photo.type },
					body: photo,
				});
				if (!response.ok)
					throw new Error("Photo upload failed. Please try again.");
				imageId = (await response.json()).storageId as Id<"_storage">;
			}
			await createItem({
				commonName,
				sku,
				category,
				location,
				quantity: parsedQuantity,
				lowThreshold: parsedThreshold,
				imageId,
			});
			onClose();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not add item.");
		} finally {
			setSaving(false);
		}
	}
	return (
		<ModalFrame
			onClose={onClose}
			subtitle="Give this part a home in your inventory."
			title="Add a new item"
		>
			<form onSubmit={onSubmit}>
				<div className="modal-body">
					<div className="field-grid">
						<label className="field field-full">
							<span>
								Common name <b>*</b>
							</span>
							<input
								maxLength={120}
								onChange={(event) => setCommonName(event.target.value)}
								placeholder="e.g. Insulated ring terminal"
								required
								value={commonName}
							/>
						</label>
						<label className="field">
							<span>
								SKU / part number <b>*</b>
							</span>
							<input
								maxLength={80}
								onChange={(event) => setSku(event.target.value)}
								placeholder="e.g. RING-12-10"
								required
								value={sku}
							/>
						</label>
						<label className="field">
							<span>
								Category <b>*</b>
							</span>
							<select
								onChange={(event) =>
									setCategory(event.target.value as Category)
								}
								value={category}
							>
								{CATEGORIES.map((value) => (
									<option key={value} value={value}>
										{value}
									</option>
								))}
							</select>
						</label>
						<label className="field field-full">
							<span>
								Location <b>*</b>
							</span>
							<input
								maxLength={120}
								onChange={(event) => setLocation(event.target.value)}
								placeholder="e.g. Shelf B · Bin 04"
								required
								value={location}
							/>
						</label>
						<label className="field">
							<span>
								Starting quantity <b>*</b>
							</span>
							<input
								min="0"
								onChange={(event) => setQuantity(event.target.value)}
								required
								step="1"
								type="number"
								value={quantity}
							/>
						</label>
						<label className="field">
							<span>
								Low-stock level <b>*</b>
							</span>
							<input
								min="0"
								onChange={(event) => setLowThreshold(event.target.value)}
								required
								step="1"
								type="number"
								value={lowThreshold}
							/>
						</label>
					</div>
					<label className="photo-field">
						<span>
							Part photo <em>OPTIONAL</em>
						</span>
						<span className="photo-drop">
							{preview ? (
								<>
									{/* biome-ignore lint/performance/noImgElement: The preview uses a local blob URL before upload. */}
									<img alt="Part preview" src={preview} />
									<span>Change photo</span>
								</>
							) : (
								<>
									<Icon name="upload" size={23} />
									<strong>Click to upload a photo</strong>
									<small>JPG, PNG or WebP · up to 5 MB</small>
								</>
							)}
						</span>
						<input
							accept="image/jpeg,image/png,image/webp"
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (!file) return;
								if (
									!["image/jpeg", "image/png", "image/webp"].includes(
										file.type,
									) ||
									file.size > 5 * 1024 * 1024
								) {
									setError("Choose a JPG, PNG, or WebP photo up to 5 MB.");
									event.target.value = "";
									return;
								}
								setError("");
								setPhoto(file);
							}}
							type="file"
						/>
					</label>
					{error && (
						<p className="form-error" role="alert">
							{error}
						</p>
					)}
				</div>
				<div className="modal-footer">
					<button className="secondary-button" onClick={onClose} type="button">
						Cancel
					</button>
					<button className="primary-button" disabled={saving} type="submit">
						{saving ? "Adding item…" : "Add item"}{" "}
						<Icon name="arrow" size={16} />
					</button>
				</div>
			</form>
		</ModalFrame>
	);
}

function AdjustModal({ item, onClose }: { item: Item; onClose: () => void }) {
	const adjustStock = useMutation(api.items.adjustStock);
	const [direction, setDirection] = useState<"add" | "remove">("add");
	const [amount, setAmount] = useState("1");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		const parsed = Number(amount);
		if (!Number.isSafeInteger(parsed) || parsed <= 0) {
			setError("Enter a positive whole number.");
			return;
		}
		if (direction === "remove" && parsed > item.quantity) {
			setError(`Only ${item.quantity} are currently in stock.`);
			return;
		}
		setSaving(true);
		try {
			await adjustStock({
				itemId: item._id,
				amount: direction === "add" ? parsed : -parsed,
			});
			onClose();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not update stock.",
			);
		} finally {
			setSaving(false);
		}
	}
	const parsed = Number(amount);
	const newQuantity =
		Number.isSafeInteger(parsed) && parsed > 0
			? item.quantity + (direction === "add" ? parsed : -parsed)
			: null;
	return (
		<ModalFrame
			onClose={onClose}
			subtitle={`${item.commonName} · ${item.sku}`}
			title="Adjust stock"
		>
			<form onSubmit={onSubmit}>
				<div className="modal-body">
					<div className="stock-current">
						<ItemImage item={item} small />
						<div>
							<span>Currently on hand</span>
							<strong>{item.quantity.toLocaleString()} units</strong>
						</div>
					</div>
					<div className="direction-toggle">
						<button
							className={direction === "add" ? "selected" : ""}
							onClick={() => setDirection("add")}
							type="button"
						>
							<Icon name="plus" size={17} /> Add stock
						</button>
						<button
							className={direction === "remove" ? "selected" : ""}
							onClick={() => setDirection("remove")}
							type="button"
						>
							<Icon name="minus" size={17} /> Remove stock
						</button>
					</div>
					<label className="field">
						<span>
							Amount <b>*</b>
						</span>
						<input
							min="1"
							onChange={(event) => setAmount(event.target.value)}
							required
							step="1"
							type="number"
							value={amount}
						/>
					</label>
					<p className="adjust-hint">
						New quantity:{" "}
						<strong>
							{newQuantity !== null && newQuantity >= 0
								? newQuantity.toLocaleString()
								: "—"}
						</strong>
					</p>
					{error && (
						<p className="form-error" role="alert">
							{error}
						</p>
					)}
				</div>
				<div className="modal-footer">
					<button className="secondary-button" onClick={onClose} type="button">
						Cancel
					</button>
					<button className="primary-button" disabled={saving} type="submit">
						{saving ? "Saving…" : "Update stock"}{" "}
						<Icon name="arrow" size={16} />
					</button>
				</div>
			</form>
		</ModalFrame>
	);
}
