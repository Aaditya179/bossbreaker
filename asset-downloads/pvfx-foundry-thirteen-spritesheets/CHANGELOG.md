# Changelog

## 1.2.0 — unreleased

- 100 new effects, for 253 in all across 18 families: 167 one-shots and 86
  seamless loops, 4,838 frames per tier and layout.
  - Combat: `melee/greatsword-sweep`, `quickdraw-slash`, `uppercut`,
    `rapier-flurry`, `scythe-reap`, `spin-slash`, `shield-bash`;
    `impacts/metal-clang`, `wood-splinter`, `magic-hit`, `crater-impact`,
    `block-guard`, `slime-splat`; `explosions/barrel-explosion`,
    `frost-explosion`, `toxic-explosion`, `cluster-bomb`.
  - Elements: six fire, four ice, five lightning, five holy and seven shadow
    effects, from `fire/fire-breath` to `shadow/void-rift`.
  - Six nature, five water, five wind and four smoke effects.
  - Six status loops and one-shots (`status/target-mark`, `confused`, `haste`,
    `berserk`, `petrified`, `silenced`) and seven interface effects.
  - Three projectile pairs: `projectiles/acid-glob-*`, `arrow-flight` (with
    the 1.0 `arrow-impact`) and `shuriken-*`; six sci-fi effects.
  - Six ambient loops, including `ambient/sandstorm`, a weather tile that
    repeats seamlessly in both directions, and `ambient/fog-bank`, a ground
    band that repeats along x (as do `shadow/dark-mist` and `fire/fire-wall`);
    six arcane effects.
- Every 1.1 effect and colour variant is pixel-identical to 1.1.0; nothing was
  reworked, so `legacy/` holds the same releases as 1.1.
- `pack.json` is unchanged in shape.

## 1.1.0 — unreleased

- 52 new effects, for 153 in all across 18 families: 102 one-shots and 51
  seamless loops, 2,842 frames per tier and layout.
  - **Spell sets.** A cast (charge-up) for every element: `fire/fire-cast`,
    `ice/ice-cast`, `lightning/lightning-cast`, `holy/holy-cast`,
    `shadow/shadow-cast`, `nature/nature-cast`, `arcane/arcane-cast`,
    `water/water-cast`. Five projectiles as a flight loop plus a matching
    impact: `projectiles/fireball-*`, `lightning-bolt-*`, `holy-lance-*`,
    `water-bolt-*` and `thorn-shot-*`. Three status loops:
    `status/soaked`, `status/slowed` and `status/blessed`.
  - **Sci-fi**, a new family of 15: muzzle flash, shotgun blast, bullet tracer
    and impact, mech explosion, rocket exhaust, laser beam and impact, plasma
    bolt and impact, EMP pulse, energy shield and shield hit, teleport beam,
    hologram glitch.
  - **Ambient**, a new family of 13 loops: wall torch, candle flame, rising
    embers, fireflies, waterfall, magic motes, lava bubbles, crystal glow,
    portal idle, and four weather tiles that repeat seamlessly in both
    directions: rain, snowfall, cloud drift and falling leaves.
  - **Extras:** `melee/dagger-slash`, `melee/whip-crack` and
    `impacts/death-poof`.
- Colour variants: 81 recolours of 20 effects (for example
  `impacts/hit-spark` in frost, venom, void and spirit), each in both tiers
  and both layouts under `effects/<id>/variants/<name>/`. Paired effects
  (energy shield and shield hit, plasma bolt and plasma impact) share the same
  variants.
- 12 effects were reworked after losing blind comparisons against reference
  packs: `arcane/arcane-beam`, `arcane/arcane-orb-projectile`,
  `explosions/implosion`, `impacts/blood-splat`, `lightning/static-burst`,
  `projectiles/magic-missile`, `shadow/curse`, `status/stun-stars`,
  `ui/coin-pickup`, `ui/treasure-glint`, `water/water-splash` and
  `wind/wind-gust`. Their IDs, canvas sizes and pivots are unchanged; their
  pixels, and for some their frame counts, changed. The 1.0.0 sheets of these
  12 are kept unchanged in `legacy/1.0.0/`.
  - `shadow/curse` now opens a dark pool on the ground below its pivot.
- `pack.json` adds `variants`, `impact_ms` (the release or hit time of casts,
  impacts and other effects that build up), and `previous` (the 1.0.0 sheets
  kept for reworked effects). Existing fields are unchanged.
- Every other 1.0 effect is pixel-identical to 1.0.0.

## 1.0.0 — 2026-11-03

- A new library: 101 pixel-art effects across 16 families (arcane, explosions,
  fire, holy, ice, impacts, lightning, melee, nature, projectiles, shadow,
  smoke, status, UI, water, wind), 77 one-shots and 24 seamless loops, 1,826
  frames per tier and layout.
- Two style tiers for every effect. `lit` keeps colour plus additive light and
  translucent smoke and glow. `strict` is limited-palette, banded light and
  binary alpha, for engines and styles that need hard pixels.
- Each effect has its own native canvas, from 32×32 to 180×72, and its own
  frame timing, instead of one shared 96×96 cell.
- Every sheet is rendered by the deterministic effect-program runtime, checked
  against recorded goldens, and lint-clean in both tiers.
- The 44 effects from 0.10.0 are kept, unchanged and with their own checksums,
  under `legacy/0.10.0/`. Their effect IDs and pixels have not changed.

Earlier history is in `legacy/0.10.0/CHANGELOG.md`.
