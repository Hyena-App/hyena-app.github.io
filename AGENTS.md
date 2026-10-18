# AGENTS.md

The website for Hyena (https://hyena-app.github.io). App code lives in [Hyena-App/hyena](https://github.com/Hyena-App/hyena); read its `AGENTS.md` for product facts.

## How it's built

- Static `index.html`, `styles.css`, `main.js`. No backend, no secrets. `.github/workflows/pages.yml` deploys on every push, every 10 minutes and on demand. It bundles the latest app release as `download/Hyena.dmg` plus `download/version.json`, so downloads come from this site. The binary is never committed.
- If GitHub has a newer release than the bundled one, `main.js` points the buttons at GitHub's latest asset, so visitors always get the newest version.
- Preview locally: `python3 -m http.server 4173` and open http://127.0.0.1:4173.
- Content is fully readable without JavaScript. Motion respects `prefers-reduced-motion`.

## Art direction

Dealt by tasteskill v2 (`npx skills add Leonxlnx/taste-skill`): direction "Type and nothing else", seed 1808658050, Cabinet Grotesk, brand palette kept (amber `#c96f1f` field, night `#111220` ink).

House rules to keep: no gradients, glass, glows or shadows at rest; no eyebrow labels, index numbers or thin rules; no icon-card grids; no monospace outside real code; headlines of two lines or fewer at every width; at most two typefaces; running text in full ink.

Before publishing, run the skill's checks from this folder and fix every FAIL:

```sh
node <skill>/scripts/lint.mjs index.html styles.css main.js
node <skill>/scripts/inspect.mjs index.html --allow palette-terracotta
```

Remaining WARNs are deliberate: the draggable screens row, the giant numerals counting as extra type sizes, and night-on-amber body text at 5.1:1 (AA, brand color).

## Motion

- Hero: "Hyena" rises in; the second line eats words letter by letter (no masked slides, which the inspector flags as clipped text) and lands on "scavenges."; the meter counts to 47.84 GB; the app window lifts on scroll (scroll-driven animation, guarded by `@supports`).
- Poster lists: words get "bitten" with an animated `clip-path` polygon on `view()` timelines.
- Screens row: scroll-snap, mouse drag, scale-in on an inline `view()` timeline.

## Content rules

- Every claim must match the app. 47.84 GB and 26.6 GB come from a real scan; the demo-mode screenshots are tuned to the same total.
- Screens come from the app repo's `docs/screens` (demo mode, sample data), converted to WebP. Never publish captures that show real paths, usernames, notifications or tooltips.
- Photos and the clip are CC-licensed from Wikimedia Commons, credited in the footer and `assets/credits.json`. Keep credits when changing images.
- The call to action is contributing on GitHub, not "free download".
