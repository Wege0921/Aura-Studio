# AURA Atelier — Third System Theme PRD

**Status:** Proposed
**Author:** Pre-production audit
**Date:** 2026-08-28
**Scope:** Application-wide theme, with emphasis on the Shop module

---

## 1. Product Overview

### 1.1 Theme name

**AURA Atelier** (theme key: `atelier`)

### 1.2 Theme concept

A cool, low-chroma "gallery" theme. Where the existing themes are warm sepia — brown, earthy, candlelit — Atelier is stone, linen, and daylight, anchored by a single jade accent drawn from the studio's plant-and-breath vocabulary.

The mental model is a **contemporary studio space**: pale concrete walls, natural north light, hairline metal detailing, one living green. It is calm without being dim, and clean without being clinical.

### 1.3 Design philosophy

Three principles govern every token in this theme:

1. **The surface recedes so the content leads.** Backgrounds are deliberately desaturated (chroma near zero) so that photography — class imagery, instructor portraits, and above all product shots — carries the visual weight. No surface competes with content.
2. **Elevation by edge, not by shadow.** Hierarchy is expressed with hairline borders and small luminance steps rather than large drop shadows. This reads as modern and precise, and it avoids the muddy shadow stacking that heavy shadows produce on light backgrounds.
3. **One accent, used sparingly.** A single jade family carries all brand action. Scarcity is what makes an accent feel premium; if everything is emphasized, nothing is.

### 1.4 Problem it solves

| Problem | How Atelier addresses it |
|---|---|
| Both existing themes are the same hue family at inverted luminance, so the app effectively has one visual identity and no genuine choice. | Introduces the missing axis: cool and neutral, rather than a third point on the warm ramp. |
| The light theme's beige page background (`#e6dccb`) casts a yellow-green tint over adjacent imagery, distorting perceived product colour. | Near-neutral stone and off-white surfaces render product colour truthfully — the reason premium retail converges on this palette. |
| The dark theme's low luminance makes product photography with white or pale backgrounds look like floating cut-outs, and makes fine product detail hard to read. | High-luminance surfaces match the majority of product photography and preserve detail in mid-tones. |
| The Shop reads as a bolt-on because commerce affordances (`bg-purple-600` CTAs, a hard-coded `#d946ef` cart badge) sit outside the palette. | Defines commerce-specific tokens as first-class members of the palette so the Shop is native by construction. |
| Status colours are raw Tailwind families scattered across ~840 usages, patched by ~90 lines of `!important` overrides. A third theme would need a third override block. | Forces the introduction of semantic tokens, which is a prerequisite for any third theme and pays down existing debt. |

### 1.5 Goals

- **G1** — Ship a third theme selectable alongside Light and Dark, persisted per user.
- **G2** — Achieve WCAG 2.1 AA across all text and interactive elements; AA-Large minimum for decorative text.
- **G3** — Make the Shop feel native, with commerce affordances that are clear but not aggressive.
- **G4** — Introduce a semantic token layer so a fourth theme costs tokens, not overrides.
- **G5** — Do not regress Light or Dark. Zero visual change to either unless it is a fix for an existing defect.
- **G6** — Ship without duplicating component logic. One component tree, three token sets.

### 1.6 Non-goals

- **NG1** — Not a redesign. Layout, IA, spacing, and component structure stay as they are.
- **NG2** — Not a component library rewrite. Extracting shared primitives is recommended but explicitly out of scope for v1; only the token layer is required.
- **NG3** — Not a replacement for Dark. Dark remains the brand default.
- **NG4** — Not a marketing-site theme. The landing page uses its own `lp-*` CSS variable system and is deferred to a later phase.
- **NG5** — No new fonts. Jost and Cormorant Garamond are retained.

---

## 2. User Experience

### 2.1 Intended emotional register

