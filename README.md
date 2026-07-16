# Live Fresh Lake Logos

Search any lake, pull its real shoreline shape from OpenStreetMap, and build a
custom "Live Fresh"-style logo (script text + lake name) that customers can
export as SVG, high-res PNG, or DXF — ready for merch, decals, or laser
engraving.

## Two experiences in one app

- **Customer flow** (site root, `/`): search → lightly customize (drag/resize
  the lake, pick from curated color presets, edit the lake name) → pick a
  product (shirt, decal, cap, mug) → download product-ready files. No
  template picker, no font list, no raw color inputs — just the decisions a
  customer actually needs to make.
- **Admin/advanced tool** (`/?mode=admin`): the full editor — every template,
  font, color, stroke, and export option (SVG/PNG/DXF). Use this to build out
  and approve how each lake looks before it's exposed to customers, or for
  one-off custom work.

Both share the exact same rendering code (`src/logo/LogoPreview.jsx` and
friends), so a lake shape that looks right in the admin tool will render
identically in the customer flow and on the product cards.

## How it works

- **Frontend** — React + Vite, static site (deploys as plain HTML/JS/CSS,
  free on Netlify).
- **Backend** — a single Netlify Function (`netlify/functions/search-lake.js`)
  that the frontend calls. It queries OpenStreetMap's Nominatim service for
  lake shoreline polygons, caches results, and returns cleaned-up data.
- **No database to manage** — Netlify Functions and Netlify Blobs (used for
  caching) are both serverless/zero-setup. You just deploy the repo.

## Why the search goes through a backend function (security)

The browser never talks to OpenStreetMap directly:

- Third-party endpoints and usage rules aren't exposed in your public JS bundle.
- All input is validated/sanitized server-side before it's used in any outbound request.
- CORS is restricted to your own domain.
- A basic rate limiter blocks naive abuse (see notes below on scaling it further).
- If you ever swap data providers (e.g. a paid geocoder), you change one file — the frontend doesn't need to know.

## Lake result caching

