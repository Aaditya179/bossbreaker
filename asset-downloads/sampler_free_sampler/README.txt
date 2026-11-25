Free Sampler - Animated Pixel Art Units
=======================================

One character from each pack, free to try.
8 animated units, 60 animations, 768 frames in total.

CONTENTS
  units/<unit_id>/
    <unit_id>_<animation>.png   horizontal sprite strip, equal-size cells
    <unit_id>_<animation>.gif   2x preview (idle / breathing / attack)
    <unit_id>.json              frame size, frame count, fps, loop flag
  index.json                    every unit and animation in this pack
  preview_sheet.png             all units at a glance
  preview_showcase.gif          animated sample

ENGINE SETUP
  Unity:   Import the strip, Sprite Mode = Multiple, Filter = Point,
           Compression = None. Sprite Editor > Slice > Grid By Cell Size,
           use frame_width / frame_height from the json.
  Godot 4: AnimatedSprite2D > SpriteFrames > "Add frames from sprite sheet",
           Horizontal = frame count, Vertical = 1. Texture filter = Nearest.
  Unreal:  Enable Paper2D, import the strip, Extract Sprites > Grid,
           cell size from the json, then Create Flipbook.
  GameMaker / Phaser / others: every strip is a single row of equal cells,
           so any grid slicer works.

Pixel art looks best scaled by whole numbers (2x, 3x, 4x) with nearest
neighbour filtering.

MORE CHARACTERS
  8 packs, 696 animated characters in the same layout:
  https://torpilstudio.com/en/magaza/fantasy-pixel-art-characters

LICENSE
  The source artwork was released into the public domain under CC0 1.0.
  You may use it in commercial and non-commercial projects without credit.
  This pack is a cleaned, sliced and documented edition of that artwork.