| Theme | Register | Metaphor |
|---|---|---|
| Dark (default) | Intimate, grounded, evening | Candlelit studio |
| Light | Warm, soft, nostalgic | Sunlit linen, sepia print |
| **Atelier** | **Clear, composed, deliberate** | **Daylit gallery, concrete and jade** |

Atelier should feel *considered*. The target reaction is "this was designed", not "this is bright."

### 2.2 When users will prefer this theme

- **Daylight and high ambient light.** Both existing themes struggle here: Dark washes out, and Light's low contrast ratio between beige page and beige card makes hierarchy collapse.
- **Shopping.** Users evaluating a physical product want accurate colour. This is the single strongest use case.
- **Admin and operational work.** Long sessions in order tables, product management, and analytics benefit from neutral surfaces and crisp borders. Dense data reads better on low-chroma backgrounds.
- **Accessibility need.** Users who need maximum text contrast. Atelier's primary text on card measures 15.4:1, versus roughly 5:1 in the current Light theme.

### 2.3 How it differs from Light and Dark

The differentiation is deliberate and operates on five axes simultaneously, not just luminance:

| Axis | Dark | Light | Atelier |
|---|---|---|---|
| Hue family | Warm brown (~30°) | Warm brown (~35°) | Cool green-grey (~150°) |
| Chroma of surfaces | Medium | Medium | Very low (near neutral) |
| Elevation model | Shadow (`shadow-lg shadow-black/20`) | Shadow | Hairline border + luminance step |
| Accent | Sand / clay (part of the neutral ramp) | Clay | Jade (a distinct hue, outside the neutral ramp) |
| Page-to-card contrast | Card lighter than page | Card lighter than page | Card lighter than page, but a *smaller* step with a visible border |

Critically, Light and Dark are the *same* palette inverted. Atelier is a *different* palette. Placed side by side, Light reads as a photograph printed on warm paper; Atelier reads as a screen in a design studio.

### 2.4 Expected impact

- **Usability:** Improved. Contrast ratios rise substantially across the board, and the border-based elevation model makes card boundaries unambiguous — which is currently the weakest point of the Light theme.
- **Brand perception:** Broadens the brand from "warm and earthy" to "warm and earthy, with a considered modern register." This matters commercially: Atelier signals product quality in a way sepia cannot.
- **Risk:** The brand's equity is in the warm palette. Atelier must remain a *choice*, never the default, and must retain the serif display face and generous spacing so it is recognisably AURA.

---

## 3. Design System

### 3.1 Token architecture

The current system names tokens after colours (`--aura-cream`) and switches themes by inverting their meaning — in Dark, `--aura-cream` is `#f2ebe0` (a pale cream); in Light it becomes `#241a13` (a dark brown). This works only because there are exactly two themes and they are opposites. **It cannot express a third theme**, because a third theme is not the inverse of anything.

Atelier therefore requires a **semantic layer**. Literal tokens are retained as aliases so existing markup keeps working.

```
Tier 1 — Primitive ramps   (per theme, raw hues)
Tier 2 — Semantic tokens   (per theme, role-based)   ← new, the contract
Tier 3 — Literal aliases   (map old aura-* names onto Tier 2)  ← compatibility
```

Components should target **Tier 2**. Tier 3 exists so the ~2,530 existing `aura-*` usages continue to render correctly without a big-bang refactor.

### 3.2 Core semantic tokens — Atelier values

#### Backgrounds and surfaces

| Token | HEX | Role |
|---|---|---|
| `--bg-canvas` | `#E9ECE9` | Page background. Cool stone; clearly not white, so cards read as objects on a surface. |
| `--bg-surface` | `#F6F8F6` | Default card and panel background. |
| `--bg-surface-raised` | `#FFFFFF` | Modals, dropdowns, popovers, sticky headers. Pure white is the top of the elevation ramp. |
| `--bg-surface-sunken` | `#DFE3E0` | Inputs, wells, table header rows, progress tracks. |
| `--bg-overlay` | `rgba(26, 33, 30, 0.45)` | Modal scrim. Tinted with the ink hue, not pure black, so it stays in-family. |

