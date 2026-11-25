# Supplied asset packs

The user-supplied packs are preserved in this directory. No art has been imported into the game yet: the Phaser AE upload command reports that uploading user files requires Phaser Pro. The game currently uses its existing procedural art.

- `pvfx-foundry-thirteen-spritesheets/`: PVFX Foundry 1.2, by nerijs / Studio Deimos, https://nerijs.itch.io/pvfx-foundry, CC0 1.0. Each grid sheet has eight columns. The following are real `strict/grid/sprite-sheet.png` files; paths below are relative to the pack's `effects/` directory. Frame timing and pivots come from the adjacent `manifest.json`.
  - `impacts/ground-slam`: 128×64 cells, pivot (64,44), 19 frames, 70 ms per frame.
  - `fire/fireball-impact`: 96×64 cells, pivot (72,38), 15 frames, 70 ms per frame.
  - `ice/ice-shatter`: 100×64 cells, pivot (50,54), 23 frames, 70 ms per frame.
  - `lightning/lightning-strike`: 96×128 cells, pivot (38,118), 18 frames, 80 ms per frame.
  - `wind/wind-gust`: 96×48 cells, pivot (48,24), 13 frames, 70 ms per frame.
  - `nature/earth-spike`: 128×64 cells, pivot (62,54), 22 frames, 70 ms per frame.
- `sampler_free_sampler/`: Free Pixel Art Characters by Torpil Studio, https://torpilstudio.itch.io/free-pixel-art-characters. The creator describes the underlying artwork as CC0. Each character's JSON specifies the actual frame dimensions, count, timing and loop flag. No replacement player has been selected.
- `Monsters_Creatures_Fantasy/`, `Monster_Creatures_Fantasy(Version 1.2)/`, and `Monster_Creatures_Fantasy(Version 1.3)/`: Monsters Creatures Fantasy by LuizMelo, https://luizmelo.itch.io/monsters-creatures-fantasy, CC0. The original contains idle, attack, hit and death strips; the later folders provide additional animations.

After Phaser Pro upload is available, use `npm run -s upload -- <file> --key <key> --note <description>` for the selected files, inspect the generated asset manifest, then implement and visually verify animation playback. Do not add paths to `game/assets.json` by hand; it is managed by the Phaser AE importer.
