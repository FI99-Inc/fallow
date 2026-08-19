# Fallow Design System

The visual system for Fallow, a psychological activity-discovery product.

The aesthetic is **Pastel Field**: editorial structure on coloured ground. This
document describes what the code actually does; when the two disagree, the code
is the bug.

> A fallow field is land deliberately left to rest so it can grow something
> better later. The page is that field, seen across a season.

## 1. Core principles

* **Colour carries the rhythm.** The page is a sequence of edge-to-edge pastel
  bands. A new ground *is* the section break — not a shadow, not a card, not a
  container. This replaced a single cream ground on which every section had
  identical weight and the page read as one undifferentiated column.
* **Editorial and graphic.** Content sits in asymmetric space anchored by 2px
  ink hairlines. Hierarchy comes from scale and rhythm, never from fills.
* **Severe treatment, warm copy.** Zero radius, zero shadow, hard rules. The
  severity is in the *geometry*; the writing stays warm, because the reader is
  someone embarrassed to be a beginner.

## 2. Tokens

`tokens.css` is the single source of truth and loads first on every page. Page
stylesheets must not redeclare tokens, the reset, the grain, focus rings, or
selection colours. A `var()` that resolves to nothing does not fail loudly — it
silently unsets the property and ships invisible UI, so **every name used must
be defined in `tokens.css`.**

## 3. Colour

### The fields

Pastel grounds, applied only through the `.field-*` classes. Never hand-write a
field hex on an element.

| Token | Value | Used for |
|---|---|---|
| `--field-mist` | `#E6E9F5` | Pale periwinkle — the default ground |

**Exception — the opening band.** The landing page's first band (`.hero-band`
in `index.css`) is the one place a field is not flat: a diagonal blend of
`--field-lilac` → `--field-mist` → `--field-sky`, still built only from
tokens above. `--field-mist` alone read as near-white at first paint, the
worst possible first impression for a site whose whole idea is colour. This
is the page's one deliberate exception to "one flat field per band" — it
does not license gradients elsewhere.
| `--field-sprout` | `#D8E8D0` | Pale green — growth, "how it works" |
| `--field-bloom` | `#F6DCE2` | Pale pink — the human/emotional beat |
| `--field-sun` | `#F8E9C8` | Pale butter — the payoff and the ask |
| `--field-sky` | `#D6E4F0` | Pale blue — calm, explanatory |
| `--field-lilac` | `#E4DBF0` | Pale violet — the odd one out |
| `--field-ink` | `#241F2E` | The single dark band. Used **once** per page |

Every light field carries `--color-text` at 12:1 or better and
`--color-text-muted` at 5.5:1 or better. These were measured, not assumed; a new
field must be measured before it ships.

**`--field-ink` is its own token on purpose.** `.field-ink` redefines
`--color-text` for its subtree, so painting it with `background: var(--color-text)`
resolves against the element's *own* new value and renders a pale band with pale
text on it. A band cannot paint itself with a property it also redefines.

### Ink and accent

| Token | Value | Use |
|---|---|---|
| `--color-text` | `#241F2E` | Deep aubergine. Inside the pastel hue family, never neutral black |
| `--color-text-muted` | `#5A5470` | Violet-grey. Tinted, never grey |
| `--color-surface` | `#FCFAFF` | Bounded objects — cards, panels, decks |
| `--color-primary` | `#E0512B` | Vermilion. Fills, borders, large display type |
| `--color-primary-deep` | `#B23A18` | Clears 4.5:1 on **every** field |
| `--color-secondary` | `#2E6B52` | Deep green — growth, success, done |
| `--color-accent` | `#6B4FA8` | Violet — surprise, the curveball |
| `--color-border` | `#241F2E` | Structural hairlines are ink |

**The vermilion rule.** `--color-primary` is legal for large display type,
borders, focus rings, and decorative fills. Anything carrying body-size text —
in either direction — uses `--color-primary-deep`. This is load-bearing.

Pure white and pure black are not in the system.

## 4. Structure

