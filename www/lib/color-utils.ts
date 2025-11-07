/**
 * Color conversion utilities for OKLCH <-> Hex conversion
 */

/**
 * Converts OKLCH color string to hex
 * @param oklchString - OKLCH color string (e.g., "oklch(70% 0.15 180)")
 * @returns Hex color string (e.g., "#aabbcc")
 */
export function oklchToHex(oklchString: string): string {
  // Parse OKLCH string: oklch(L% C H) or oklch(L% C H / alpha)
  const match = oklchString.match(
    /oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/,
  );
  if (!match) {
    // Fallback: try to parse as hex or return default
    if (oklchString.startsWith("#")) {
      return oklchString;
    }
    return "#000000";
  }

  const L = parseFloat(match[1]) / 100; // Convert percentage to 0-1
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]) * (Math.PI / 180); // Convert degrees to radians

  // Convert OKLCH to OKLab
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  // Convert OKLab to linear RGB
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const n = L - 0.0894841775 * a - 0.1128386874 * b;

  const l_ = l ** 3;
  const m_ = m ** 3;
  const n_ = n ** 3;

  const r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * n_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * n_;
  const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * n_;

  // Convert linear RGB to sRGB
  const rLinear = Math.max(0, Math.min(1, r));
  const gLinear = Math.max(0, Math.min(1, g));
  const bLinear = Math.max(0, Math.min(1, bl));

  const rSRGB = rLinear <= 0.0031308
    ? 12.92 * rLinear
    : 1.055 * rLinear ** (1 / 2.4) - 0.055;
  const gSRGB = gLinear <= 0.0031308
    ? 12.92 * gLinear
    : 1.055 * gLinear ** (1 / 2.4) - 0.055;
  const bSRGB = bLinear <= 0.0031308
    ? 12.92 * bLinear
    : 1.055 * bLinear ** (1 / 2.4) - 0.055;

  // Convert to 0-255 and then to hex
  const r255 = Math.round(Math.max(0, Math.min(255, rSRGB * 255)));
  const g255 = Math.round(Math.max(0, Math.min(255, gSRGB * 255)));
  const b255 = Math.round(Math.max(0, Math.min(255, bSRGB * 255)));

  return `#${r255.toString(16).padStart(2, "0")}${g255.toString(16).padStart(2, "0")}${b255.toString(16).padStart(2, "0")}`;
}

/**
 * Converts hex color string to OKLCH
 * @param hexString - Hex color string (e.g., "#aabbcc" or "aabbcc")
 * @returns OKLCH color string (e.g., "oklch(70% 0.15 180)")
 */
export function hexToOklch(hexString: string): string {
  // Normalize hex string
  let hex = hexString.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length !== 6) {
    return "oklch(50% 0 0)"; // Default fallback
  }

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const bl = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert sRGB to linear RGB
  const rLinear = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  const gLinear = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
  const bLinear = bl <= 0.04045 ? bl / 12.92 : ((bl + 0.055) / 1.055) ** 2.4;

  // Convert linear RGB to OKLab
  const l = 0.4122214708 * rLinear + 0.5363325363 * gLinear + 0.0514459929 * bLinear;
  const m = 0.2119034982 * rLinear + 0.6806995451 * gLinear + 0.1073969566 * bLinear;
  const n = 0.0883024619 * rLinear + 0.2817188376 * gLinear + 0.6299787005 * bLinear;

  const l_ = l ** (1 / 3);
  const m_ = m ** (1 / 3);
  const n_ = n ** (1 / 3);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * n_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * n_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * n_;

  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + b * b);
  let H = Math.atan2(b, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  // Format as OKLCH string
  return `oklch(${Math.round(L * 100)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
}

