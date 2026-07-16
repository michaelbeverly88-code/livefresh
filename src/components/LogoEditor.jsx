import { useMemo, useRef, useState } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";
import LogoPreview from "../logo/LogoPreview";
import { BRAND_TEXT, FONT_OPTIONS, TEMPLATES, SIZE } from "../logo/constants";
import { downloadSvg, downloadPng, slugify } from "../logo/exportLogo";
import { downloadDxf } from "../logo/exportDxf";

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
  const [showCircle, setShowCircle] = useState(true);

  const svgRef = useRef(null);
  const filenameBase = slugify(lake.name);

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
          {template === "badge" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showCircle}
                onChange={(e) => setShowCircle(e.target.checked)}
              />
              Show circle border
            </label>
          )}
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
          <button onClick={() => downloadSvg(svgRef, filenameBase)} className="primary">Download SVG</button>
          <button onClick={() => downloadPng(svgRef, filenameBase, { size: SIZE })}>Download PNG</button>
        </div>
        <button
          className="link-button"
          style={{ marginTop: 8 }}
          onClick={() => downloadDxf(pathData, filenameBase)}
        >
          Download DXF (lake outline only, for laser engraving)
        </button>
        <p className="hint">SVG is ideal for print/decal vendors. PNG (high-res) works for previews or platforms that don't accept SVG. DXF exports just the lake shape's outline geometry for laser/CNC software — it doesn't include the text.</p>
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
          showCircle={showCircle}
        />
      </div>
    </div>
  );
}
