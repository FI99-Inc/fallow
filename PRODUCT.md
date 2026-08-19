# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students caught in a specific loop: doomscrolling in bed wishing
they were doing something, then going out and doing something that doesn't
actually fit them, wishing they were back in bed. They want a new activity —
either something to do alone, or something that could turn into a real
friendship with people they meet doing it.

**This is who the product is designed and catered for, but it is never
stated on the page.** The site never says "for students" or names this
scroll-then-regret cycle directly; it speaks to the underlying feeling
instead. Future copy work should keep it that way unless the user says
otherwise — do not add "college students" or similar demographic language
to visible copy.

## Product Purpose

Fallow gets someone from "stuck in bed, doomscrolling" to a specific,
concrete first step for an activity they'll actually enjoy — solo or as a
way to meet people — without the overwhelm of generic hobby listicles.
Success is a small, doable-this-week action, not a saved list.

## Positioning

Fallow asks *why*, not *what*. Instead of "what do you like to do," a
behavioral quiz (pairwise choices, scenario tradeoffs, constraint checks)
derives a 6-dimensional psychological profile — Sociality, Structure,
Physicality, Expression, Environment, Barrier — called the user's "Activity
DNA." Recommendations are matched on that profile, not on stated interest,
which is how the product surfaces activities a person would never have
searched for. The DNA keeps evolving from swipe feedback after onboarding,
and the activity catalog itself scales through an AI pipeline (Gemini) that
generates new activities and validates their computed psychological
dimensions against the math — no human curation bottleneck.

## Operating Context

1. **Onboarding quiz** (`onboarding.html`) — ~13 quick, Tinder-style
   pairwise/scenario questions, ~3 minutes, no interest questions.
2. **Results** (`results.html`) — the Activity DNA summary plus 5 curated
   recommendations, each with why it fits, what might not work (a real
   caveat, not flattery), and the smallest first step.
3. **Browse/swipe** (`browse.html`) — one activity at a time, swipe to
   pass/save/like; every swipe nudges the DNA profile live, visible in a
   "DNA Evolution" panel.
4. **Dashboard** (`dashboard.html`) — "commitments": activities the person
   has actually decided to try, each with its smallest first step.
5. **Share** — export/share the DNA profile or a result via `html2canvas`.
6. **Blend / two-player mode** — combine two people's DNA for activities
   they could do together, directly serving the "meet people" half of the
   audience's want.

## Capabilities and Constraints

- 100% vanilla HTML/CSS/JS frontend, no build step, no framework.
- Supabase (Postgres + auth) as the backend, queried directly from the
  client.
- Python + Gemini API pipeline (`pipeline/generate_activities.py`) generates
  new activities, computes their psychological dimensions, and validates
  them (`docs/validation-framework.md`) before they enter the database.
- 65 seed activities ship in `supabase/seed_activities.sql` /
  `data/activities.json`.

## Brand Commitments

- Name: **Fallow** — a field deliberately left to rest so it can grow
  something better later; this is the product's own metaphor for the
  scroll-then-regret cycle, not an arbitrary name.
- Tagline: **"Let your mind lie fallow. See what grows."** — load-bearing
  copy; it's the only line that explains the name, and it recurs at the
  hero, footer, results, and dashboard empty state. Preserve it.
- Voice: warm, direct copy over a deliberately severe geometric visual
  system (see `DESIGN.md` — Pastel Field). Don't flatten the warmth to
  match the geometry.

## Evidence on Hand

- `assets/fallow_hero.jpg` — real hero image asset.
- `data/activities.json` / `supabase/seed_activities.sql` — 65 real seed
  activities with computed psychological dimensions.
- `docs/validation-framework.md` — the real validation logic the pipeline
  applies to generated activities.
- **No real users, testimonials, or usage data exist.** This is a personal
  project, not a live product with real users — treat it as pre-audience.
  The landing page's "quote cards" ("I have a hobby graveyard in my
  closet") are illustrative voice-of-user copy the product author wrote,
  not real testimonials. Do not present them as real quotes, and do not
  fabricate new testimonials, user counts, or usage claims.

## Product Principles

1. **Ask why, not what.** Every product decision should prefer behavioral/
   psychological signal over stated interest.
2. **The first step must be small enough to do this week.** No overwhelm,
   no "here's everything you'd need to know" — the smallest possible entry
   point, every time.
3. **Speak to the feeling, never name the demographic.** The audience is
   university students in a doomscroll-then-regret loop, but the product
   never says so on-page — it stays in the feeling, not the label.
4. **Solo and social are equally first-class.** The same profile can be
   optimizing for alone-time or for meeting people; the product must not
   default to assuming "go socialize" is the win condition.
5. **The catalog scales without a human bottleneck.** New activities come
   from the AI pipeline, validated against the psychological math, not
   hand-curated — content growth is a system property, not a task.
