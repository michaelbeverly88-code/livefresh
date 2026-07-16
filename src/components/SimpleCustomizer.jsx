import { useMemo, useRef, useState } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";
import LogoPreview from "../logo/LogoPreview";
import { BRAND_TEXT, FONT_OPTIONS, COLOR_PRESETS, SIZE } from "../logo/constants";

// The simplified customer flow always starts from the stacked layout — it's
// the clearest general-purpose view of the logo. The product step later
// re-renders the same design data into whichever template fits the product
// (badge for caps, etc.) without the customer needing to think about
// "templates" at all.
const DEFAULT_TEMPLATE = "stacked";

export default function SimpleCustomizer({ lake, onBack, onContinue }) {
  const [bottomText, setBottomText] = useState((lake.name || "").toUpperCase());
  const [presetId, setPresetId] = useState(COLOR_PRESETS[0].id);
  const [lakeScale, setLakeScale] = useState(1);
  const [lakeOffset, setLakeOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const preset = COLOR_PRESETS.find((p) => p.id === presetId) || COLOR_PRESETS[0];

  const pathData = useMemo(
    () => geoJsonToSvgPath(lake.geometry, { size: SIZE, padding: 30 }),
    [lake]
  );

  if (!pathData) {
    return (
      <div className="simple-flow">
        <p className="hint error">
          Couldn't build a shape for this lake — its geometry data looks incomplete. Try another search result.
        </p>
        <button onClick={onBack}>← Back to search</button>
      </div>
    );
  }

  function handleContinue() {
    onContinue({
      lake,
      bottomText,
      preset,
      lakeScale,
      lakeOffset,
      font: FONT_OPTIONS[0].value, // customers don't pick a font in the simple flow
    });
  }

  return (
    <div className="simple-flow">
      <button className="link-button" onClick={onBack}>← Back to search</button>

      <div className="simple-flow-layout">
        <div className="simple-preview-panel">
          <LogoPreview
            svgRef={svgRef}
            pathData={pathData}
            brandText={BRAND_TEXT}
            bottomText={bottomText}
            font={FONT_OPTIONS[0].value}
            fillColor={preset.fillColor}
            strokeColor={preset.strokeColor}
            strokeWidth={preset.strokeWidth}
            fillMode={preset.fillMode}
            template={DEFAULT_TEMPLATE}
            showDivider={true}
            lakeScale={lakeScale}
            textScale={1}
            lakeOffset={lakeOffset}
            onLakeOffsetChange={setLakeOffset}
          />
          <p className="hint" style={{ textAlign: "center" }}>Drag the lake shape to reposition it</p>
        </div>

        <div className="simple-controls-panel">
          <label className="field-label">Lake name</label>
          <input
            type="text"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
            maxLength={40}
          />

          <label className="field-label">Lake shape size: {Math.round(lakeScale * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.02"
            value={lakeScale}
            onChange={(e) => setLakeScale(Number(e.target.value))}
          />

          <label className="field-label">Style</label>
          <div className="preset-grid">
            {COLOR_PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`preset-swatch ${presetId === p.id ? "selected" : ""}`}
                onClick={() => setPresetId(p.id)}
              >
                <span
                  className="preset-swatch-color"
                  style={{
                    background: p.fillMode === "filled" ? p.swatch : "transparent",
                    borderColor: p.swatch,
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>

          <button className="primary" style={{ marginTop: 24, width: "100%" }} onClick={handleContinue}>
            Continue to products →
          </button>
        </div>
      </div>
    </div>
  );
}