#### Text

| Token | HEX | Contrast on `surface` | Role |
|---|---|---|---|
| `--text-primary` | `#1A211E` | **15.4:1** | Headings, body copy, prices, values. |
| `--text-secondary` | `#4A544F` | **7.4:1** | Supporting copy, labels, descriptions. AAA. |
| `--text-muted` | `#626C66` | **5.1:1** | Timestamps, helper text, placeholders. AA. |
| `--text-on-accent` | `#FFFFFF` | 5.9:1 on `accent` | Text on filled jade surfaces. |
| `--text-inverse` | `#F6F8F6` | — | Text on dark inverted blocks. |

> Note: `--text-muted` is intentionally set at 5.1:1 rather than the more common ~4.5:1. The audit found the app's most frequent readability defect was low-opacity muted text; this theme removes the temptation by making the muted token itself safe. **Opacity modifiers such as `/60` must not be applied to text tokens in this theme.**

#### Borders and dividers

| Token | HEX | Role |
|---|---|---|
| `--border-subtle` | `#DDE2DE` | Dividers, table row separators, hairlines inside cards. |
| `--border-default` | `#C9D0CB` | Card borders, input borders at rest. |
| `--border-strong` | `#A8B2AC` | Hover borders, selected but unfocused controls. |
| `--border-focus` | `#2F6F5E` | Focus rings. Matches the accent. |

#### Accent — jade

The brand action colour. A single family, five steps.

| Token | HEX | Role |
|---|---|---|
| `--accent-50` | `#EDF4F1` | Selected-row tint, subtle highlight background. |
| `--accent-100` | `#DCEAE4` | Badge and chip backgrounds, info tints. |
| `--accent-400` | `#3D8871` | Icons and borders on tinted backgrounds. |
| `--accent-600` | `#2F6F5E` | **Primary.** Filled buttons, links, focus rings, active nav. 5.9:1 with white. |
| `--accent-700` | `#245546` | Hover and pressed state for filled buttons. |
| `--accent-900` | `#173A30` | Text on `accent-100` backgrounds. |

Jade is chosen deliberately. It is adjacent to the wellness category's established vocabulary (eucalyptus, sage, plant life, breath), it is a hue the existing palette does not occupy at all, and at `#2F6F5E` it clears AA against white for button fills while remaining calm rather than saturated.

#### Status colours

Desaturated to sit in the low-chroma environment. Raw Tailwind status colours are too vivid against these surfaces.

| Role | Fill / text | Tint background | Border |
|---|---|---|---|
| `--success` | `#2A6B4F` | `#E2EFE8` | `#B4D3C3` |
| `--warning` | `#8A6318` | `#F6EEDC` | `#DFCBA0` |
| `--error` | `#A33636` | `#F7E6E6` | `#E0B4B4` |
| `--info` | `#2C5F7A` | `#E4EEF4` | `#B3CEDC` |

All four fills exceed 4.5:1 against `--bg-surface` and against their own tint backgrounds.

#### Interaction states

| Token | Value | Role |
|---|---|---|
| `--state-hover` | `rgba(26, 33, 30, 0.04)` | Ghost/secondary hover wash. |
| `--state-pressed` | `rgba(26, 33, 30, 0.08)` | Active press. |
| `--state-selected` | `var(--accent-50)` | Selected list row, active filter chip. |
| `--state-focus-ring` | `0 0 0 3px rgba(47, 111, 94, 0.35)` | Focus ring. Applied with an offset, never `outline: none` alone. |
| `--state-disabled-bg` | `#E4E7E5` | Disabled control background. |
| `--state-disabled-text` | `#9AA39D` | Disabled label. Intentionally sub-4.5:1 to signal non-interactivity. |

### 3.3 Typography

Unchanged families; refined scale usage.

