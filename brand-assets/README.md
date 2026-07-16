# Brand assets

Shared **Halfstack** (portfolio / endorser) marks — kept here for reference so every app
born from `_template` carries the branding. Mirrors `/Halfstack Design System/brand-assets/`.

| File | What it is |
|------|------------|
| `halfstack-app-icon.svg` | The Halfstack **stack** mark — four bars (top half solid, lower half outlined) on a 100 grid. **Locked artwork:** never stretch, recolor (outside ink/accent), rotate, or add effects. |
| `halfstack-app-icon-1024.png` | Raster stack mark, 1024px. |
| `halfstack-app-icon-square-1024.png` | Square (app-store style) icon, 1024px. |

## How branding works in an app
- These are the **shared Halfstack marks**, used only for the **"A Halfstack product"** endorser
  in the footer. At runtime that endorser is drawn inline by `HalfstackMark` /
  `HalfstackEndorser` in `components/brand/logo.tsx` — you don't import these files for it.
- **This product gets its OWN brand.** Replace `app/icon.svg` (favicon) and the `Logo`
  wordmark in `components/brand/logo.tsx` with the product's real mark. Do **not** ship
  the Halfstack stack mark as the app's own logo.

Full spec: `/Halfstack Design System/` (v2.0).
