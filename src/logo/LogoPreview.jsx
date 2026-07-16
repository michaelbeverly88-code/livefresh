import { useId } from "react";
import { TEMPLATES, FONT_OPTIONS, NAME_FONT_CAP_HEIGHT_RATIO, MIN_BRAND_TO_NAME_VISUAL_RATIO } from "./constants";
import { describeArc, arcSpanForText } from "./arcMath";
import { useDragToReposition } from "./useDragToReposition";

/**
 * Renders one logo layout (stacked / badge / side-by-side) for a given lake
 * shape and set of style options. Used in three places:
 *  - the advanced/admin editor (full controls, draggable)
 *  - the simplified customer flow (position/size + preset color, draggable)
 *  - product mockups (fixed, non-interactive preview — pass draggable=false)
 */
export default function LogoPreview({
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
  lakeOffset = { x: 0, y: 0 },
  onLakeOffsetChange = () => {},
  showCircle = true,
  draggable = true,
}) {
  const t = TEMPLATES[template];
  const { handlePointerDown, isDragging } = useDragToReposition(svgRef, lakeOffset, onLakeOffsetChange, draggable);

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
      style={{ cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default", touchAction: "none" }}
    >
      {/* pointerEvents="all" ensures the whole shape is draggable even in
          outline mode, where fill is "none" and clicks would otherwise only
          register on the stroke itself. */}
      <path d={pathData.d} style={shapeStyle} fillRule="evenodd" pointerEvents={draggable ? "all" : "none"} />
    </g>
  );

  const uid = useId();
  const topArcId = `badge-top-arc-${uid}`;
  const bottomArcId = `badge-bottom-arc-${uid}`;

  if (template === "badge") {
    const circleRadius = 230;
    // Keep the text baseline far enough inside the rim that ascenders
    // (which point outward toward the rim on both arcs) don't collide with
    // the border, scaling with font size so this stays correct as text
    // size changes.
    const topArcRadius = Math.max(80, circleRadius - brandFontSize * 0.85);
    const bottomArcRadius = Math.max(80, circleRadius - nameFontSize * 0.85);

    const topSpan = arcSpanForText(brandText, font, brandFontSize, topArcRadius);
    const bottomSpan = arcSpanForText(nameLabel, "'Montserrat', sans-serif", nameFontSize, bottomArcRadius, 2);

    // Angle 270° = straight up (top of circle), 90° = straight down (bottom
    // of circle) in this file's clockwise-from-the-right convention.
    const topArcPath = describeArc(250, 250, topArcRadius, 270 - topSpan / 2, 270 + topSpan / 2);
    // Centering the bottom arc the same way (start < end, increasing angle)
    // is what makes this text trace right-to-left under the circle instead
    // of left-to-right — which is what keeps it upright instead of upside
    // down. See describeArc's own comment for why.
    const bottomArcPath = describeArc(250, 250, bottomArcRadius, 90 - bottomSpan / 2, 90 + bottomSpan / 2);

    return (
      <svg ref={svgRef} viewBox={t.viewBox} width="100%" style={{ overflow: "visible" }} role="img" aria-label={`${bottomText} logo`}>
        <defs>
          <path id={topArcId} d={topArcPath} />
          <path id={bottomArcId} d={bottomArcPath} />
        </defs>
        {showCircle && (
          <circle cx="250" cy="250" r={circleRadius} fill="none" stroke={textColor} strokeWidth="6" />
        )}
        <text fontFamily={font} fontSize={brandFontSize} fill={textColor}>
          <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
            {brandText}
          </textPath>
        </text>
        {lakeGroup}
        <text fontFamily="'Montserrat', sans-serif" fontSize={nameFontSize} letterSpacing="2" fill={textColor}>
          <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
            {nameLabel}
          </textPath>
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
