import { useMemo, useRef, useState, useCallback } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";

// "Live Fresh" is the brand mark. It's intentionally not editable — the
// point of the product is that every logo carries the same brand identity,
// only the lake changes. If you ever need a second brand line/sub-brand,
// add a new fixed constant rather than making this a free-text field.
const BRAND_TEXT = "Live Fresh";

const FONT_OPTIONS = [
  { label: "Script (Great Vibes)", value: "'Great Vibes', cursive", capHeightRatio: 0.56 },
  { label: "Bold Script (Pacifico)", value: "'Pacifico', cursive", capHeightRatio: 0.66 },
  { label: "Clean Sans (Montserrat)", value: "'Montserrat', sans-serif", capHeightRatio: 0.72 },
  { label: "Condensed (Oswald)", value: "'Oswald', sans-serif", capHeightRatio: 0.75 },
  { label: "Serif (Playfair Display)", value: "'Playfair Display', serif", capHeightRatio: 0.70 },
];

// The lake name always renders in Montserrat.
const NAME_FONT_CAP_HEIGHT_RATIO = 0.72;

// Script fonts (like the default "Great Vibes") have noticeably smaller
// glyphs than sans-serif fonts at the same point size — a 34px script font
// can visually read as roughly the same size as a 22px sans-serif label,
// even though the raw numbers suggest the brand text is much bigger. This
// factor guarantees "Live Fresh" always reads as the dominant text,
// regardless of font choice or the text-size slider.
const MIN_BRAND_TO_NAME_VISUAL_RATIO = 1.6;

