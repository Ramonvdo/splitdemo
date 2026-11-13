/** Joins class names, skipping the ones that are off. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Ink or white, whichever reads better on `hex`. For text on the demo's accent colour. */
export function onColor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast with white is 1.05 / (L + 0.05); with the ink (L about 0.009) it is (L + 0.05) / 0.059.
  return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.059 ? "#ffffff" : "#16181d";
}
