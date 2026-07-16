// "Live Fresh" is the brand mark. It's intentionally not editable — the
// point of the product is that every logo carries the same brand identity,
// only the lake changes. If you ever need a second brand line/sub-brand,
// add a new fixed constant rather than making this a free-text field.
export const BRAND_TEXT = "Live Fresh";

export const FONT_OPTIONS = [
  { label: "Script (Great Vibes)", value: "'Great Vibes', cursive", capHeightRatio: 0.56 },
  { label: "Bold Script (Pacifico)", value: "'Pacifico', cursive", capHeightRatio: 0.66 },
  { label: "Clean Sans (Montserrat)", value: "'Montserrat', sans-serif", capHeightRatio: 0.72 },
  { label: "Condensed (Oswald)", value: "'Oswald', sans-serif", capHeightRatio: 0.75 },
  { label: "Serif (Playfair Display)", value: "'Playfair Display', serif", capHeightRatio: 0.70 },
];

// The lake name always renders in Montserrat.
export const NAME_FONT_CAP_HEIGHT_RATIO = 0.72;

// Script fonts (like the default "Great Vibes") have noticeably smaller
// glyphs than sans-serif fonts at the same point size — a 34px script font
// can visually read as roughly the same size as a 22px sans-serif label,
// even though the raw numbers suggest the brand text is much bigger. This
// factor guarantees "Live Fresh" always reads as the dominant text,
// regardless of font choice or the text-size slider.
export const MIN_BRAND_TO_NAME_VISUAL_RATIO = 1.6;

// baseScale/cx/cy define where the lake silhouette sits by default in each
// template's viewBox (before any manual resize/drag is applied). lakeScale
// multiplies baseScale, and the translate is recalculated so scaling always
// happens around this same visual center instead of drifting to a corner.
export const TEMPLATES = {
  stacked: {
    label: "Stacked (silhouette, script, name)",
    viewBox: "0 0 500 620",
    baseScale: 1,
    cx: 250,
    cy: 250,
    brandFontSize: 72,
    nameFontSize: 26,
    brandY: 545,
    nameY: 595,
  },
  badge: {
    label: "Badge (circle border, name only)",
    viewBox: "0 0 500 500",
    baseScale: 0.68,
    cx: 250,
    cy: 300,
    brandFontSize: 34,
    nameFontSize: 22,
    brandY: 90,
    nameY: 440,
  },
  sideBySide: {
    label: "Side-by-side (silhouette left, text right)",
    viewBox: "0 0 700 500",
    baseScale: 0.8,
    cx: 210,
    cy: 200,
    brandFontSize: 56,
    nameFontSize: 24,
    brandY: 220,
    nameY: 270,
  },
};

// Curated color/fill presets for the simplified customer-facing flow. Kept
// separate from the raw color pickers in the advanced editor so customers
// choose from print-safe, pre-approved looks instead of picking arbitrary
// hex values.
export const COLOR_PRESETS = [
  {
    id: "classicBlack",
    label: "Classic black",
    fillMode: "filled",
    fillColor: "#111111",
    strokeColor: "#111111",
    strokeWidth: 0,
    swatch: "#111111",
  },
  {
    id: "navyOutline",
    label: "Navy outline",
    fillMode: "outline",
    fillColor: "#1b2a4a",
    strokeColor: "#1b2a4a",
    strokeWidth: 4,
    swatch: "#1b2a4a",
  },
  {
    id: "whiteForDark",
    label: "White (for dark shirts)",
    fillMode: "filled",
    fillColor: "#ffffff",
    strokeColor: "#ffffff",
    strokeWidth: 0,
    swatch: "#ffffff",
  },
  {
    id: "forestGreen",
    label: "Forest green",
    fillMode: "filled",
    fillColor: "#1f4d3a",
    strokeColor: "#1f4d3a",
    strokeWidth: 0,
    swatch: "#1f4d3a",
  },
];

export const SIZE = 500;