| Element | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Display / page title | Cormorant Garamond (`font-serif`) | `text-2xl`–`text-4xl` | 400–500 | The serif is the primary brand carrier and must be retained in this theme. |
| Section heading | Cormorant Garamond | `text-lg`–`text-xl` | 500 | |
| Body | Jost (`font-sans`) | `text-sm`–`text-base` | 400 | |
| Label / meta | Jost | `text-xs`–`text-sm` | 500 | |
| Price | Jost | `text-lg`–`text-xl` | 600 | Tabular numerals where available. |
| Button | Jost | `text-sm` | 500 | |

**Weight guidance specific to Atelier:** on high-luminance backgrounds, heavy weights appear heavier than on dark. Where Dark uses `font-bold`, Atelier should use `font-semibold`, and where Dark uses `font-semibold`, Atelier should use `font-medium`. This is expressible as a token (`--weight-emphasis`) rather than per-component edits.

### 3.4 Shape, elevation, and iconography

| Property | Value | Rationale |
|---|---|---|
| `--radius-sm` | `6px` | Badges, chips, small controls. |
| `--radius-md` | `10px` | Buttons, inputs. |
| `--radius-lg` | `14px` | Cards. Slightly tighter than the current `rounded-xl` (12px) reads as more precise; keep 12px if a change is considered too invasive for v1. |
| `--radius-full` | `9999px` | Pills, avatars, category circles. |
| `--elev-0` | `none` | Flush elements. |
| `--elev-1` | `0 1px 2px rgba(26,33,30,0.05)` + `1px solid var(--border-default)` | Cards. Border does the work; shadow is nearly imperceptible. |
| `--elev-2` | `0 4px 12px rgba(26,33,30,0.08)` | Dropdowns, popovers. |
| `--elev-3` | `0 12px 32px rgba(26,33,30,0.12)` | Modals, drawers. |
| Icon stroke | `1.5px` | Heroicons outline at 1.5 stroke. Current 2px stroke reads heavy on light surfaces. |
| Icon colour | `--text-secondary` default, `--accent-600` when active | Never pure black. |

**Elevation is the clearest visual signature of this theme.** Dark and Light both use `shadow-lg shadow-black/20`. Atelier replaces that with a hairline border and a near-invisible shadow. This single change accounts for much of the "modern and premium" quality.

### 3.5 Component specifications

#### Buttons

| Variant | Rest | Hover | Disabled |
|---|---|---|---|
| Primary | `bg: accent-600`, `text: white`, `radius-md` | `bg: accent-700` | `bg: disabled-bg`, `text: disabled-text` |
| Secondary | `bg: transparent`, `border: border-default`, `text: text-primary` | `bg: state-hover`, `border: border-strong` | `border: border-subtle`, `text: disabled-text` |
| Ghost | `bg: transparent`, `text: text-secondary` | `bg: state-hover`, `text: text-primary` | `text: disabled-text` |
| Destructive | `bg: error`, `text: white` | darken 8% | as primary |

All buttons carry `--state-focus-ring` on `:focus-visible`. Minimum touch target 44×44 px.

#### Inputs

Rest: `bg: bg-surface-sunken`, `border: 1px border-default`, `text: text-primary`, `placeholder: text-muted`, `radius-md`.
Focus: `border: border-focus` plus `--state-focus-ring`.
Error: `border: error`, message in `error` below the field, linked with `aria-describedby`.

The sunken input background is important: on light surfaces, a bordered-but-white input is easy to miss. A slightly recessed fill makes the field affordance obvious.

#### Cards

`bg: bg-surface`, `border: 1px border-default`, `radius-lg`, `elev-1`, padding `p-4` to `p-6`.
Interactive cards gain `border-strong` and `elev-2` on hover, with a 150 ms transition.

#### Navigation

Sidebar: `bg: bg-surface`, right `border-subtle`.
Active item: `bg: accent-50`, `text: accent-900`, plus a 3 px `accent-600` left rule. The left rule is a meaningful upgrade — the current `bg-aura-sand/20` active state is very low contrast in Light mode.
Inactive: `text: text-secondary`; hover `bg: state-hover`.
Mobile bottom nav: `bg: bg-surface-raised`, top `border-subtle`, active icon and label in `accent-600`.

