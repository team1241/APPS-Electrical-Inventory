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
  const items = useQuery(api.inventory.list, {});
  const categoryRecords = useQuery(api.inventoryCategories.list, {});
  const ensureDefaultCategories = useMutation(api.inventoryCategories.ensureDefaults);
  const createItem = useMutation(api.inventory.create);
  const updateItem = useMutation(api.inventory.update);
  const adjustQuantity = useMutation(api.inventory.adjustQuantity);
  const removeItem = useMutation(api.inventory.remove);
  const createCategory = useMutation(api.inventoryCategories.create);
  const renameCategory = useMutation(api.inventoryCategories.rename);
  const removeCategory = useMutation(api.inventoryCategories.remove);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All supplies");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"inventory" | "reorder">("inventory");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const categorySeedRequested = useRef(false);

  useEffect(() => {
    if (!categoryRecords || categoryRecords.length > 0 || categorySeedRequested.current) return;
    categorySeedRequested.current = true;
    void ensureDefaultCategories({}).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : "Could not load supply categories.");
    });
  }, [categoryRecords, ensureDefaultCategories]);

  const inventory = items ?? [];
  const lowStockCount = inventory.filter((item) => itemStatus(item) === "low").length;
  const outOfStockCount = inventory.filter((item) => itemStatus(item) === "out").length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const categoryCounts = inventory.reduce<Record<string, number>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, {});
  const categories = [...new Set([
    ...(categoryRecords?.length ? categoryRecords.map((category) => category.name) : defaultCategories),
    ...inventory.map((item) => item.category),
  ])];
  const filteredItems = inventory.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [item.sku, item.name, item.category, item.location, item.supplier ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesCategory = categoryFilter === "All supplies" || item.category === categoryFilter;
    const status = itemStatus(item);
    const matchesStatus = activeTab === "inventory"
      ? statusFilter === "all" || statusFilter === status
      : status !== "good" && (statusFilter === "all" || statusFilter === status);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const reorderCount = lowStockCount + outOfStockCount;

  function openNewItem() {
    setEditingItem(null);
    setDraft({ ...emptyDraft, category: categories[0] ?? "Other" });
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditItem(item: InventoryItem) {
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
    });
    setFormError("");
    setIsFormOpen(true);
  }

  function openCategoryManager() {
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
      setCategoryError(error instanceof Error ? error.message : "Could not add this category.");
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function saveCategory(category: InventoryCategory) {
    setCategoryError("");
    setIsCategorySaving(true);
    try {
      await renameCategory({ id: category._id, name: editedCategoryName });
      if (categoryFilter === category.name) setCategoryFilter(editedCategoryName.trim());
      setEditingCategory(null);
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not rename this category.");
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
      setCategoryError(error instanceof Error ? error.message : "Could not remove this category.");
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const quantity = Number(draft.quantity);
    const minimumQuantity = Number(draft.minimumQuantity);
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
      setFormError("Enter valid, non-negative stock quantities.");
      return;
    }

    const supplier = draft.supplier.trim();
    const itemData = {
      sku: draft.sku,
      name: draft.name,
      category: draft.category,
      unit: draft.unit,
      quantity,
      minimumQuantity,
      location: draft.location,
      ...(supplier ? { supplier } : {}),
    };

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...itemData });
        setNotice(`${draft.name.trim()} updated`);
      } else {
        await createItem(itemData);
        setNotice(`${draft.name.trim()} added to inventory`);
      }
      setIsFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save this item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStock(item: InventoryItem, change: number) {
    setNotice("");
    try {
      await adjustQuantity({ id: item._id, change });
      setNotice(`${item.name}: stock ${change > 0 ? "received" : "issued"}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update stock.");
    }
  }

  async function deleteItem(item: InventoryItem) {
    if (!window.confirm(`Remove ${item.name} (${item.sku}) from inventory?`)) return;
    try {
      await removeItem({ id: item._id });
      setNotice(`${item.name} removed`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove this item.");
    }
  }

  return (
    <main className="stockroom-shell">
      <header className="topbar">
        <a className="brand" href="#inventory" aria-label="1241 Electrical Inventory Tracker home">
          <Image alt="" className="brand-mark" height={38} priority src="/theory6-apps-logo.jpg" width={38} />
          <span className="brand-copy"><strong>1241</strong><small>ELECTRICAL INVENTORY</small></span>
        </a>
        <div className="topbar-divider" />
        <div className="workspace-label"><span className="workspace-dot" />Workshop inventory</div>
        <div className="topbar-spacer" />
        <span className="sync-indicator"><span />Live inventory</span>
        <div aria-hidden="true" className="user-avatar">W</div>
      </header>

      <div className="workspace" id="inventory">
        <aside className="sidebar">
          <div className="sidebar-label">WORKSPACE</div>
          <button className="nav-current" type="button">
            <span className="nav-icon" aria-hidden="true">▦</span>
            <span>Inventory</span>
            <span className="nav-count">{inventory.length}</span>
          </button>

          <div className="sidebar-section-heading">
            <span>SUPPLY CATEGORIES</span>
            <button aria-label="Manage supply categories" className="category-manage-trigger" onClick={openCategoryManager} title="Manage supply categories" type="button">Edit</button>
            <span className="sidebar-rule" />
          </div>
          <button
            className={`category-link ${categoryFilter === "All supplies" ? "selected" : ""}`}
            onClick={() => setCategoryFilter("All supplies")}
            type="button"
          >
            <span className="category-dot all-dot" />All supplies<span className="category-count">{inventory.length}</span>
          </button>
          {categories.map((category, index) => (
            <button
              className={`category-link ${categoryFilter === category ? "selected" : ""}`}
              key={category}
              onClick={() => setCategoryFilter(categoryFilter === category ? "All supplies" : category)}
              type="button"
            >
              <span className={`category-dot category-tone-${index}`} />
              <span className="category-name">{category}</span>
              <span className="category-count">{categoryCounts[category] ?? 0}</span>
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
            <span className="status-dot low-dot" />Low stock<span className="category-count">{lowStockCount}</span>
          </button>
          <button
            className={`status-link ${statusFilter === "out" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("reorder");
              setStatusFilter(statusFilter === "out" ? "all" : "out");
            }}
            type="button"
          >
            <span className="status-dot out-dot" />Out of stock<span className="category-count">{outOfStockCount}</span>
          </button>

          <div className="sidebar-footnote">
            <Image alt="" className="footnote-mark" height={27} src="/theory6-apps-logo.jpg" width={27} />
            <span>Keep every connection<br />in good supply.</span>
          </div>
        </aside>

        <section className="main-panel">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span /> ELECTRICAL SUPPLIES</div>
              <h1>{activeTab === "reorder" ? "Reorder list" : "Inventory"}</h1>
              <p className="page-subtitle">{activeTab === "reorder" ? "Supplies at or below their minimum stock level." : "A clear view of what is on the shelf and what needs a restock."}</p>
            </div>
            <button className="primary-button" onClick={openNewItem} type="button">
              <span aria-hidden="true">+</span> Add supply
            </button>
          </div>

          <section aria-label="Inventory summary" className="metrics-row">
            <div className="metric">
              <span className="metric-label">ITEMS TRACKED</span>
              <strong>{inventory.length.toLocaleString()}</strong>
              <span className="metric-note">unique supply lines</span>
            </div>
            <div className="metric">
              <span className="metric-label">UNITS ON HAND</span>
              <strong>{totalUnits.toLocaleString()}</strong>
              <span className="metric-note">across all supplies</span>
            </div>
            <div className="metric metric-alert">
              <span className="metric-label">NEEDS ATTENTION</span>
              <strong>{(lowStockCount + outOfStockCount).toLocaleString()}</strong>
              <span className="metric-note">at or below minimum</span>
            </div>
          </section>

          <div className="inventory-toolbar">
            <div className="toolbar-title">
              <h2>{activeTab === "reorder" ? "Supplies to reorder" : "Supply list"}</h2>
              <span className="result-count">{filteredItems.length}</span>
              <button className="category-toolbar-action" onClick={openCategoryManager} type="button">Manage categories</button>
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
              <kbd>/</kbd>
            </label>
            <div aria-label="Inventory views" className="inventory-tabs" role="tablist">
              <button
                aria-selected={activeTab === "inventory"}
                className={activeTab === "inventory" ? "active" : ""}
                aria-controls="inventory-panel"
                id="inventory-tab"
                onClick={() => { setActiveTab("inventory"); setStatusFilter("all"); }}
                role="tab"
                type="button"
              >Inventory</button>
              <button
                aria-selected={activeTab === "reorder"}
                className={activeTab === "reorder" ? "active" : ""}
                aria-controls="reorder-panel"
                id="reorder-tab"
                onClick={() => { setActiveTab("reorder"); setStatusFilter("all"); }}
                role="tab"
                type="button"
              >Reorder list<span className="tab-count">{reorderCount}</span></button>
            </div>
          </div>

          {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")} type="button">×</button></div>}

          <section
            aria-labelledby={activeTab === "reorder" ? "reorder-tab" : "inventory-tab"}
            className="table-frame"
            id={activeTab === "reorder" ? "reorder-panel" : "inventory-panel"}
            role="tabpanel"
          >
            <div className="table-scroll">
              <table aria-labelledby={activeTab === "reorder" ? "reorder-tab" : "inventory-tab"} className="inventory-table">
                <thead>
                  <tr>
                    <th className="item-column">SUPPLY</th>
                    <th>SKU</th>
                    {activeTab === "reorder" ? <>
                      <th>ON HAND</th>
                      <th>MINIMUM</th>
                      <th>SUGGESTED QTY</th>
                      <th>LOCATION / SUPPLIER</th>
                    </> : <>
                      <th>ON HAND</th>
                      <th>STATUS</th>
                      <th>LOCATION</th>
                      <th>UPDATED</th>
                    </>}
                    <th><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items === undefined ? (
                    <tr><td className="table-state" colSpan={7}><span className="loading-mark" />Connecting to stockroom...</td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td className="table-state" colSpan={7}>
                        <div className="empty-state">
                          <span className="empty-mark" aria-hidden="true">⌁</span>
                          <strong>{activeTab === "reorder" ? "Nothing needs reordering" : inventory.length === 0 ? "Your supply list starts here" : "No supplies match this view"}</strong>
                          <span>{activeTab === "reorder" ? "Low- and out-of-stock supplies will appear here." : inventory.length === 0 ? "Add the electrical materials you keep on hand." : "Try another search or category."}</span>
                          {activeTab === "inventory" && inventory.length === 0 && <button className="text-action" onClick={openNewItem} type="button">Add your first supply <span aria-hidden="true">→</span></button>}
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.map((item) => {
                    const status = itemStatus(item);
                    return (
                      <tr key={item._id}>
                        <td className="item-cell">
                          <span className={`item-monogram monogram-${categories.indexOf(item.category) < 0 ? 6 : categories.indexOf(item.category)}`} aria-hidden="true">
                            {item.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="item-description">
                            <strong>{item.name}</strong>
                            <small>{item.category}</small>
                          </span>
                        </td>
                        <td className="sku-cell">{item.sku}</td>
                        {activeTab === "reorder" ? <>
                          <td><span className={`stock-badge ${status}`}><span />{item.quantity.toLocaleString()} {item.unit}</span></td>
                          <td className="reorder-minimum">{item.minimumQuantity.toLocaleString()} {item.unit}</td>
                          <td><strong className="suggested-quantity">{Math.max(1, item.minimumQuantity - item.quantity).toLocaleString()} {item.unit}</strong></td>
                          <td className="reorder-location"><strong>{item.location}</strong><span>{item.supplier || "Supplier not set"}</span></td>
                        </> : <>
                          <td>
                            <div className="quantity-control">
                              <button aria-label={`Issue one ${item.unit} of ${item.name}`} disabled={item.quantity <= 0} onClick={() => void changeStock(item, -1)} title="Issue one unit" type="button">−</button>
                              <strong>{item.quantity.toLocaleString()}</strong>
                              <span>{item.unit}</span>
                              <button aria-label={`Receive one ${item.unit} of ${item.name}`} onClick={() => void changeStock(item, 1)} title="Receive one unit" type="button">+</button>
                            </div>
                          </td>
                          <td><span className={`stock-badge ${status}`}><span />{status === "good" ? "In stock" : status === "low" ? "Low stock" : "Out of stock"}</span></td>
                          <td className="location-cell">{item.location}</td>
                          <td className="updated-cell">{formatUpdatedAt(item.updatedAt)}</td>
                        </>}
                        <td>
                          <div className="row-actions">
                            <button aria-label={`Edit ${item.name}`} onClick={() => openEditItem(item)} title="Edit item" type="button">Edit</button>
                            <button aria-label={`Remove ${item.name}`} className="remove-action" onClick={() => void deleteItem(item)} title="Remove item" type="button">×</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">
              <span>Stock counts update as supplies are received or issued.</span>
              <span><span className="footer-live-dot" /> Synced live</span>
            </footer>
          </section>

          <div className="restock-strip">
            <div className="restock-symbol" aria-hidden="true">!</div>
            <div><strong>{outOfStockCount > 0 ? `${outOfStockCount} item${outOfStockCount === 1 ? "" : "s"} out of stock` : lowStockCount > 0 ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} running low` : "Stock levels look good"}</strong><span>{outOfStockCount + lowStockCount > 0 ? "Review supplies at or below their minimum level." : "Items below their minimum level will appear here."}</span></div>
            <button onClick={() => { setActiveTab("reorder"); setStatusFilter("all"); }} type="button">Open reorder list <span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop">
          <section
            aria-labelledby="item-form-title"
            aria-modal="true"
            className="item-modal"
            onKeyDown={(event) => { if (event.key === "Escape") setIsFormOpen(false); }}
            role="dialog"
            tabIndex={-1}
          >
            <div className="modal-heading">
              <div><span className="modal-kicker">STOCKROOM RECORD</span><h2 id="item-form-title">{editingItem ? "Edit supply" : "Add a supply"}</h2></div>
              <button aria-label="Close dialog" className="modal-close" onClick={() => setIsFormOpen(false)} type="button">×</button>
            </div>
            <form onSubmit={(event) => void saveItem(event)}>
              <div className="form-grid">
                <label className="form-field span-two"><span>Item name <i>*</i></span><input onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. THHN copper wire, 12 AWG" required value={draft.name} /></label>
                <label className="form-field"><span>SKU / part number <i>*</i></span><input onChange={(event) => setDraft({ ...draft, sku: event.target.value })} placeholder="e.g. WIR-THHN-12-BLK" required value={draft.sku} /></label>
                <label className="form-field"><span>Category <i>*</i></span><select onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category}>{[...new Set([...categories, ...(draft.category && !categories.includes(draft.category) ? [draft.category] : [])])].map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="form-field"><span>Quantity on hand <i>*</i></span><div className="number-with-unit"><input min="0" onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} required step="any" type="number" value={draft.quantity} /><select aria-label="Stock unit" onChange={(event) => setDraft({ ...draft, unit: event.target.value })} value={draft.unit}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></div></label>
                <label className="form-field"><span>Minimum stock <i>*</i></span><input min="0" onChange={(event) => setDraft({ ...draft, minimumQuantity: event.target.value })} required step="any" type="number" value={draft.minimumQuantity} /></label>
                <label className="form-field"><span>Storage location <i>*</i></span><input onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="e.g. Aisle 2 · Bin 04" required value={draft.location} /></label>
                <label className="form-field"><span>Supplier</span><input onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} placeholder="Supplier name" value={draft.supplier} /></label>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="modal-actions"><button className="cancel-button" onClick={() => setIsFormOpen(false)} type="button">Cancel</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingItem ? "Save changes" : "Add to inventory"}</button></div>
            </form>
          </section>
        </div>
      )}

      {isCategoryManagerOpen && (
        <div className="modal-backdrop">
          <section
            aria-labelledby="category-manager-title"
            aria-modal="true"
            className="item-modal category-manager"
            onKeyDown={(event) => { if (event.key === "Escape") setIsCategoryManagerOpen(false); }}
            role="dialog"
            tabIndex={-1}
          >
            <div className="modal-heading">
              <div><span className="modal-kicker">INVENTORY SETTINGS</span><h2 id="category-manager-title">Supply categories</h2></div>
              <button aria-label="Close category manager" className="modal-close" onClick={() => setIsCategoryManagerOpen(false)} type="button">×</button>
            </div>
            <p className="category-manager-copy">Renaming a category updates its supplies. Move supplies to another category before removing it.</p>
            <div className="category-manager-list">
              {categoryRecords === undefined ? <p className="category-manager-empty">Loading categories...</p> : categoryRecords.map((category) => {
                const itemCount = categoryCounts[category.name] ?? 0;
                const isEditing = editingCategory?._id === category._id;
                return (
                  <div className="category-manager-row" key={category._id}>
                    {isEditing ? (
                      <input
                        aria-label={`Rename ${category.name}`}
                        maxLength={40}
                        onChange={(event) => setEditedCategoryName(event.target.value)}
                        value={editedCategoryName}
                      />
                    ) : <strong>{category.name}</strong>}
                    <span className="category-manager-count">{itemCount} {itemCount === 1 ? "supply" : "supplies"}</span>
                    {isEditing ? (
                      <>
                        <button className="category-row-action" disabled={isCategorySaving} onClick={() => void saveCategory(category)} type="button">Save</button>
                        <button className="category-row-action subtle" onClick={() => setEditingCategory(null)} type="button">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="category-row-action" onClick={() => { setEditingCategory(category); setEditedCategoryName(category.name); setCategoryError(""); }} type="button">Rename</button>
                        <button
                          aria-label={`Remove ${category.name}`}
                          className="category-row-action subtle"
                          disabled={isCategorySaving || itemCount > 0}
                          onClick={() => void deleteCategory(category)}
                          title={itemCount > 0 ? "Move supplies before removing this category" : "Remove category"}
                          type="button"
                        >Remove</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <form className="category-add-form" onSubmit={(event) => void addCategory(event)}>
              <label className="form-field" htmlFor="new-category-name"><span>New category</span></label>
              <div className="category-add-controls">
                <input id="new-category-name" maxLength={40} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="e.g. Test equipment" required value={newCategoryName} />
                <button className="primary-button" disabled={isCategorySaving} type="submit">Add</button>
              </div>
            </form>
            {categoryError && <p className="form-error" role="alert">{categoryError}</p>}
          </section>
        </div>
      )}
    </main>
  );
}