// baseScale/cx/cy define where the lake silhouette sits by default in each
// template's viewBox (before any manual resize/drag is applied). lakeScale
// multiplies baseScale, and the translate is recalculated so scaling always
// happens around this same visual center instead of drifting to a corner.
const TEMPLATES = {
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

const SIZE = 500;

export default function LogoEditor({ lake, onBack }) {
  const [bottomText, setBottomText] = useState((lake.name || "").toUpperCase());
  const [font, setFont] = useState(FONT_OPTIONS[0].value);
  const [fillColor, setFillColor] = useState("#111111");
  const [strokeColor, setStrokeColor] = useState("#111111");
  const [fillMode, setFillMode] = useState("filled"); // "filled" | "outline"
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [template, setTemplate] = useState("stacked");
  const [showDivider, setShowDivider] = useState(true);
  const [lakeScale, setLakeScale] = useState(1);
  const [textScale, setTextScale] = useState(1);
  const [lakeOffset, setLakeOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  const pathData = useMemo(
    () => geoJsonToSvgPath(lake.geometry, { size: SIZE, padding: 30 }),
    [lake]
  );

  function handleFillModeChange(mode) {
    setFillMode(mode);
    // Outline mode with a 0px stroke would render invisible — give it a
    // sensible default the first time someone switches to it.
    if (mode === "outline" && strokeWidth === 0) {
      setStrokeWidth(3);
    }
  }

  function handleTemplateChange(newTemplate) {
    setTemplate(newTemplate);
    // Each template has a different default center point, so a manual drag
    // offset from one layout won't make sense in another — reset it.
    setLakeOffset({ x: 0, y: 0 });
  }

  function downloadSvg() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob(
      ['<?xml version="1.0" standalone="no"?>\r\n' + source],
      { type: "image/svg+xml;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(lake.name || "lake").replace(/\s+/g, "-").toLowerCase()}-logo.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scaleFactor = 3; // export at higher res for print/merch use
      const canvas = document.createElement("canvas");
      const aspect = img.height / img.width;
      canvas.width = SIZE * scaleFactor;
      canvas.height = SIZE * scaleFactor * aspect;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${(lake.name || "lake").replace(/\s+/g, "-").toLowerCase()}-logo.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  }

  if (!pathData) {
    return (
      <div className="logo-editor">
        <p className="hint error">
          Couldn't build a shape for this lake — its geometry data looks incomplete. Try another search result.
        </p>
        <button onClick={onBack}>← Back to search</button>
      </div>
    );
  }

  return (
    <div className="logo-editor">
      <div className="editor-panel">
        <button className="link-button" onClick={onBack}>← Back to search</button>

        <fieldset>
          <legend>Template</legend>
          <select value={template} onChange={(e) => handleTemplateChange(e.target.value)}>
            {Object.entries(TEMPLATES).map(([id, t]) => (
              <option key={id} value={id}>{t.label}</option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend>Text</legend>
          <label className="field-label">Brand</label>
          <div className="locked-field">{BRAND_TEXT}</div>
          <p className="hint" style={{ marginTop: 4 }}>
            "Live Fresh" is the brand mark and stays fixed on every logo.
          </p>

          <label className="field-label">Lake name</label>
          <input
            type="text"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
            maxLength={40}
          />
          <label className="field-label">Font</label>
          <select value={font} onChange={(e) => setFont(e.target.value)}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showDivider}
              onChange={(e) => setShowDivider(e.target.checked)}
            />
            Show "— " dividers around lake name
          </label>
        </fieldset>

        <fieldset>
          <legend>Lake position & size</legend>
          <p className="hint" style={{ marginTop: 0 }}>
            Drag the lake shape directly in the preview to reposition it.
          </p>
          <label className="field-label">Lake shape size: {Math.round(lakeScale * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.02"
            value={lakeScale}
            onChange={(e) => setLakeScale(Number(e.target.value))}
          />
          <button
            type="button"
            className="link-button"
            onClick={() => setLakeOffset({ x: 0, y: 0 })}
          >
            Center lake shape
          </button>

          <label className="field-label">Text size: {Math.round(textScale * 100)}%</label>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.02"
            value={textScale}
            onChange={(e) => setTextScale(Number(e.target.value))}
          />
        </fieldset>

        <fieldset>
          <legend>Lake fill style</legend>
          <div className="radio-row">
            <label className="radio-label">
              <input
                type="radio"
                name="fillMode"
                checked={fillMode === "filled"}
                onChange={() => handleFillModeChange("filled")}
              />
              Filled silhouette
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="fillMode"
                checked={fillMode === "outline"}
                onChange={() => handleFillModeChange("outline")}
              />
              Outline only
            </label>
          </div>

          <label className="field-label">
            {fillMode === "filled" ? "Fill color" : "Outline color"}
          </label>
          <input
            type="color"
            value={fillMode === "filled" ? fillColor : strokeColor}
            onChange={(e) =>
              fillMode === "filled"
                ? setFillColor(e.target.value)
                : setStrokeColor(e.target.value)
            }
          />

          {fillMode === "filled" && (
            <>
              <label className="field-label">Outline color (optional, on top of fill)</label>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
            </>
          )}

          <label className="field-label">
            {fillMode === "outline" ? "Outline width" : "Outline width (0 = none)"}: {strokeWidth}px
          </label>
          <input
            type="range"
            min={fillMode === "outline" ? "1" : "0"}
            max="8"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
        </fieldset>

        <div className="export-buttons">
          <button onClick={downloadSvg} className="primary">Download SVG</button>
          <button onClick={downloadPng}>Download PNG</button>
        </div>
        <p className="hint">SVG is ideal for laser engraving and print/decal vendors. PNG (high-res) works for previews or platforms that don't accept SVG.</p>
      </div>

      <div className="preview-panel">
        <LogoPreview
          svgRef={svgRef}
          pathData={pathData}
          brandText={BRAND_TEXT}
          bottomText={bottomText}
          font={font}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          fillMode={fillMode}
          template={template}
          showDivider={showDivider}
          lakeScale={lakeScale}
          textScale={textScale}
          lakeOffset={lakeOffset}
          onLakeOffsetChange={setLakeOffset}
        />
      </div>
    </div>
  );
}

/**
 * Converts a pointer-drag distance in on-screen pixels into an equivalent
 * distance in the SVG's own viewBox units, using the current rendered size
 * of the <svg> element. This is what makes dragging feel 1:1 regardless of
 * how large the preview is rendered on screen.
 */
function useDragToReposition(svgRef, offset, onOffsetChange) {
  const dragState = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const viewBox = svgRef.current.viewBox.baseVal;
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const dx = (e.clientX - dragState.current.startClientX) * scaleX;
      const dy = (e.clientY - dragState.current.startClientY) * scaleY;
      onOffsetChange({
        x: dragState.current.startOffsetX + dx,
        y: dragState.current.startOffsetY + dy,
      });
    },
    [svgRef, onOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      dragState.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      };
      setIsDragging(true);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [offset, handlePointerMove, handlePointerUp]
  );

  return { handlePointerDown, isDragging };
}

function LogoPreview({
  svgRef,
  pathData,
  brandText,
  bottomText,
  font,
  fillColor,
  strokeColor,
  strokeWidth,
  fillMode,
  template,
  showDivider,
  lakeScale,
  textScale,
  lakeOffset,
  onLakeOffsetChange,
}) {
  const t = TEMPLATES[template];
  const { handlePointerDown, isDragging } = useDragToReposition(svgRef, lakeOffset, onLakeOffsetChange);

  const shapeStyle =
    fillMode === "outline"
      ? { fill: "none", stroke: strokeColor, strokeWidth: strokeWidth || 3 }
      : { fill: fillColor, stroke: strokeWidth > 0 ? strokeColor : "none", strokeWidth };

  // Scale the lake path around its visual center (t.cx, t.cy), then apply
  // the manual drag offset on top — offset is stored directly in viewBox
  // units so it composes cleanly with the centering math.
  const s = t.baseScale * lakeScale;
  const translateX = t.cx - 250 * s + lakeOffset.x;
  const translateY = t.cy - 250 * s + lakeOffset.y;
  const lakeTransform = `translate(${translateX.toFixed(2)}, ${translateY.toFixed(2)}) scale(${s.toFixed(3)})`;

  const nameFontSize = t.nameFontSize * textScale;
  // Ensure "Live Fresh" always reads as visually larger than the lake name,
  // no matter which script font or text-size setting is chosen. We correct
  // for each font's actual glyph proportions (cap height ratio) rather than
  // just comparing raw point sizes, since script fonts render smaller than
  // their point size would suggest.
  const selectedFont = FONT_OPTIONS.find((f) => f.value === font) || FONT_OPTIONS[0];
  const nameVisualHeight = nameFontSize * NAME_FONT_CAP_HEIGHT_RATIO;
  const minBrandFontSize =
    (nameVisualHeight * MIN_BRAND_TO_NAME_VISUAL_RATIO) / selectedFont.capHeightRatio;
  const brandFontSize = Math.max(t.brandFontSize * textScale, minBrandFontSize);
  const nameLabel = showDivider ? `— ${bottomText} —` : bottomText;
  const textColor = fillMode === "outline" ? strokeColor : fillColor;

  const lakeGroup = (
    <g
      transform={lakeTransform}
      onPointerDown={handlePointerDown}
      style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
    >
      {/* pointerEvents="all" ensures the whole shape is draggable even in
          outline mode, where fill is "none" and clicks would otherwise only
          register on the stroke itself. */}
      <path d={pathData.d} style={shapeStyle} fillRule="evenodd" pointerEvents="all" />
    </g>
  );

  if (template === "badge") {
    return (
      <svg ref={svgRef} viewBox={t.viewBox} width="100%" style={{ overflow: "visible" }} role="img" aria-label={`${bottomText} logo`}>
        <circle cx="250" cy="250" r="230" fill="none" stroke={textColor} strokeWidth="6" />
        <text x="250" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={textColor}>
          {brandText}
        </text>
        {lakeGroup}
        <text x="250" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="2" fill={textColor}>
          {nameLabel}
        </text>
      </svg>
    );
  }

  if (template === "sideBySide") {
    return (
      <svg ref={svgRef} viewBox={t.viewBox} width="100%" style={{ overflow: "visible" }} role="img" aria-label={`${bottomText} logo`}>
        {lakeGroup}
        <text x="420" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={textColor}>
          {brandText}
        </text>
        <text x="420" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="2" fill={textColor}>
          {nameLabel}
        </text>
      </svg>
    );
  }

  // default: stacked
  return (
    <svg ref={svgRef} viewBox={t.viewBox} width="100%" style={{ overflow: "visible" }} role="img" aria-label={`${bottomText} logo`}>
      {lakeGroup}
      <text x="250" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={textColor}>
        {brandText}
      </text>
      <text x="250" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="3" fill={textColor}>
        {nameLabel}
      </text>
    </svg>
  );
}