#### Modals, drawers, bottom sheets

Scrim `--bg-overlay`. Panel `bg-surface-raised`, `radius-lg` (top-only radius for bottom sheets), `elev-3`. Must respect `env(safe-area-inset-bottom)`, which the codebase already does correctly.

#### Badges and chips

Status badge: tint background + matching fill text + matching border, `radius-sm`, `text-xs font-medium`.
Filter chip, unselected: `border-default`, `text-secondary`. Selected: `bg: accent-600`, `text: white`.

---

## 4. Shop-Specific Requirements

The Shop is where this theme earns its place. The guiding constraint: **make commerce actions unmistakable without making the interface feel like it is selling.** No urgency red, no countdown aesthetics, no saturated sale banners.

| Surface | Requirement |
|---|---|
| **Shop home** | `bg-canvas` page. Category circles keep `radius-full`; selected state becomes a 2 px `accent-600` ring with the label in `accent-900` — replacing the current `bg-aura-clay text-aura-ink` fill, which introduces a colour used nowhere else for selection. |
| **Product cards** | `bg-surface` + `border-default` + `elev-1`. Hover lifts to `elev-2` + `border-strong`. The card must be a focusable element with a keyboard-accessible role — currently it is a clickable `<div>`. |
| **Product images** | Image wells use `bg-surface-sunken`, not a tinted brand colour, so product colour renders truthfully. Fixed `aspect-square` with explicit dimensions to prevent layout shift. This is the core functional argument for the theme. |
| **Product detail** | Two-column on `md+`. Main image `fetchpriority="high"`; thumbnails lazy. Selected thumbnail gets a 2 px `accent-600` ring. Out-of-stock variant options must be visually disabled — struck through and at `disabled-text` — not merely unclickable. |
| **Prices** | Current price in `text-primary`, `font-semibold`, one step larger than body. Never accent-coloured; the price is information, not an action. |
| **Discounts** | Original price in `text-muted` with `line-through`. Sale badge uses the `success` tint pair (`#E2EFE8` / `#2A6B4F`) — savings framed as positive, calm information. Explicitly **not** red: red is reserved for errors and destructive actions, and using it for sales is the single easiest way to make a premium storefront look cheap. |
| **Categories** | Chips per §3.5. Active category also reflected in the URL for shareability. |
| **Search** | Input per §3.5 with a leading `MagnifyingGlassIcon` in `text-muted`. Debounced. Must show a distinct "no results for X" state separate from "no products yet". |
| **Filters** | Panel on `bg-surface`, `border-default`. Applied filters appear as removable chips with a visible count. Needs a "Clear all" affordance and `Escape`/outside-click dismissal on mobile. |
| **Cart** | Drawer on `bg-surface-raised`, `elev-3`. Line items separated by `border-subtle`. Quantity stepper as a segmented control; the remove action is an icon button with an `aria-label`, in `text-muted`, moving to `error` on hover. The cart badge must use `accent-600` — replacing the hard-coded `#d946ef` fuchsia in `PublicHeader`, which is currently the most conspicuous off-brand colour in the application. |
| **Checkout** | Step indicator uses `accent-600` for complete, `accent-100` ring for current, `border-default` for upcoming — and must not rely on colour alone; include a numeral and an `aria-current`. Order summary on `bg-surface-sunken` to distinguish it from editable fields. Payment method radios in a `<fieldset>` with a `<legend>`. |
| **Purchase CTAs** | Exactly one primary button per view. "Add to Cart" and "Place Order" are primary; "Continue shopping" is secondary; "Save for later" is ghost. Full-width on mobile, intrinsic width on desktop. |
| **Availability** | Three explicit states with text, not colour alone: In stock (`success` text), Low stock (`warning` text, "Only N left"), Out of stock (`disabled-text` plus a disabled CTA reading "Out of Stock"). |
| **Empty states** | Icon in `border-strong`, heading in `text-primary`, explanatory line in `text-secondary`, and one clear action. The current Shop empty states are a single line of muted text and are thinner than the core app's equivalents in `BookingHistory` and `PaymentHistory`. |
| **Loading states** | Replace spinners with skeletons on `bg-surface-sunken` and a subtle shimmer, matching final content dimensions to eliminate layout shift. Spinners are acceptable only for button-level pending states. |
| **Error states** | Every fetch failure must surface a visible banner using the `error` tint pair, with a retry action. The audit found most Shop fetch failures are `console.error` only, so users currently see an empty state where there was in fact a server error. This is a correctness issue, not just a theming one. |

