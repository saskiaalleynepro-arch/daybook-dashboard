/** Given a hex color, returns black or white — whichever gives better
 *  contrast as text/icon color on top of it. Uses the standard relative
 *  luminance approximation rather than full WCAG contrast ratio, which is
 *  more than precise enough for picking between two fixed options. */
export function readableTextColor(hex: string): '#18181b' | '#ffffff' {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#18181b';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#18181b' : '#ffffff';
}

/** Lightens a hex color by mixing it toward white — used for the "not done"
 *  cell background so each habit's row still reads as that habit's color,
 *  just muted, rather than a flat neutral gray for every row. */
export function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
