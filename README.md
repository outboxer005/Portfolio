# Gnana Sri — Portfolio

Static HTML/CSS/JavaScript portfolio for Gnana Sri Venkata Sai Bangaru. The original dark/amber Three.js landing screen is preserved; the sections below it feature collaborative systems work, AI products, experience and competitive programming.

## Run locally

There is **no production build step** and no runtime npm dependency. Serve the repository root:

```sh
python -m http.server 4173
```

Or use the included development server:

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. Three.js r160, GSAP 3.12.5, ScrollTrigger, Lenis 1.0.42 and Google Fonts load from CDNs. All essential text is HTML. Navigation, theme and node controls use local JavaScript and work without the animation libraries. Without JavaScript, a mobile navigation fallback and the static architecture diagram remain available.

## Source layout

- `index.html`: semantic content, metadata and native controls.
- `css/style.css`: original design tokens and protected hero styling.
- `css/continuation.css`: styles scoped to the continuation, plus navigation, focus and motion fixes.
- `js/scene.js`: original hero geometry and rendering formulas, with motion, visibility and resource lifecycle guards.
- `js/main.js`: navigation, theme, one Lenis clock, cursor, preserved hero entrance and restrained section effects.
- `js/architecture.js`: one isolated, lazy Three.js architecture scene with accessible HTML node selection and an SVG fallback.
- `tests/`: browser regression tests, a local server and screenshot capture script.
- `docs/verification.md`: verification results, factual evidence and known limits.

## Verification

Node.js 18+ is required for the development tools. The current test configuration uses installed Google Chrome. Set `PLAYWRIGHT_CHANNEL=chromium` and install Playwright Chromium if needed.

```sh
npm ci
npm run check
npm test
```

The focused suite checks 360, 390, 768, 1024 and 1440px widths, keyboard/touch navigation, mobile-menu focus, reduced motion, saved theme and motion choices, CDN and WebGL failures, JavaScript-disabled content, local assets and below-hero WCAG A/AA checks through axe.

With the local server running, regenerate the review screenshots:

```sh
node tests/capture.cjs
```

`BASELINE_REF` defaults to the pre-change commit `b04f322`. The script uses that commit's actual source for the baseline. It freezes scene time, random particle placement and transient CSS effects only for comparison, hides sticky chrome in isolated hero/component screenshots, and records hero layout measurements. This does not change production animation behavior.

## Deployment

Publish the repository root as static assets. Existing `netlify.toml`, `vercel.json` and Cloudflare Pages `_headers` configuration remain in place. No Wrangler/Worker source or deployment workflow is checked into this repository; the live `workers.dev` deployment method cannot be established from these files. No migration is required.

Do not merge or deploy automatically as part of review. Existing changed JavaScript assets use a version query to bypass the hosting configurations' immutable caches.

## Content maintenance

- Keep `#hero` copy, typography, layout, scene and normal entrance protected. Compare desktop and mobile screenshots when editing shared behavior.
- Below-hero facts were reviewed on **15 October 2026** against owner-provided information and linked public repositories. Change that date only after reviewing the underlying content.
- Ratings are owner-provided snapshots, not a live feed. Do not infer percentiles or invent rating scales.
- Private Amunik products use public capability descriptions only. ZapFix integration is distinguished from features evidenced in Network-Dashboard's public source.
- Theme and pause choices are saved locally. System reduced motion overrides animation. Decorative scenes pause offscreen and when the document is hidden.
- No résumé is present. No résumé link or invented share image is included; Open Graph and Twitter summary metadata are provided.

Content © Gnana Sri Venkata Sai Bangaru.
