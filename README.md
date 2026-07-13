# Live Fresh Lake Logos

Search any lake, pull its real shoreline shape from OpenStreetMap, and build a
custom "Live Fresh"-style logo (script text + lake name) that customers can
export as SVG or high-res PNG — ready for merch, decals, or laser engraving.

## How it works

- **Frontend** — React + Vite, static site (deploys as plain HTML/JS/CSS,
  free on Netlify).
- **Backend** — a single Netlify Function (`netlify/functions/search-lake.js`)
  that the frontend calls. It queries OpenStreetMap's Nominatim service for
  lake shoreline polygons and returns cleaned-up results.
- **No database, no API keys, no server to manage.** Netlify Functions are
  serverless — you just deploy the repo.

## Why the search goes through a backend function (security)

The browser never talks to OpenStreetMap directly:

- Third-party endpoints and usage rules aren't exposed in your public JS bundle.
- All input is validated/sanitized server-side before it's used in any outbound request.
- CORS is restricted to your own domain.
- A basic rate limiter blocks naive abuse (see notes below on scaling it further).
- If you ever swap data providers (e.g. a paid geocoder), you change one file — the frontend doesn't need to know.

## Local development

```bash
npm install
npm install -g netlify-cli   # only needed once, globally
netlify dev
```

`netlify dev` runs the Vite frontend *and* the Netlify Functions together
locally, so the search will work exactly like it does in production.

(Running only `npm run dev` will start the frontend, but lake search calls
will fail with a 404 since there's no function server behind them — always
use `netlify dev` when testing search.)

## Deploying (GitHub + Netlify)

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub** → select the repo.
3. Build settings are already defined in `netlify.toml` (build command `npm run build`, publish dir `dist`, functions dir `netlify/functions`) — Netlify will pick them up automatically.
4. Deploy. Your live search endpoint will be `https://your-site.netlify.app/.netlify/functions/search-lake`.
5. Optional: in `netlify/functions/search-lake.js`, update `ALLOWED_ORIGINS` to your real production domain once you have one (e.g. `https://livefresh.com`) and update the `User-Agent` contact email — OpenStreetMap's usage policy requires a real contact.

## Customization already built in

The editor (`src/components/LogoEditor.jsx`) currently supports:

- Top text and lake name (fully editable)
- 5 font choices (loaded via Google Fonts in `index.html`)
- Fill color, stroke color, stroke width
- 3 layout templates: stacked (like your reference logo), badge/circle, side-by-side
- SVG export (best for engraving/print vendors) and high-res PNG export

To add more fonts, templates, or controls, this is the one file to extend —
it's intentionally kept as plain React state, no external state library needed yet.

## Known limitations / good next steps as you grow this

- **Exported SVG text uses web fonts, not embedded/outlined paths.** If a
  print vendor opens the SVG on a machine without Great Vibes/Pacifico/etc.
  installed, the text will fall back to a default font. Before sending files
  to production merch vendors, either (a) convert text to outlines using a
  tool like Inkscape/Illustrator before sending, or (b) add a library like
  `opentype.js` to convert text to path data at export time — happy to build
  that next if you want it fully self-contained.
- **Nominatim rate limits** (~1 request/sec, and it's a shared public
  service) are fine for testing and low volume, but if you get real traffic,
  swap in a paid geocoder (e.g. Mapbox, Google Places) or run your own
  Nominatim instance — only `search-lake.js` needs to change.
- **The in-memory rate limiter** in the function resets on cold start and
  won't coordinate across concurrent function instances. Fine as a basic
  abuse deterrent; for real protection at scale, add Netlify's rate limiting
  or put the function behind Cloudflare.
- **Ordering/merch integration** isn't built yet — this app currently
  produces the SVG/PNG file only. When you're ready to connect it to
  products (hats, mugs, engraving), the exported SVG is the artifact you'd
  hand off to a print-on-demand API (e.g. Printful) or your fulfillment
  partner.

## Project structure

```
├── netlify/functions/search-lake.js   # backend: secure lake search proxy
├── src/
│   ├── components/
│   │   ├── LakeSearch.jsx             # search box + results
│   │   └── LogoEditor.jsx             # full customization editor + export
│   ├── utils/geoToSvg.js              # GeoJSON → SVG path conversion
│   ├── App.jsx
│   └── index.css
├── index.html
└── netlify.toml                       # build + security header config
```