---

## 5. Implementation Requirements

### 5.1 Architecture

Three files change structurally; everything else is additive.

**`src/styles/tokens.css`** (new) — all three themes' token definitions:

```css
:root,
[data-theme="dark"] {
  /* Tier 1 primitives */
  --aura-ink: #241a13;
  /* ...existing dark values... */

  /* Tier 2 semantic */
  --bg-canvas:  var(--aura-bark);
  --bg-surface: var(--aura-ink);
  --text-primary: var(--aura-cream);
  --accent-600: #98755B;
  /* ...etc... */
}

[data-theme="light"] { /* existing light values, mapped to Tier 2 */ }

[data-theme="atelier"] {
  --bg-canvas: #E9ECE9;
  --bg-surface: #F6F8F6;
  --bg-surface-raised: #FFFFFF;
  --bg-surface-sunken: #DFE3E0;
  --text-primary: #1A211E;
  --text-secondary: #4A544F;
  --text-muted: #626C66;
  --border-subtle: #DDE2DE;
  --border-default: #C9D0CB;
  --border-strong: #A8B2AC;
  --accent-600: #2F6F5E;
  --accent-700: #245546;
  /* ...full set per §3.2... */

  /* Tier 3 compatibility aliases — existing aura-* markup keeps working */
  --aura-bark:  var(--bg-canvas);
  --aura-ink:   var(--bg-surface);
  --aura-umber: var(--border-default);
  --aura-cream: var(--text-primary);
  --aura-sand:  var(--text-secondary);
  --aura-ivory: var(--text-primary);
  --aura-clay:  var(--accent-600);
  --aura-paper: var(--bg-surface-sunken);
}
```

The Tier 3 alias block is what makes this tractable. Because `aura-*` is already CSS-variable driven in `tailwind.config.js`, roughly 2,530 existing class usages inherit correct Atelier values on day one with **no component edits**.

**`tailwind.config.js`** — add semantic colour names alongside the existing `aura` scale, so new and migrated code can use `bg-surface`, `text-primary`, `border-default`, `bg-accent`, `text-success`, and so on.

**`src/contexts/ThemeContext.tsx`** — widen the type and add explicit system handling:

```ts
export type Theme = 'light' | 'dark' | 'atelier';
export type ThemePreference = Theme | 'system';
```

### 5.2 Theme switching and persistence

- Storage key `aura-theme` is retained. Values extend to include `atelier` and `system`.
- **Fix an existing bug:** `applyTheme` currently writes to `localStorage` on mount even when the user has never made a choice. That permanently populates the key and defeats the `if (!stored)` guard in the `prefers-color-scheme` listener, so system-preference following silently stops working after first load. Persist only on explicit user action.
- `system` resolves to Light or Dark only. Atelier is never auto-selected; it is an opt-in aesthetic choice.
- Unrecognised stored values must fall back to `dark` rather than rendering an unstyled page.
- `ThemeToggle` becomes a three-option control (segmented control on desktop, sheet on mobile) rather than a binary switch. It must expose accessible names, not colour swatches alone.
- Add `<meta name="theme-color">` updates per theme so mobile browser chrome matches.
- To prevent a flash of the wrong theme, set `data-theme` from a tiny inline script in `public/index.html` before the bundle loads.

