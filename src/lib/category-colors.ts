export const CATEGORY_COLORS = [
  { name: "Ocean blue", value: "#3b6ca8" },
  { name: "Teal", value: "#2e7d75" },
  { name: "Sage green", value: "#527d45" },
  { name: "Amber", value: "#aa7a24" },
  { name: "Terracotta", value: "#af5d45" },
  { name: "Plum", value: "#856080" },
  { name: "Slate", value: "#64748b" },
] as const;

export function categoryTint(color: string) {
  return { backgroundColor: `${color}18`, borderColor: `${color}55` };
}
