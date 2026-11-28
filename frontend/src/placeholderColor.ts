export type PlaceholderColor = { background: string; foreground: string };

/**
 * Warm, food-friendly colours for recipes without a photo. Each text colour
 * has at least 4.5:1 contrast with its background (WCAG AA, even for small text).
 */
export const PLACEHOLDER_PALETTE: readonly PlaceholderColor[] = [
  { background: "#B83A2E", foreground: "#FFFFFF" }, // tomato
  { background: "#F4C542", foreground: "#3B2A00" }, // saffron
  { background: "#C4501A", foreground: "#FFFFFF" }, // paprika
  { background: "#5E7F2A", foreground: "#FFFFFF" }, // olive
  { background: "#FBE7A1", foreground: "#5A3E00" }, // butter
  { background: "#8E3B5B", foreground: "#FFFFFF" }, // beetroot
  { background: "#8B4513", foreground: "#FFFFFF" }, // cinnamon
  { background: "#F7B79A", foreground: "#5A2410" }, // peach
  { background: "#3E7B4F", foreground: "#FFFFFF" }, // basil
  { background: "#E0A458", foreground: "#3D2200" }, // caramel
];

/** 32-bit FNV-1a hash of the string's UTF-16 code units. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The placeholder colour for a recipe; the same id always gets the same colour. */
export function placeholderColor(id: string): PlaceholderColor {
  return PLACEHOLDER_PALETTE[fnv1a(id) % PLACEHOLDER_PALETTE.length];
}

/** The first letter of the title, uppercased, or "?" for a blank title. */
export function placeholderInitial(title: string): string {
  const first = [...title.trim()][0];
  return first === undefined ? "?" : first.toUpperCase();
}
