"use client";

import { useState } from "react";
import { CATEGORY_COLORS } from "@/lib/category-colors";

export function CategoryColorPicker({ name, color, disabled, onSave, className = "" }: {
  name: string;
  color: string;
  disabled: boolean;
  onSave: (color: string) => Promise<void>;
  className?: string;
}) {
  const [custom, setCustom] = useState(color);
  const valid = /^#[0-9a-f]{6}$/i.test(custom);
  return <fieldset className={`category-palette ${className}`} disabled={disabled}>
    <legend>Color for {name}</legend>
    <div className="palette-swatches">{CATEGORY_COLORS.map((swatch) => <button key={swatch.value} type="button" title={swatch.name} aria-label={swatch.name} aria-pressed={color.toLowerCase() === swatch.value} style={{ backgroundColor: swatch.value }} onClick={() => { setCustom(swatch.value); void onSave(swatch.value); }}><span aria-hidden="true">{color.toLowerCase() === swatch.value ? "✓" : ""}</span></button>)}</div>
    <div className="custom-color-controls">
      <label className="custom-color-picker">Custom color<input aria-label={`Custom color for ${name}`} type="color" value={valid ? custom : color} onChange={(event) => setCustom(event.target.value)} /></label>
      <input aria-label={`Hex color for ${name}`} className="hex-color-input" value={custom} maxLength={7} spellCheck={false} onChange={(event) => setCustom(event.target.value)} />
      <button type="button" className="cancel-button" disabled={!valid} onClick={() => void onSave(custom)}>Apply color</button>
    </div>
  </fieldset>;
}
