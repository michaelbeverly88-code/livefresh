// netlify/functions/search-lake.js
//
// Secure backend proxy for lake search.
//
// Why this exists (security rationale):
// - The browser NEVER calls OpenStreetMap directly. All third-party requests
//   go through this server-side function. That means:
//     1. No third-party API endpoints or usage policies are exposed in the
//        client bundle for someone to scrape/abuse.
//     2. We fully control + sanitize what gets sent upstream.
//     3. We control response shape and can strip anything we don't want
//        reaching the browser (rate-limit headers, internal ids, etc).
//     4. CORS is locked down here, not left to a public API's defaults.
//
// Data source: OpenStreetMap Nominatim (nominatim.openstreetmap.org).
// Free, no API key. Usage policy requires a descriptive User-Agent and caps
// requests at ~1/sec — fine for a small app; if you scale up, swap this
// function to call a paid geocoder or your own hosted Nominatim instance
// without touching the frontend at all.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Lock this down to your real domain(s) once deployed.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8888",
  process.env.SITE_URL, // Netlify sets this automatically in production
].filter(Boolean);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

// Very small in-memory rate limiter. Serverless instances are ephemeral and
// this won't be perfectly consistent across cold starts / concurrent
// instances, but it stops naive abuse for free. For real production-scale
// protection, put Netlify's rate limiting or a service like Upstash Redis /
// Cloudflare in front of this endpoint.
const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(key) {
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  const recent = bucket.filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

// Strict input validation. Query must be short, printable text only.
// This isn't SQL/command injection territory (we use encodeURIComponent
// for the upstream call), but we still never trust raw user input.
function sanitizeQuery(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  if (!/^[a-zA-Z0-9\s'.,\-]+$/.test(trimmed)) return null;
  return trimmed;
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "";
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const clientKey =
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"] ||
    "unknown";
  if (isRateLimited(clientKey)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
    };
  }

  const rawQuery = event.queryStringParameters?.q;
  const query = sanitizeQuery(rawQuery);
  if (!query) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Please provide a valid lake name (2-100 characters)." }),
    };
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      polygon_geojson: "1",
      addressdetails: "1",
      limit: "10",
      extratags: "1",
    });

    const upstreamRes = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        // Required by Nominatim usage policy: identify your application.
        "User-Agent": "LiveFreshLakeLogos/1.0 (contact: support@yourdomain.com)",
        Accept: "application/json",
      },
    });

    if (!upstreamRes.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Lake search service is temporarily unavailable." }),
      };
    }

    const results = await upstreamRes.json();

    // Keep only features that are actually water bodies with usable polygon
    // geometry, and strip fields we don't need before sending to the client.
    const lakes = (Array.isArray(results) ? results : [])
      .filter((r) => {
        const isWater =
          r.class === "natural" ||
          r.class === "water" ||
          r.type === "water" ||
          r.type === "lake" ||
          r.type === "reservoir" ||
          (r.extratags && (r.extratags.water || r.extratags.natural === "water"));
        const hasPolygon =
          r.geojson && (r.geojson.type === "Polygon" || r.geojson.type === "MultiPolygon");
        return isWater && hasPolygon;
      })
      .map((r) => ({
        id: r.place_id,
        osmId: r.osm_id,
        osmType: r.osm_type,
        name: r.name || r.display_name.split(",")[0],
        displayName: r.display_name,
        boundingBox: r.boundingbox,
        geometry: r.geojson,
      }))
      // De-dupe identical shapes (Nominatim sometimes returns overlapping matches)
      .filter(
        (lake, idx, arr) => arr.findIndex((l) => l.osmId === lake.osmId) === idx
      )
      .slice(0, 8);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ query, results: lakes }),
    };
  } catch (err) {
    console.error("search-lake error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Something went wrong searching for that lake." }),
    };
  }
};
