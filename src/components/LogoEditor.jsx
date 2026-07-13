import { useMemo, useRef, useState } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";

// "Live Fresh" is the brand mark. It's intentionally not editable — the
// point of the product is that every logo carries the same brand identity,
// only the lake changes. If you ever need a second brand line/sub-brand,
// add a new fixed constant rather than making this a free-text field.
const BRAND_TEXT = "Live Fresh";

const FONT_OPTIONS = [
  { label: "Script (Great Vibes)", value: "'Great Vibes', cursive" },
  { label: "Bold Script (Pacifico)", value: "'Pacifico', cursive" },
  { label: "Clean Sans (Montserrat)", value: "'Montserrat', sans-serif" },
  { label: "Condensed (Oswald)", value: "'Oswald', sans-serif" },
  { label: "Serif (Playfair Display)", value: "'Playfair Display', serif" },
];

// baseScale/cx/cy define where the lake silhouette sits by default in each
// template's viewBox. lakeScale multiplies baseScale, and the translate is
// recalculated so scaling always happens around the same visual center
// instead of drifting toward a corner.
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
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
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
          <legend>Size</legend>
          <label className="field-label">Lake shape size: {Math.round(lakeScale * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.02"
            value={lakeScale}
            onChange={(e) => setLakeScale(Number(e.target.value))}
          />
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
        />
      </div>
    </div>
  );
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
}) {
  const t = TEMPLATES[template];

  const shapeStyle =
    fillMode === "outline"
      ? { fill: "none", stroke: strokeColor, strokeWidth: strokeWidth || 3 }
      : { fill: fillColor, stroke: strokeWidth > 0 ? strokeColor : "none", strokeWidth };

  // Scale the lake path around its visual center (t.cx, t.cy) rather than
  // the SVG origin, so the slider grows/shrinks it in place instead of
  // pushing it off to one side.
  const s = t.baseScale * lakeScale;
  const translateX = t.cx - 250 * s;
  const translateY = t.cy - 250 * s;
  const lakeTransform = `translate(${translateX.toFixed(2)}, ${translateY.toFixed(2)}) scale(${s.toFixed(3)})`;

  const brandFontSize = t.brandFontSize * textScale;
  const nameFontSize = t.nameFontSize * textScale;
  const nameLabel = showDivider ? `— ${bottomText} —` : bottomText;

  if (template === "badge") {
    return (
      <svg ref={svgRef} viewBox={t.viewBox} width="100%" role="img" aria-label={`${bottomText} logo`}>
        <circle cx="250" cy="250" r="230" fill="none" stroke={fillMode === "outline" ? strokeColor : fillColor} strokeWidth="6" />
        <text x="250" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={fillMode === "outline" ? strokeColor : fillColor}>
          {brandText}
        </text>
        <g transform={lakeTransform}>
          <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
        </g>
        <text x="250" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="2" fill={fillMode === "outline" ? strokeColor : fillColor}>
          {nameLabel}
        </text>
      </svg>
    );
  }

  if (template === "sideBySide") {
    return (
      <svg ref={svgRef} viewBox={t.viewBox} width="100%" role="img" aria-label={`${bottomText} logo`}>
        <g transform={lakeTransform}>
          <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
        </g>
        <text x="420" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={fillMode === "outline" ? strokeColor : fillColor}>
          {brandText}
        </text>
        <text x="420" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="2" fill={fillMode === "outline" ? strokeColor : fillColor}>
          {nameLabel}
        </text>
      </svg>
    );
  }

  // default: stacked
  return (
    <svg ref={svgRef} viewBox={t.viewBox} width="100%" role="img" aria-label={`${bottomText} logo`}>
      <g transform={lakeTransform}>
        <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
      </g>
      <text x="250" y={t.brandY} textAnchor="middle" fontFamily={font} fontSize={brandFontSize} fill={fillMode === "outline" ? strokeColor : fillColor}>
        {brandText}
      </text>
      <text x="250" y={t.nameY} textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="3" fill={fillMode === "outline" ? strokeColor : fillColor}>
        {nameLabel}
      </text>
    </svg>
  );
}
