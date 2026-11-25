# PVFX Foundry format 1 (1.2)

## Stability

`pack.json` uses `pvfx.asset-pack/1` with pack ID `pvfx.foundry`. Effect IDs
(`<family>/<effect>`) are stable. Patch releases do not intentionally change
canonical pixels; any intentional pixel, timing, or layout change gets a new
minor version and a changelog entry.

## Directory contract

```text
effects/<family>/<effect>/lit/grid/{sprite-sheet.png,manifest.json}
effects/<family>/<effect>/lit/packed/{sprite-sheet.png,manifest.json}
effects/<family>/<effect>/strict/grid/{sprite-sheet.png,manifest.json}
effects/<family>/<effect>/strict/packed/{sprite-sheet.png,manifest.json}
effects/<family>/<effect>/variants/<variant>/<tier>/<layout>/{sprite-sheet.png,manifest.json}
legacy/0.10.0/                 the 0.10.0 release, unchanged
legacy/1.0.0/effects/<family>/<effect>/…   the 1.0.0 sheets of effects reworked in 1.1
legacy/1.0.0/pack.json         the 1.0.0 index entries of those effects
```

Not every effect has variants. A variant is the same animation with another
palette: same frames, timing, canvas and pivot, different colours. Its
manifest records the palette under `overrides.options.palette`.

`pack.json` lists every effect with its artifacts and their SHA-256 hashes.
An effect with variants also has `variants: {<variant>: {palette, artifacts}}`,
whose artifacts have the same shape as the effect's own. `legacy` (unchanged
from 1.0) points at the 0.10.0 release. `previous` points at the 1.0.0 sheets
of the effects reworked in 1.1 and lists their IDs in `effects`; 1.2 reworked
none, so it is the same as in 1.1.
Effects with a build-up carry `impact_ms`: the time from the start of the clip
to the release or hit.
`CHECKSUMS.sha256` binds every other file in the payload, the legacy files
included.

## Export manifest

Each manifest uses `pvfx.fx.export-manifest/1` and is written by the canonical
Pixel VFX Studio exporter. It records the program and tier, renderer and
revision identities, the seed, canvas size and pivot, loop mode, and for every
frame its exact duration, visible and trim bounds, trimmed pivot, sheet
placement, and a canonical raw-RGBA pixel hash.

Grid and packed manifests of one effect and tier agree on every canonical fact;
only placements differ. The two tiers of one effect share timing, canvas and
pivot, and differ in pixels.

## Provenance

`PROVENANCE.json` records the source commit, renderer, export profile hashes,
the hash of the variant lock, and the hashes of the earlier payloads' checksum
inventories.