* **Borders:** `var(--border-weight)` (2px) `solid var(--color-border)`.
* **Radii:** `0px` globally. No rounded corners, no pill buttons.
* **Shadows:** `none`.

### 4a. Bands and containers

> **`.band` paints the colour. `.container` inside it owns width and inline
> padding. They are never the same element.**

They used to be. `.section { padding: X 0 Y }` and `.container { padding: 0 X }`
landed on one element, and the section's shorthand silently zeroed the
container's horizontal padding — putting body text flush against the screen edge
on every phone. Vertical rhythm is therefore set with `padding-block`, which
cannot reach `padding-inline`.

### 4b. Bounded objects

Because radii, shadows, and gradients are all spent, the system needs one
explicit mechanism for "this is a discrete thing you can act on":

> **`background: var(--color-surface)` + `2px solid var(--color-border)`.**

Applies to swipe cards, recommendation cards, commitment cards, choice buttons,
chart panels, and empty states. Its absence was a real defect once: transparent
surfaces with no border are not restraint, they are missing UI.

## 5. Typography

* **Display:** `Fraunces` 700, tracking `-0.04em` or tighter, capped at `6rem`.
  Every page using it must also *load* it.
* **Body:** `Hanken Grotesk`. Buttons and labels small, uppercase, tracked `0.05em`+.
  Replaced Inter, which the site shared with nearly every other pastel-and-serif
  product of this era; Hanken Grotesk keeps the same weight range and warmth
  but reads as this product's voice rather than a template default.
* **Fluid sizing.** Display type uses `clamp()`. A fixed display size that is
  larger on a phone than on a desktop is a bug.
* Text is never hidden to make it fit. Wrap and rescale instead.

## 6. Motion

* **One authored moment per surface,** not the same entrance on every section.
  On the landing page that moment is the rule growing out from under
  "See what grows."
* **Easing** is exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), not
  bounce. Hover transitions are colour only.
* **`prefers-reduced-motion` is honoured globally** in `tokens.css`.

### 6a. Reveal-on-scroll is opt-in

`.fade-up` defaults to **visible**. Hiding happens only under `.js-reveal`,
which `reveal.js` adds to `<html>` — and only after confirming it can also
reveal them again. `reveal.js` additionally ships a 3-second dead-man's switch.

This rule exists because the dashboard shipped as a permanently blank page: it
loaded `index.css` (which hid `.fade-up`) without `index.js` (which held the
only observer). **A page that never wires an observer must degrade to readable
content, never to a blank screen.**

## 7. Interaction floor

* **Focus:** `2px solid var(--color-primary-deep)` at `4px` offset.
* **Touch targets:** minimum `var(--tap-min)` (44px) on every button and link,
  the logo included when it is a link.
* **Anything clickable is a `<button>` or `<a>`,** never a `<div>` with a listener.
* **Destructive actions are not peers of safe ones.** "Reset DNA" is a quiet
  underlined text action set apart from the button row, and it confirms first.
* **State changes are announced** via `aria-live`.

## 8. States

Every data-driven surface ships four: **loading, empty, error, populated.**
A blank page is not an empty state. Errors name what failed and what survived.

The empty state is often the most-seen screen on a surface. Write it as an
invitation, not a dead end — the dashboard's empty state carries the product's
own line rather than an apology.

## 9. Copy

The site's line is **"Let your mind lie fallow. See what grows."** It is the
only copy that explains the product's name, so it opens the landing page as the
headline, closes it in the footer, and recurs at the payoff moments (quiz
completion, results footer, empty dashboard).

**Generated copy must vary.** Recommendation rationales are scored per-activity
against the profile and pick a dimension no other card has claimed, because five
cards that print one sentence with the name swapped read as a mail-merge and
disprove the product's central claim. A "what might not work" section that says
"it hits all your sweet spots" is flattery in a slot reserved for honesty: a
caveat fires only on genuine *opposition* (opposite signs), not on a magnitude
gap between two facts that agree.

## 10. Browser surfaces

Selection, caret, scrollbars, focus rings, underline offset, and tabular
numerals are themed from the palette in `tokens.css`. They ship with the design,
not with the browser.
