# Importing PVFX Foundry 1.2

Every effect lives at `effects/<family>/<effect>/<tier>/<layout>/`, where tier
is `lit` or `strict` and layout is `grid` or `packed`. Each holds
`sprite-sheet.png` and `manifest.json`.

## Grid sheets

Grid sheets need only the effect's size and frame count.

- Cell size: the effect's canvas, `source_size` in the manifest (`size` in
  `pack.json`). Sizes differ between effects.
- Columns: 8.
- Order: row-major, starting at frame 0.
- Filtering: nearest-neighbour. Wrapping: clamp. Background: transparent RGBA.

For zero-based frame `n` and a `w`×`h` canvas:

```text
x = (n % 8) * w
y = floor(n / 8) * h
```

The final row may contain transparent unused cells. Stop at the declared frame
count; do not infer it from the sheet dimensions. The anchor point inside each
cell is `pivot` in the manifest.

## Packed sheets

Packed sheets trim every frame and place it with one pixel of extrusion plus
one pixel of transparent padding. They require the manifest.

For each manifest frame, read `sheet.x`, `sheet.y`, `sheet.width`, and
`sheet.height`. The pivot in sheet pixels is:

```text
[sheet.x, sheet.y] + trimmed_pivot * sheet.scale
```

A trimmed pivot may fall outside the cropped frame; that is valid and keeps the
effect aligned to its gameplay anchor. A frame with nothing visible has
`visible_bounds: null` and a 1×1 transparent placement; show nothing for its
duration.

## Timing and loops

Every frame records its duration as exact rational milliseconds,
`numerator_ms / denominator`. Durations are constant within an effect and
differ between effects; `frame_ms` in `pack.json` gives the value. Read
`loop_mode` from the manifest, `loop` or `none` (`loop` in `pack.json`): loops
are seamless from the last frame back to the first, and one-shots end on an
empty frame.

## Colour variants

Some effects also come in other colours under
`effects/<family>/<effect>/variants/<variant>/<tier>/<layout>/`, for example
`effects/impacts/hit-spark/variants/frost/lit/grid/`. A variant has the same
frame count, timing, canvas and pivot as the original, so one import setup
serves every colour. `pack.json` lists each effect's variants.

## Projectiles: flight and impact pairs

Effects named `<name>-flight` (for example `projectiles/fireball-flight`) are
seamless loops of a projectile in flight. The projectile points right (+x)
and stays at the pivot; move the sprite in your engine and rotate it to the
direction of travel. Play the matching `<name>-impact` at the hit point when
it lands, rotated the same way: the impact assumes the projectile arrived
travelling right.

## Casts

`<element>-cast` effects are charge-ups for the caster's hand or feet. Spawn
the projectile on the release frame: `impact_ms` in the effect's `pack.json`
entry, measured from the start of the clip. Impacts and other effects that
build up first carry `impact_ms` too, the moment the hit lands.

## Tiling weather and ground bands

`ambient/rain`, `ambient/snowfall`, `ambient/cloud-drift` and
`ambient/falling-leaves` (128×128) and `ambient/sandstorm` (160×120) tile
seamlessly in both directions. Repeat them across the screen with wrap or
repeat addressing (instead of clamp), all copies showing the same frame, and
overlay the result on your scene.

`ambient/fog-bank` (160×56), `shadow/dark-mist` (128×52) and `fire/fire-wall`
(128×76) are ground bands that tile horizontally: repeat them along x at the
ground line, all copies showing the same frame, with wrap addressing on x.

Every other effect should use clamp.

## Legacy effects

`legacy/0.10.0/` is the complete 0.10.0 release with its own `README.md`,
`IMPORTING.md`, index and checksums. Its effects use 96×96 cells, five columns
and 50 ms frames.

`legacy/1.0.0/` holds the 1.0.0 sheets and manifests of the effects that were
reworked in 1.1, at their 1.0.0 paths, so a game can keep the old look while
it updates. Effects not listed there did not change.