### 5.3 Handling hard-coded colours

The audit measured roughly **840 non-`aura` colour utility usages**, dominated by `red` (~237), `purple` (~234), `green` (~159), `white` (~82), and `black` (~48). These will not respond to token changes.

The current Light theme copes via ~90 lines of `!important` overrides in `src/index.css`. **Do not replicate that pattern for Atelier.** It would triple the override surface and it is already the most brittle part of the styling system.

Instead, a tiered approach:

- **Tier A — must fix before Atelier ships (~120 usages).** Status colours and the `purple-600` primary button in user-visible flows: Shop, Checkout, Cart, Classes, Booking, Packages, Auth. Replace with semantic tokens.
- **Tier B — fix during rollout (~350 usages).** Admin surfaces. Lower external visibility, so these can land incrementally behind the theme being available.
- **Tier C — accept a scoped override (remainder).** A deliberately small `[data-theme="atelier"]` block for genuinely cosmetic cases, capped at 20 rules and code-reviewed as debt with a removal ticket.

A note on `purple`: the Tailwind config maps the `purple` scale to brown HEX values (`purple-600` is `#98755B`), while `index.css` overrides it back to real purple in Light mode. This is actively misleading. Recommend introducing `brand-*` as the correct name, aliasing `purple-*` to it during migration, then removing `purple-*` entirely.

### 5.4 Migration strategy

**Phase 0 — Foundation (no visible change).** Extract `tokens.css`, define Tier 2 semantics for Dark and Light mapped to current values, add Tailwind semantic names, add the Atelier block with Tier 3 aliases. Verify Dark and Light are pixel-identical. This phase is independently shippable and de-risks everything after it.

**Phase 1 — Theme plumbing.** Widen `ThemeContext`, fix the persistence bug, build the three-way toggle, add the anti-flash script. Ship Atelier behind a flag.

**Phase 2 — Shop migration (highest priority).** Migrate the 13 Shop components to semantic tokens, then apply the §4 requirements: skeletons, error banners, availability states, accessible product cards, the sale-badge colour change, and the cart badge fix. The Shop goes first because it is the theme's primary justification and the newest, least-entrenched code.

**Phase 3 — Core app.** Classes, Booking, Packages, Payments, Auth, Dashboard. Tier A colours resolved.

**Phase 4 — Admin.** Tier B colours. Highest volume, lowest risk.

**Phase 5 — Removal.** Delete the Light `!important` block by migrating its underlying causes. Remove `purple-*`. Remove the Atelier scoped overrides.

The landing page (`lp-*` variables in `LandingPage.css`) is deferred to a follow-up; it is a self-contained system and does not block the theme.

### 5.5 Accessibility requirements

- All text at AA (4.5:1 normal, 3:1 large ≥18.66 px bold or ≥24 px). Targets in §3.2 are met by construction.
- Non-text UI — borders, icons, focus indicators, control boundaries — at 3:1 minimum.
- **State must never be conveyed by colour alone.** Order status, stock status, payment status, and checkout progress all require a text label or icon in addition to colour. This is currently violated by several status badges.
- Visible `:focus-visible` on every interactive element. No bare `outline: none`.
- Respect `prefers-reduced-motion` for theme transitions, skeleton shimmer, and hover lifts. A partial implementation exists in `index.css` and should be extended.
- Verify at 200% zoom and with Windows High Contrast Mode.

### 5.6 Testing requirements

**Automated**
- Contrast assertion test over the token matrix: every text/background pairing in every theme, failing the build on regression. This is the highest-value single test.
- `axe-core` in CI across representative routes in all three themes.
- Visual regression snapshots: Shop landing, product detail, cart, checkout, dashboard, admin orders — three themes × three breakpoints.
- Unit tests for theme resolution: stored value precedence, `system` resolution, invalid-value fallback, persistence-only-on-explicit-choice.

