// src/utils/geoToSvg.js
//
// Converts a GeoJSON Polygon/MultiPolygon (lon/lat coordinates from OSM)
// into an SVG path `d` string, scaled to fit a target viewBox.

/**
 * Douglas-Peucker polyline simplification.
 * Reduces point count while preserving the overall shoreline shape —
 * makes for a cleaner logo silhouette and a smaller SVG file.
 */
function simplify(points, tolerance) {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  function getSqSegDist(p, p1, p2) {
    let [x, y] = p1;
    let dx = p2[0] - x;
    let dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2[0];
        y = p2[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  }

  function simplifyDPStep(pts, first, last, sqTol, out) {
    let maxSqDist = sqTol;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }
    if (maxSqDist > sqTol) {
      if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, out);
      out.push(pts[index]);
      if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, out);
    }
  }

  const last = points.length - 1;
  const result = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, result);
  result.push(points[last]);
  return result;
}

/**
 * Projects lon/lat points to a flat x/y space.
 * Uses an equirectangular projection with a cos(latitude) correction so
 * shapes aren't horizontally stretched/squished — accurate enough for the
 * small geographic extent of a single lake.
 */
function projectRing(ring, refLat) {
  const cosLat = Math.cos((refLat * Math.PI) / 180);
  return ring.map(([lon, lat]) => [lon * cosLat, lat]);
}

function ringToPathData(ring) {
  const [start, ...rest] = ring;
  let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} `;
  d += rest.map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  d += " Z";
  return d;
}

/**
 * Convert a GeoJSON Polygon or MultiPolygon into a single SVG path `d`
 * string, normalized/scaled to fit inside `size` x `size` with `padding`.
 * Multiple rings (e.g. islands as holes) are combined using the
 * even-odd fill rule so holes render correctly.
 */
export function geoJsonToSvgPath(geometry, { size = 500, padding = 20, simplifyTolerance = 0.00015 } = {}) {
  if (!geometry) return null;

  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  // polygons: array of polygons, each polygon: array of rings, each ring: array of [lon,lat]

  // Find a reference latitude (rough centroid) for the projection correction.
  const allPoints = polygons.flat(2);
  const refLat =
    allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;

  // Project + simplify every ring.
  const projectedPolygons = polygons.map((rings) =>
    rings.map((ring) => simplify(projectRing(ring, refLat), simplifyTolerance))
  );

  const allProjectedPoints = projectedPolygons.flat(2);
  const minX = Math.min(...allProjectedPoints.map((p) => p[0]));
  const maxX = Math.max(...allProjectedPoints.map((p) => p[0]));
  const minY = Math.min(...allProjectedPoints.map((p) => p[1]));
  const maxY = Math.max(...allProjectedPoints.map((p) => p[1]));

  const geoWidth = maxX - minX || 1;
  const geoHeight = maxY - minY || 1;
  const drawable = size - padding * 2;
  const scale = Math.min(drawable / geoWidth, drawable / geoHeight);

  const offsetX = padding + (drawable - geoWidth * scale) / 2;
  const offsetY = padding + (drawable - geoHeight * scale) / 2;

  function toSvgSpace(pt) {
    const x = (pt[0] - minX) * scale + offsetX;
    // Flip Y: latitude increases upward, SVG y increases downward.
    const y = size - ((pt[1] - minY) * scale + offsetY);
    return [x, y];
  }

  const pathParts = projectedPolygons
    .flat()
    .map((ring) => ringToPathData(ring.map(toSvgSpace)));

  return {
    d: pathParts.join(" "),
    viewBox: `0 0 ${size} ${size}`,
  };
}
