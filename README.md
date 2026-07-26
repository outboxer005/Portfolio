# Gnana Sri — Portfolio v2

Terminal-inspired, high-motion single-page portfolio for **Gnana Sri Venkata Sai Bangaru** — targeting Quant / AI-ML / SDE roles.

## Stack

Pure static site — no build step required.

- **HTML/CSS/JS** (vanilla, no framework)
- **Three.js** (r160) — animated 3D hero scene: wireframe icosahedron with vertex displacement + particle field + counter-rotating rings, mouse parallax
- **GSAP 3.12** + **ScrollTrigger** — orchestrated scroll reveals, hero intro timeline, bar fills
- **Lenis 1.0** — smooth momentum scroll
- **Google Fonts** — JetBrains Mono, Inter, Instrument Serif

All libs load from CDN — nothing to install.

## Structure

```
site/
├── index.html          # Full page markup
├── css/
│   └── style.css       # Design tokens + all component styles
├── js/
│   ├── scene.js        # Three.js hero scene
│   └── main.js         # Cursor, tilt, magnetic, scramble, GSAP, count-up, theme
└── README.md
```

## Run locally

Any static server works. Pick one:

```bash
# Python 3
python -m http.server 8000

# Node (npx serve)
npx serve .

# VS Code — install "Live Server" extension, right-click index.html → Open with Live Server
```

Then visit http://localhost:8000

## Deploy

### Vercel (fastest)

1. Push this `site/` folder to a GitHub repo (or the whole `portfolio please` folder — Vercel can point at the subfolder).
2. Go to https://vercel.com/new → import the repo.
3. In "Root Directory" pick `site` (only if you pushed the parent folder).
4. Framework preset: **Other**. Build command: *(leave blank)*. Output: *(leave blank)*.
5. Deploy.

Or via CLI:

```bash
npm i -g vercel
cd site
vercel
```

### Netlify

Drag-and-drop the entire `site/` folder onto https://app.netlify.com/drop — done in ~5 seconds.

Or via CLI:

```bash
npm i -g netlify-cli
cd site
netlify deploy --prod --dir .
```

### GitHub Pages

1. Push the `site/` folder as the root of a repo named `outboxer005.github.io` (user site) or any repo (project site).
2. Repo → Settings → Pages → Source: `main` branch, folder `/root` (or `/site`).
3. Save. Live at `https://outboxer005.github.io/<repo>`.

### Cloudflare Pages

1. https://dash.cloudflare.com → **Workers &amp; Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `outboxer005/Portfolio` repo.
3. **Framework preset:** *None*. **Build command:** *(blank)*. **Build output directory:** `/` (or `site` if you pushed the whole parent folder).
4. **Deploy** — live at `<project-name>.pages.dev` in ~30 seconds.
5. Custom domain: Pages project → **Custom domains** → **Set up a custom domain** — Cloudflare handles HTTPS automatically.

The included `_headers` file gives Cloudflare Pages proper security headers and cache directives out of the box — no dashboard config needed.

## Customize

All colors and fonts live at the top of `css/style.css` as CSS variables:

```css
:root {
  --accent:    #FFB020;   /* main accent — change this to rebrand */
  --bg:        #0A0B0F;
  --up:        #4AE290;   /* semantic — "positive" green */
  ...
}
```

The Three.js accent colors update automatically when you switch theme, but the hardcoded `0xFFB020` in `js/scene.js` will need editing if you change the accent hex above.

Content is all in `index.html` — search for a section id (`#about`, `#work`, `#stats`, etc.) to find its markup.

## Features

- Three.js hero scene with vertex-displaced icosahedron, dual particle systems, mouse parallax, scroll-linked shrink
- Custom cursor (dot + trailing ring) with hover, CTA, and "VIEW" states
- Magnetic buttons, tilt-on-hover cards, radial cursor-glow on all glass surfaces
- GSAP-orchestrated hero intro + scroll-triggered reveals for every section
- Text scramble effect on headline lines and section indices
- Lenis momentum smooth scroll with GSAP ticker sync
- Live scrolling ticker, marquee band, count-up numbers, fill bars
- Dark / light theme toggle with persistent choice
- Fully responsive (breakpoints at 900px / 720px / 560px)
- `prefers-reduced-motion` respected throughout — animations gracefully disable
- Touch-device fallbacks (no cursor, no tilt, no magnetic — just clean hover states)

## Browser support

Modern evergreen browsers. Uses `color-mix()`, `backdrop-filter`, `text-wrap: balance` — Chrome 111+, Firefox 113+, Safari 16.4+.

## License

Content © Gnana Sri Venkata Sai Bangaru. Code MIT — reuse the scaffold freely.
