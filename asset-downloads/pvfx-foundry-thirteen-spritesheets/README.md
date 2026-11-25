# PVFX Foundry 1.2

253 pixel-art visual effects for games: impacts, slashes, explosions, fire,
ice, lightning, holy and shadow magic, nature, water, wind, smoke, status
auras, spell casts and projectiles, sci-fi weapons and gadgets, ambient loops
and tiling weather, and interface feedback. Every effect comes in
two style tiers and two sheet layouts, with exact frame metadata.

You do not need Pixel VFX Studio to use this pack.

## What is new in 1.2

- **100 new effects** across every family, for 253 in all.
  - **Combat:** a greatsword sweep, quickdraw slash, uppercut, rapier flurry,
    scythe reap, spin slash and shield bash; metal, wood, magic, crater, block
    and slime hits; barrel, frost, toxic and cluster explosions.
  - **Elements:** a fire wall, flame ring, fire dash, phoenix burst,
    incineration and fire breath; icicle rain, ice shatter, frost armour and
    frozen ground; arc discharge, a lightning whip, thunderclap, storm field and
    lightning dash; sanctuary, purify, a falling holy sword, holy nova and a
    halo crown; shadow step, shadow spikes, dark mist, a hex sigil, a void
    rift, a shadow burst and a doom mark.
  - **Nature, water, wind and smoke:** a thorn wall, pollen, rockfall, mud,
    sprouts and quicksand; a water jet, ripples, a bubble shield, a water whip
    and drips; a tornado, air burst, updraft, vacuum pull and sonic boom;
    landing dust, chimney smoke, a smoke screen and soot.
  - **Status and interface:** target mark, confused, haste, berserk,
    petrified and silenced; gem, mana and heal pickups, buff and debuff
    arrows, a chest opening and a click ripple.
  - **Projectiles and sci-fi:** acid glob, arrow and shuriken flights with
    their impacts; a railgun shot, laser sword, warp jump, cloak shimmer, drone
    thruster and scanner sweep.
  - **Ambient and arcane:** dust motes, water sparkle, broken-wire sparks, a
    lantern, a sandstorm tile and a low fog bank that repeat seamlessly across
    the screen; a mana shield, arcane rain, time stop, gravity
    well, dispel and polymorph poof.
- Every 1.1 effect and colour variant is pixel-identical to 1.1.0.

## What was new in 1.1

- **Spell sets.** Every element got a cast (a charge-up for the caster's
  hand), and five projectiles as a flight loop you move in your engine plus a
  matching impact: fireball, lightning bolt, holy lance, water bolt and thorn
  shot. Status loops: soaked, slowed and blessed.
- **Sci-fi** and **Ambient**, two new families, including four weather tiles
  (rain, snowfall, clouds, falling leaves).
- **Colour variants.** 81 recolours of 20 effects.
- **Reworks.** 12 effects that lost blind comparisons against other packs
  were redrawn. Their 1.0 versions are kept in `legacy/1.0.0/`.

1.0 replaced the pack's look with a new generation of effects: each one a
small authored animation with anticipation, a peak, and a decay that steps
down a colour ramp, drawn at its native size with its own frame timing.

## Two style tiers

- `lit`: full colour with additive light and translucent volumes. Glows, smoke
  and heat haze keep soft alpha. Use it for most modern pixel-art games.
- `strict`: a limited palette, banded light, and binary alpha: every pixel is
  either fully opaque or fully transparent. Use it for strict palettes, GIF
  output, or engines without alpha blending.

## What is included

- 253 effects, 167 one-shots and 86 seamless loops, 4,838 frames per tier.
- 81 colour variants of 20 of those effects.
- 1,336 transparent PNG sprite sheets: for each effect or variant and each
  tier, one fixed grid sheet and one trimmed packed sheet.
- A JSON manifest beside every sheet with frame order, exact durations, pivots,
  visible and trim bounds, sheet placements, and per-frame pixel hashes.
- `pack.json`, an index of every effect with its name, description, tags, size,
  timing, loop flag, release or hit time, and variants.
- The 1.0 sheets of the 12 reworked effects under `legacy/1.0.0/`, and the
  0.10.0 release's 44 effects, unchanged, under `legacy/0.10.0/`.

The download contains sprite sheets and metadata only: no project source,
engine plugins, or software.

## Fastest import

Open `effects/<family>/<effect>/lit/grid/sprite-sheet.png`. Slice it into cells
of the effect's size (in `pack.json` and the manifest's `source_size`) with
eight columns, read frames left to right, top to bottom, and stop at the frame
count. Use nearest-neighbour filtering.

For smaller textures and trimmed pivots, use the `packed` sheet and follow its
manifest placements. See `IMPORTING.md` for formulas, projectile pairs, casts
and tiling weather, and `FORMAT.md` for the pack contract.

## License

The rendered sprite sheets and bundled metadata and documents are dedicated to
the public domain under CC0 1.0 Universal. Attribution is appreciated but not
required. A suggested credit is:

> VFX from PVFX Foundry by Pixel VFX Studio

The dedication does not cover Pixel VFX Studio software, effect program source,
or product marks, none of which are included. See `LICENSE.txt` for the exact
scope and legal text, and `THIRD_PARTY_NOTICES.txt` for credits.

## Feedback

Tell us on the itch.io page which effects you use and what your game needs
next.
