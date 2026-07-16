/**
 * Builds a minimal DXF (R12 / AC1009) file from the lake shape's ring
 * coordinates. R12 is the oldest widely-supported DXF version and is
 * readable by essentially every laser/CNC/CAD tool (LightBurn, Inkscape,
 * AutoCAD, LaserGRBL, etc.), so it's the safest baseline format to export —
 * unlike newer DXF entities (LWPOLYLINE, splines) which aren't universally
 * supported.
 *
 * This exports the lake OUTLINE only (the shape's geometry) — not the text.
 * That's intentional: laser engraving/cutting software works with vector
 * paths, and text-as-a-path would need font outlining first. For now this
 * covers the most common use case (engrave/cut just the lake silhouette);
 * see the note in the UI about outlining text if a full logo DXF is needed
 * later.
 */
export function ringsToDxf(rings, { size = 500 } = {}) {
  const lines = [];
  const push = (code, value) => {
    lines.push(String(code));
    lines.push(String(value));
  };

  push(0, "SECTION");
  push(2, "ENTITIES");

  for (const ring of rings) {
    if (ring.length < 2) continue;
    push(0, "POLYLINE");
    push(8, "0"); // layer 0
    push(66, 1); // "entities follow" flag, required for POLYLINE
    push(70, 1); // closed polyline

    for (const [x, y] of ring) {
      push(0, "VERTEX");
      push(8, "0");
      push(10, x.toFixed(3));
      // DXF is a real-world CAD coordinate system (Y increases upward);
      // SVG's Y increases downward. Flipping here keeps the exported shape
      // right-side-up when opened in laser/CAD software instead of
      // mirrored vertically.
      push(20, (size - y).toFixed(3));
    }

    push(0, "SEQEND");
  }

  push(0, "ENDSEC");
  push(0, "EOF");

  return lines.join("\n");
}

export function downloadDxf(pathData, filenameBase) {
  if (!pathData || !pathData.rings) return;
  const dxfText = ringsToDxf(pathData.rings, { size: pathData.size || 500 });
  const blob = new Blob([dxfText], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenameBase}-outline.dxf`;
  link.click();
  URL.revokeObjectURL(url);
}
