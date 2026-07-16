/**
 * Converts a point on a circle (center cx,cy, radius r) at the given angle
 * into x/y coordinates. Angle convention used throughout this module: 0° is
 * the rightmost point (3 o'clock), and angle increases clockwise as it
 * would appear on screen (90° = bottom/6 o'clock, 180° = left/9 o'clock,
 * 270° = top/12 o'clock).
 */
export function polarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Builds an SVG arc path `d` string between two angles on a circle, always
 * sweeping in the increasing-angle (clockwise) direction. This one rule is
 * all that's needed for both the top and bottom badge text: centering the
 * bottom arc around 90° (straight down) with start < end automatically
 * traces it from the right side to the left side, which is what keeps
 * bottom-arc text upright instead of upside-down — no special-casing
 * required, it falls out of the angle convention itself.
 */
export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarPoint(cx, cy, r, startAngle);
  const end = polarPoint(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Reused canvas for text-width measurement so curved text arcs can be sized
// to actually fit the string, instead of using a fixed guess that's too
// short (clipped/overflowing text) or too long (text bunched at the middle).
let measureCanvas = null;
export function measureTextWidth(text, fontFamily, fontSizePx) {
  if (typeof document === "undefined") return text.length * fontSizePx * 0.6;
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

/**
 * Given a text string, computes the arc span (in degrees) needed to fit it
 * comfortably at the given radius, clamped to a sane min/max so a single
 * short word doesn't produce a tiny arc and a long name doesn't wrap nearly
 * all the way around the circle.
 */
export function arcSpanForText(text, fontFamily, fontSizePx, radius, letterSpacingPx = 0) {
  const rawWidth = measureTextWidth(text, fontFamily, fontSizePx) + letterSpacingPx * text.length;
  const paddedWidth = rawWidth * 1.18; // margin so text doesn't butt against the path ends
  const spanRad = paddedWidth / radius;
  const spanDeg = (spanRad * 180) / Math.PI;
  return Math.min(170, Math.max(40, spanDeg));
}