**Manual**
- Theme switch with no flash, no layout shift, no unstyled flash on hard reload.
- Full guest checkout and authenticated checkout in Atelier.
- Product photography review against `bg-surface-sunken` with real inventory — including white, black, and pale-neutral products.
- Keyboard-only traversal of the entire purchase flow.
- Screen reader pass (NVDA or VoiceOver) on checkout.
- Mobile Safari and Chrome Android: safe areas, browser chrome colour, sticky elements.

**Exit criteria:** zero AA failures in the token matrix; zero critical `axe` violations; no visual regressions in Light or Dark; checkout completable via keyboard alone in all three themes.

---

## 6. Appendix — Full Atelier token reference

```css
[data-theme="atelier"] {
  /* Surfaces */
  --bg-canvas:          #E9ECE9;
  --bg-surface:         #F6F8F6;
  --bg-surface-raised:  #FFFFFF;
  --bg-surface-sunken:  #DFE3E0;
  --bg-overlay:         rgba(26, 33, 30, 0.45);

  /* Text */
  --text-primary:       #1A211E;
  --text-secondary:     #4A544F;
  --text-muted:         #626C66;
  --text-on-accent:     #FFFFFF;
  --text-inverse:       #F6F8F6;

  /* Borders */
  --border-subtle:      #DDE2DE;
  --border-default:     #C9D0CB;
  --border-strong:      #A8B2AC;
  --border-focus:       #2F6F5E;

  /* Accent — jade */
  --accent-50:          #EDF4F1;
  --accent-100:         #DCEAE4;
  --accent-400:         #3D8871;
  --accent-600:         #2F6F5E;
  --accent-700:         #245546;
  --accent-900:         #173A30;

  /* Status */
  --success:            #2A6B4F;
  --success-bg:         #E2EFE8;
  --success-border:     #B4D3C3;
  --warning:            #8A6318;
  --warning-bg:         #F6EEDC;
  --warning-border:     #DFCBA0;
  --error:              #A33636;
  --error-bg:           #F7E6E6;
  --error-border:       #E0B4B4;
  --info:               #2C5F7A;
  --info-bg:            #E4EEF4;
  --info-border:        #B3CEDC;

  /* States */
  --state-hover:         rgba(26, 33, 30, 0.04);
  --state-pressed:       rgba(26, 33, 30, 0.08);
  --state-selected:      var(--accent-50);
  --state-focus-ring:    0 0 0 3px rgba(47, 111, 94, 0.35);
  --state-disabled-bg:   #E4E7E5;
  --state-disabled-text: #9AA39D;

  /* Shape */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Elevation */
  --elev-1: 0 1px 2px rgba(26, 33, 30, 0.05);
  --elev-2: 0 4px 12px rgba(26, 33, 30, 0.08);
  --elev-3: 0 12px 32px rgba(26, 33, 30, 0.12);

  /* Compatibility aliases (Tier 3) */
  --aura-bark:  var(--bg-canvas);
  --aura-ink:   var(--bg-surface);
  --aura-umber: var(--border-default);
  --aura-cream: var(--text-primary);
  --aura-sand:  var(--text-secondary);
  --aura-ivory: var(--text-primary);
  --aura-clay:  var(--accent-600);
  --aura-paper: var(--bg-surface-sunken);
}
```

### Verified contrast ratios

| Pair | Ratio | Standard |
|---|---|---|
| `text-primary` on `bg-surface` | 15.4:1 | AAA |
| `text-primary` on `bg-canvas` | 13.8:1 | AAA |
| `text-secondary` on `bg-surface` | 7.4:1 | AAA |
| `text-muted` on `bg-surface` | 5.1:1 | AA |
| white on `accent-600` | 5.9:1 | AA |
| `border-default` on `bg-surface` | 1.5:1 | Decorative only — card borders are paired with a luminance step, and `border-strong` (3.1:1) is used wherever a boundary is functionally required. |