`search-lake.js` caches successful search results in **Netlify Blobs**
(built-in key-value storage, no setup required), keyed by the normalized
search query. Lake shorelines don't change, so once any customer searches
"Lake Lanier," every search after that — from anyone — is served instantly
from cache instead of hitting Nominatim again. This also keeps you
comfortably under Nominatim's ~1 request/sec usage policy as traffic grows.
If Blobs isn't available in a given environment, search still works — it
just skips caching (fails open, doesn't break the feature).

## Local development

```bash
npm install
npm install -g netlify-cli   # only needed once, globally
netlify dev
```

`netlify dev` runs the Vite frontend *and* the Netlify Functions (including
Blobs) together locally, so search and caching both work exactly like they
do in production.

(Running only `npm run dev` will start the frontend, but lake search calls
will fail with a 404 since there's no function server behind them — always
use `netlify dev` when testing search.)

Visit `http://localhost:8888/?mode=admin` to use the full advanced editor
locally.

## Deploying (GitHub + Netlify)

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub** → select the repo.
3. Build settings are already defined in `netlify.toml` (build command `npm run build`, publish dir `dist`, functions dir `netlify/functions`) — Netlify will pick them up automatically. Blobs works out of the box on Netlify, no extra configuration needed.
4. Deploy. Your live search endpoint will be `https://your-site.netlify.app/.netlify/functions/search-lake`.
5. Optional: in `netlify/functions/search-lake.js`, update `ALLOWED_ORIGINS` to your real production domain once you have one (e.g. `https://livefresh.com`) and update the `User-Agent` contact email — OpenStreetMap's usage policy requires a real contact.

## Product formats

Each product card in the customer flow offers only the formats that make
sense for how it's actually produced:

| Product | Template | Formats | Notes |
|---|---|---|---|
| T-shirt (DTF) | Stacked | SVG, PNG | Full front placement |
| Vinyl decal / sticker | Badge | SVG, PNG, DXF | DXF for laser/vinyl cutters |
| Cap (embroidery) | Badge | SVG, PNG | SVG is a reference for a digitizer — see limitations below |
| Mug (wrap print) | Side-by-side | SVG, PNG | — |

The advanced/admin editor also exposes DXF export for the lake outline
directly, independent of the product step.

## Customization already built in

**Customer flow** (`src/components/SimpleCustomizer.jsx`):
- Lake name text
- Drag-to-reposition and resize the lake shape
- 4 curated color presets (`src/logo/constants.js` → `COLOR_PRESETS`) — edit
  this list to add/adjust the presets customers can choose from

**Advanced editor** (`src/components/LogoEditor.jsx`):
- Everything above, plus: template choice, 5 fonts, raw fill/stroke colors,
  stroke width, fill-vs-outline mode, text size, circle border toggle, DXF export

To add more fonts, templates, or presets, `src/logo/constants.js` is the one
file to extend — both the customer and admin views read from it.

## Known limitations / good next steps as you grow this

- **Exported SVG text uses web fonts, not embedded/outlined paths.** If a
  print vendor opens the SVG on a machine without Great Vibes/Pacifico/etc.
  installed, the text will fall back to a default font. Before sending files
  to production merch vendors, either (a) convert text to outlines using a
  tool like Inkscape/Illustrator before sending, or (b) add a library like
  `opentype.js` to convert text to path data at export time — happy to build
  that next if you want it fully self-contained.
- **DXF export covers the lake outline only, not the text.** Laser/CNC
  workflows work with vector paths, and turning script-font text into clean
  cut paths needs font-outlining first (see point above) — once that's in
  place, DXF export can include the full logo, not just the shape.
- **Embroidery (DST/PES) isn't automated**, and realistically shouldn't be
  fully automatic — it needs actual stitch-path data (satin, fill, running
  stitch), which is a specialized "digitizing" skill, not a format
  conversion. Since the same lake shapes get reused across many customers,
  the practical approach is: pay a digitizer once per lake (~$10-20),
  reuse that file for every cap order of that lake, and treat the SVG export
  as the reference you hand to the digitizer.
- **Nominatim rate limits** (~1 request/sec, shared public service) are
  handled well by the caching layer for repeat lakes, but the *first* search
  for any brand-new lake still hits Nominatim live. Fine for normal traffic;
  if you get a sudden burst of first-time searches, consider swapping to a
  paid geocoder — only `search-lake.js` needs to change.
- **The in-memory rate limiter** in the function resets on cold start and
  won't coordinate across concurrent function instances. Fine as a basic
  abuse deterrent; for real protection at scale, add Netlify's rate limiting
  or put the function behind Cloudflare.
- **Ordering/checkout isn't built yet** — the product step produces
  downloadable files only. When you connect a POD/dropship partner (e.g.
  Printful) or Shopify, the exported PNG/SVG is the artifact you'd hand off
  to their API, and Printful's own mockup generator API is worth using for
  realistic customer-facing product photos at that point.
- **Custom uploads** (a customer's own image instead of a lake) isn't built.
  Would need an image-tracing step (raster → clean vector path) — a
  well-understood problem, good phase-two feature once the lake flow is
  proven out.

## Project structure

```
├── netlify/functions/search-lake.js   # backend: cached, secure lake search proxy
├── src/
│   ├── components/
│   │   ├── LakeSearch.jsx             # search box + results (shared by both flows)
│   │   ├── SimpleCustomizer.jsx       # customer flow: minimal edit step
│   │   ├── ProductSelector.jsx        # customer flow: product + export step
│   │   └── LogoEditor.jsx             # admin flow: full-control editor
│   ├── logo/                          # shared rendering logic (used by all editors)
│   │   ├── LogoPreview.jsx            # the actual SVG logo renderer
│   │   ├── constants.js               # brand text, fonts, templates, color presets
│   │   ├── arcMath.js                 # curved badge-text geometry
│   │   ├── useDragToReposition.js     # drag-to-reposition hook
│   │   ├── exportLogo.js              # SVG/PNG export
│   │   └── exportDxf.js               # DXF export (laser/CNC)
│   ├── utils/geoToSvg.js              # GeoJSON → SVG path + DXF-ready ring data
│   ├── App.jsx                        # routes to customer flow or admin flow
│   └── index.css
├── index.html
└── netlify.toml                       # build + security header config
```
