import { useMemo, useRef, useState } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";

const FONT_OPTIONS = [
  { label: "Script (Great Vibes)", value: "'Great Vibes', cursive" },
  { label: "Bold Script (Pacifico)", value: "'Pacifico', cursive" },
  { label: "Clean Sans (Montserrat)", value: "'Montserrat', sans-serif" },
  { label: "Condensed (Oswald)", value: "'Oswald', sans-serif" },
  { label: "Serif (Playfair Display)", value: "'Playfair Display', serif" },
];

const TEMPLATES = [
  { id: "stacked", label: "Stacked (silhouette, script, name)" },
  { id: "badge", label: "Badge (circle border, name only)" },
  { id: "sideBySide", label: "Side-by-side (silhouette left, text right)" },
];

const SIZE = 500;

export default function LogoEditor({ lake, onBack }) {
  const [topText, setTopText] = useState("Live Fresh");
  const [bottomText, setBottomText] = useState((lake.name || "").toUpperCase());
  const [font, setFont] = useState(FONT_OPTIONS[0].value);
  const [fillColor, setFillColor] = useState("#111111");
  const [strokeColor, setStrokeColor] = useState("#111111");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [template, setTemplate] = useState("stacked");
  const [showDivider, setShowDivider] = useState(true);

  const svgRef = useRef(null);

  const pathData = useMemo(
    () => geoJsonToSvgPath(lake.geometry, { size: SIZE, padding: 30 }),
    [lake]
  );

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
      canvas.width = SIZE * scaleFactor;
      canvas.height = SIZE * scaleFactor;
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
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend>Text</legend>
          <label className="field-label">Top text</label>
          <input
            type="text"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            maxLength={40}
          />
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
          <legend>Color & stroke</legend>
          <label className="field-label">Fill color</label>
          <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} />
          <label className="field-label">Stroke color</label>
          <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
          <label className="field-label">Stroke width: {strokeWidth}px</label>
          <input
            type="range"
            min="0"
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
          topText={topText}
          bottomText={bottomText}
          font={font}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          template={template}
          showDivider={showDivider}
        />
      </div>
    </div>
  );
}

function LogoPreview({
  svgRef,
  pathData,
  topText,
  bottomText,
  font,
  fillColor,
  strokeColor,
  strokeWidth,
  template,
  showDivider,
}) {
  const shapeStyle = {
    fill: fillColor,
    stroke: strokeWidth > 0 ? strokeColor : "none",
    strokeWidth,
  };

  if (template === "badge") {
    return (
      <svg ref={svgRef} viewBox="0 0 500 500" width="100%" role="img" aria-label={`${bottomText} logo`}>
        <circle cx="250" cy="250" r="230" fill="none" stroke={fillColor} strokeWidth="6" />
        <text x="250" y="90" textAnchor="middle" fontFamily={font} fontSize="34" fill={fillColor}>
          {topText}
        </text>
        <g transform="translate(80, 130) scale(0.68)">
          <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
        </g>
        <text x="250" y="440" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize="22" letterSpacing="2" fill={fillColor}>
          {showDivider ? `— ${bottomText} —` : bottomText}
        </text>
      </svg>
    );
  }

  if (template === "sideBySide") {
    return (
      <svg ref={svgRef} viewBox="0 0 700 500" width="100%" role="img" aria-label={`${bottomText} logo`}>
        <g transform="translate(10, 0) scale(0.8)">
          <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
        </g>
        <text x="420" y="220" textAnchor="middle" fontFamily={font} fontSize="56" fill={fillColor}>
          {topText}
        </text>
        <text x="420" y="270" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize="24" letterSpacing="2" fill={fillColor}>
          {showDivider ? `— ${bottomText} —` : bottomText}
        </text>
      </svg>
    );
  }

  // default: stacked
  return (
    <svg ref={svgRef} viewBox="0 0 500 620" width="100%" role="img" aria-label={`${bottomText} logo`}>
      <g transform="translate(0, 0)">
        <path d={pathData.d} style={shapeStyle} fillRule="evenodd" />
      </g>
      <text x="250" y="545" textAnchor="middle" fontFamily={font} fontSize="72" fill={fillColor}>
        {topText}
      </text>
      <text x="250" y="595" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize="26" letterSpacing="3" fill={fillColor}>
        {showDivider ? `— ${bottomText} —` : bottomText}
      </text>
    </svg>
  );
}
