import { useMemo, useRef } from "react";
import { geoJsonToSvgPath } from "../utils/geoToSvg";
import LogoPreview from "../logo/LogoPreview";
import { BRAND_TEXT, SIZE } from "../logo/constants";
import { downloadSvg, downloadPng, slugify } from "../logo/exportLogo";
import { downloadDxf } from "../logo/exportDxf";

const PRODUCTS = [
  {
    id: "shirt",
    label: "T-shirt (DTF print)",
    template: "stacked",
    note: "Full front, up to ~11in x 14in",
    formats: ["svg", "png"],
  },
  {
    id: "decal",
    label: "Vinyl decal / sticker",
    template: "badge",
    note: "Die-cut circle, 3-5in typical",
    formats: ["svg", "png", "dxf"],
  },
  {
    id: "cap",
    label: "Cap (embroidery)",
    template: "badge",
    note: "Front panel, ~2.5in wide",
    formats: ["svg", "png"],
    extraNote: "Embroidery needs a digitized stitch file — use this SVG as the reference to send to a digitizer.",
  },
  {
    id: "mug",
    label: "Mug (wrap print)",
    template: "sideBySide",
    note: "Wraps the mug's front face",
    formats: ["svg", "png"],
  },
];

export default function ProductSelector({ design, onBack }) {
  const { lake, bottomText, preset, lakeScale } = design;
  const filenameBase = slugify(lake.name);

  const pathData = useMemo(
    () => geoJsonToSvgPath(lake.geometry, { size: SIZE, padding: 30 }),
    [lake]
  );

  return (
    <div className="product-selector">
      <button className="link-button" onClick={onBack}>← Back to design</button>
      <h2 style={{ fontSize: "1.2rem", margin: "8px 0 4px" }}>Choose what to put it on</h2>
      <p className="hint" style={{ marginTop: 0 }}>Your design, sized and shaped for each product.</p>

      <div className="product-grid">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            pathData={pathData}
            bottomText={bottomText}
            preset={preset}
            lakeScale={lakeScale}
            filenameBase={filenameBase}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, pathData, bottomText, preset, lakeScale, filenameBase }) {
  const svgRef = useRef(null);

  return (
    <div className="product-card">
      <div className="product-card-preview">
        <LogoPreview
          svgRef={svgRef}
          pathData={pathData}
          brandText={BRAND_TEXT}
          bottomText={bottomText}
          font={"'Great Vibes', cursive"}
          fillColor={preset.fillColor}
          strokeColor={preset.strokeColor}
          strokeWidth={preset.strokeWidth}
          fillMode={preset.fillMode}
          template={product.template}
          showDivider={true}
          // Each product template has its own default centering, so the
          // customer's manual drag offset from the stacked-layout editor
          // isn't reused here — it would land in the wrong spot in a
          // differently-shaped template. The size preference still carries
          // over since that's a meaningful, portable preference.
          lakeScale={lakeScale}
          textScale={1}
          lakeOffset={{ x: 0, y: 0 }}
          draggable={false}
        />
      </div>
      <p style={{ fontWeight: 500, margin: "10px 0 0" }}>{product.label}</p>
      <p className="hint" style={{ margin: "2px 0 8px" }}>{product.note}</p>
      {product.extraNote && <p className="hint" style={{ margin: "0 0 8px" }}>{product.extraNote}</p>}

      <div className="product-card-actions">
        {product.formats.includes("svg") && (
          <button onClick={() => downloadSvg(svgRef, `${filenameBase}-${product.id}`)}>SVG</button>
        )}
        {product.formats.includes("png") && (
          <button onClick={() => downloadPng(svgRef, `${filenameBase}-${product.id}`, { size: SIZE })}>PNG</button>
        )}
        {product.formats.includes("dxf") && (
          <button onClick={() => downloadDxf(pathData, `${filenameBase}-${product.id}`)}>DXF</button>
        )}
      </div>
    </div>
  );
}
