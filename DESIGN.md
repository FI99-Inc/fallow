# Fallow Design System

The visual system for Fallow, a psychological activity-discovery product. The
aesthetic is **High-End Editorial**: a premium print magazine that happens to be
interactive. This document describes what the code actually does; when the two
disagree, the code is the bug.

## 1. Core Principles

* **Editorial & Graphic.** Content floats in asymmetric space, anchored by stark,
  deliberate grid lines. Hierarchy is carried by scale and rhythm, not by fills.
* **Tactile.** The digital space feels physical, via a persistent SVG paper grain
  overlay declared once in `tokens.css`.
* **Severe interactions.** No soft, bouncy, playful UI. Interactions are stark
  and deliberate. Severity applies to the *treatment*, never to the *copy* — the
  writing stays warm, because the reader is someone embarrassed to be a beginner.

## 2. Tokens

`tokens.css` is the single source of truth and is loaded first on every page.
Page stylesheets must not redeclare tokens, the reset, the grain, focus rings,
or selection colours. A `var()` that resolves to nothing does not fail loudly —
it silently unsets the property and ships invisible UI, so **every name used
must be defined in `tokens.css`.**

## 3. Colour

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#EAE5DC` | Textured paper base |
| `--color-bg-alt` | `#E0DACF` | The B side of a pair; second paper tone |
| `--color-surface` | `#F2EEE7` | **Bounded objects** — cards, decks, panels |
| `--color-surface-dim` | `#E4DED4` | Recessed wells and tracks |
| `--color-text` | `#1C1A17` | Deepest charcoal, never pure black |
| `--color-text-muted` | `#59544D` | 5.98:1 on paper |
| `--color-primary` | `#D9532A` | Oxidized terracotta — **3.2:1 on paper** |
| `--color-primary-deep` | `#A63A18` | **5.17:1 both ways** against paper |
| `--color-secondary` | `#5F6B5F` | Deep sage |
| `--color-accent` | `#B07D35` | Amber |
| `--color-border` | `#1C1A17` | Structural borders map to the text colour |
| `--color-border-soft` | `#C2B9AB` | 3.0:1 hairlines; never a text boundary |

**The terracotta rule.** `--color-primary` is 3.2:1 on paper. It is legal for
large display type, borders, focus rings, and decorative fills. Anything
carrying body-size text — in either direction — uses `--color-primary-deep`.
This is why hover inversions land on `#A63A18`, not `#D9532A`.

Pure `white` is not in the system. Paper tones only.

## 4. Structure

* **Borders:** `var(--border-weight)` (2px) `solid var(--color-border)`.
* **Radii:** `0px` globally. No rounded corners, no pill buttons.
* **Shadows:** `none`.

### 4a. Bounded objects

Because radii, shadows, and fills are all spent, this system needs one explicit
mechanism for "this is a discrete thing you can act on." That mechanism is:

> **`background: var(--color-surface)` + `2px solid var(--color-border)`.**

Apply it to any element the user is meant to read as an object rather than as
part of the page: swipe cards, recommendation cards, commitment cards, scenario
and constraint buttons, chart panels, and empty/error states.

This rule exists because its absence was a real defect. Transparent surfaces
with no border are not restraint — they are missing UI, and they made the swipe
deck and the DNA chart disappear entirely.

## 5. Typography

* **Display:** `Fraunces`, weight 700, tracking `-0.04em` or tighter.
  Every page that uses it must also *load* it — a page that declares
  `--font-serif` without the matching `<link>` renders in system Times.
* **Body:** `Inter`. Buttons and labels are small, uppercase, tracked `0.05em`.
* **Fluid sizing.** Display type uses `clamp()`. A fixed display size that is
  larger on a phone than on a desktop is a bug.
* Text is never hidden to make it fit. `nowrap` + `ellipsis` on a real choice
  removes the choice; wrap and rescale instead.

## 6. Motion

* **Hover:** buttons invert sharply, using the contrast rule in §3.
* **Transforms:** `scale(1.02)` on hover, `scale(0.98)` on active, easing
  `cubic-bezier(0.34, 1.56, 0.64, 1)`. Scale-on-hover applies only under
  `@media (hover: hover) and (pointer: fine)` — scaling a full-width mobile
  button reads as a rendering glitch.
* **`prefers-reduced-motion` is honoured globally** in `tokens.css`, and any
  pointer-driven effect must check it and coalesce writes to one per frame.

## 7. Interaction floor

* **Focus:** `2px solid var(--color-primary)` with `4px` offset.
* **Touch targets:** minimum `var(--tap-min)` (44px) on every button and link.
* **Hit areas match their control.** An overlay above a control must not be the
  control; a heading that visually sits on a choice card must not select it.
* **Anything clickable is a `<button>` or `<a>`,** never a `<div>` with a
  listener.
* **State changes are announced.** Surfaces that mutate without navigation
  (swipe deck, dashboard feedback, form submissions) carry an `aria-live`
  region.

## 8. States

Every data-driven surface ships four: **loading, empty, error, and populated.**
A blank page is not an empty state. Errors name what failed and what survived,
and offer a way back.

Destructive actions confirm first. Reporting success must never delete the
thing the user succeeded at — it moves to a record instead.

## 9. Browser surfaces

Selection, caret, scrollbars, focus rings, underline offset, and tabular
numerals are themed from the palette in `tokens.css`. They ship with the design,
not with the browser.
