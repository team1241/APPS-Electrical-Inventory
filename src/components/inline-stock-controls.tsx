"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { optimisticStockChange } from "@/lib/stock-adjustment";

type Item = FunctionReturnType<typeof api.inventory.list>["page"][number];

export function InlineStockControls({
  item,
  kiosk = false,
  onNotice,
}: {
  item: Item;
  kiosk?: boolean;
  onNotice: (message: string) => void;
}) {
  const adjust = useMutation(api.inventory.adjustQuantity).withOptimisticUpdate(
    optimisticStockChange,
  );
  const [amount, setAmount] = useState("1");
  const [pending, setPending] = useState(false);
  const quantity = Number(amount);
  const valid =
    Number.isFinite(quantity) && quantity > 0 && quantity <= Number.MAX_SAFE_INTEGER;

  async function change(value: number) {
    if (pending || !Number.isFinite(value) || value === 0) return;
    if (item.quantity + value < 0) {
      onNotice(`${item.name}: cannot remove more than is on hand.`);
      return;
    }
    setPending(true);
    try {
      await adjust({ id: item._id, change: value });
      onNotice(
        `${item.name}: ${Math.abs(value).toLocaleString()} ${item.unit} ${value > 0 ? "added" : "removed"}`,
      );
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not update stock.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`inline-stock-controls${kiosk ? " kiosk-stock-control" : ""}`}>
      <fieldset
        className="quick-stock-controls"
        aria-label={`Quick stock controls for ${item.name}`}
      >
        <button
          aria-label={`Issue one ${item.unit} of ${item.name}`}
          className="stock-remove quick-stock-button"
          disabled={pending || item.quantity < 1}
          onClick={() => void change(-1)}
          title="Remove one"
          type="button"
        >
          −
        </button>
        <span className="current-stock" aria-live="polite">
          <strong>{item.quantity.toLocaleString()}</strong>
          <small>{item.unit}</small>
        </span>
        <button
          aria-label={`Receive one ${item.unit} of ${item.name}`}
          className="stock-add quick-stock-button"
          disabled={pending}
          onClick={() => void change(1)}
          title="Add one"
          type="button"
        >
          +
        </button>
      </fieldset>
      <div className="custom-stock-controls">
        <label>
          <span>Amount</span>
          <input
            aria-label={`Custom amount for ${item.name}`}
            disabled={pending}
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            step="any"
            type="number"
            value={amount}
          />
        </label>
        <button
          aria-label={`Remove custom amount from ${item.name}`}
          className="stock-remove custom-remove"
          disabled={pending || !valid || quantity > item.quantity}
          onClick={() => void change(-quantity)}
          type="button"
        >
          − Remove
        </button>
        <button
          aria-label={`Add custom amount to ${item.name}`}
          className="stock-add custom-add"
          disabled={pending || !valid}
          onClick={() => void change(quantity)}
          type="button"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
