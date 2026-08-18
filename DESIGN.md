# Fallow Design System

This document captures the visual design system and technical constraints for the Fallow application, following the "High-End Editorial" aesthetic established via Impeccable.

## 1. Core Principles
* **Editorial & Graphic:** The interface should feel like a premium print magazine. Content floats in asymmetric space, anchored by stark, deliberate grid lines.
* **Tactile:** The digital space must feel physical. We achieve this via a persistent SVG paper grain overlay.
* **Severe Interactions:** No soft, bouncy, playful UI. Interactions are stark, heavy, and deliberate.

## 2. Typography
* **Display Font:** `Fraunces` (Serif). Used for all headings (`h1` - `h6`), logos, and large structural numbers.
  * **Weight:** 700 (Bold) for maximum contrast.
  * **Tracking:** Tightly tracked (`letter-spacing: -0.04em` or tighter) to create dense, graphic blocks of text.
* **Body Font:** `Inter` (Sans-serif). Used for all reading text, UI labels, and buttons.
  * **Buttons/Labels:** Small, uppercase, widely tracked (`letter-spacing: 0.05em`).
  * **Reading Text:** 400 weight, highly legible.

## 3. Color Palette
The palette is rooted in rich, tactile earth tones.
* `--color-bg`: `#EAE5DC` (Textured paper base)
* `--color-text`: `#1C1A17` (Deepest charcoal, never pure black)
* `--color-primary`: `#D9532A` (Vibrant Oxidized Terracotta - used for active states and accents)
* `--color-secondary`: `#5F6B5F` (Deep Sage)
* `--color-accent`: `#B07D35` (Amber)

## 4. Spacing & Structure
* **Borders:** All dividing lines and structural borders must be `2px solid var(--color-border)` (which maps to the dark text color).
* **Radii:** `0px` globally. No rounded corners. No pill buttons.
* **Shadows:** `none`. Depth is achieved through typography scale and borders, not shadows.

## 5. Interactions & Motion
* **Hover States:** Buttons invert colors sharply. 
* **Transforms:** Interactive elements scale up slightly (`1.02`) on hover and depress (`0.98`) on active, using a snappy cubic-bezier spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
* **Focus:** All interactive elements must have a strict `2px solid var(--color-primary)` outline with a `4px` offset for accessibility.

## 6. Hardening Constraints
* Ensure text doesn't break layouts by utilizing `text-overflow: ellipsis`, `overflow: hidden`, and `white-space: nowrap` where applicable in UI components.
* All touch targets (buttons, links) must have a minimum height of `44px`.
