# Bossbreaker

A portrait-first 16-bit pixel action roguelike deckbuilder. Face dark-fantasy bosses in compact top-down arenas, read their telegraphs, queue three cards in the right order, then move, aim and fire your sequence to break through a three-floor dungeon in one sitting.

## The game

- **Platform:** Mobile and desktop, portrait.
- **Screen:** Portrait first. On desktop the game sits centered with a dark stone backdrop on either side.
- **Graphics:** 2D, 16-bit pixel art, top-down view.
- **Audience:** Everyone. Nothing that isn't fine for a child. This only sets limits and adds nothing.
- **Length:** One sitting of ten to twenty minutes: one run through three floors.
- **Sound:** Retro synth effects, all synthesized by the engine at runtime. No audio files and no music.
- **Language:** English. Every word a player reads or hears is in English: the title, menus, buttons, HUD labels, tutorial prompts, messages, and the names of characters, cards, items and places. Text reads left to right. The brief names no font.

## Decisions

1. **Turns and real time.** The brief's game is turn-based: read the telegraph, draw, discard, queue, then execute. The page's real-time movement and aiming are kept only inside the execution phase. The hero moves freely and aims each card while the queue fires. Enemies act only after the queue has resolved, so moving out of Telegraph Markers during execution is how the player dodges.
2. **Final boss name.** "Dungeon Overlord" (The Game page) and "Abyssal Overlord" (Entities page) are the same boss. It is the **Abyssal Overlord**.
3. **Mobile fire control.** The controls table says Button A fires. The feel note says "drag to aim, let go to fire". Settled on drag on the right side of the screen to aim and release to fire. Button A and the "twin sticks" alternative are dropped.
4. **Gamepad card handling.** No page says how a gamepad picks, discards or rearranges cards. Settled: a highlight cursor moved with the left stick or d-pad, with the face buttons used to select and confirm.
5. **Treasure Chest contents.** The pages say "Relic Charm or Card Scroll", "Relic Charm and optional Heart Gem", and "Relic Charm". Settled: a Treasure Chest always grants a Relic Charm and sometimes also a Heart Gem. Card Scrolls come from cleared battle rooms, not chests.
6. **Cursed rooms.** The map lists cursed rooms on every floor, but the escalation text introduces them at Level 3. Settled: cursed rooms can appear on any floor's map. Level 3 is where Cursed Rune Tiles weigh heaviest, because the Abyssal Overlord also uses rune eruptions.
7. **End screen stats.** The two lists differ. Merged into one list: rooms cleared, bosses defeated, Relic Charms gathered, cards collected, and combos triggered.
8. **Arcane Echo Card.** The pages say "repeats or empowers". Settled: it repeats the following card, which fires twice. A repeated card counts as an empowered combo, for example for staggering Gargoyle Sentinels.
9. **Feedback effects.** Screen shake, squash and recoil, white hit-flash, shadow-smoke pops, card slide and glow, door slam and spark, and per-action synth sounds are the brief's optional polish. The pages list them as the feel. They stay in the design but are built only once everything else works.

## The design

### What it is

You are the Spellblade Hero, climbing a dungeon of three floors. Each floor is a branching map of rooms that ends in a boss arena. Every battle is played in turns:

1. You read what the enemies will do.
2. You plan a three-card sequence.
3. You play it out by moving and aiming in real time.

The order of the cards is the heart of the game. There are no energy costs.

### Core loop

1. Pick the next connected node on the Branching Dungeon Map.
2. In a battle room, the Iron Arena Door slams shut.
3. **Telegraph phase:** every enemy and boss shows a Telegraph Marker for its next move.
4. **Draw:** draw a hand of five cards. If the draw pile empties, the discard pile reshuffles instantly with a brief pause.
5. **Discard:** spend Discard Pips to swap any chosen cards for new draws. You get three Discard Pips per battle. Unused pips carry over between turns of the same battle.
6. **Queue:** place up to three cards of any type into the three Execution Slot Frames and rearrange them freely.
7. **Execute:** tap or click to fire the next queued card toward your aim while moving freely. Order combos trigger as the cards resolve.
8. **Enemy turn:** once the queue is spent, enemies carry out their telegraphed moves. Anything standing in a marked zone is hit. A new turn begins.
9. **Room cleared:** the door sparks open, any earned reward appears, and you return to the map.

### Rules

**Health and barrier**
- Health is shown by the Heart Icon.
- An active barrier, shown by the Shield Icon, absorbs hits before any health is lost.
- Losing all health ends the run.

**Order combos**
- **Frost Bolt Card, then Fireball Card immediately after:** a Steam Burst erupts at the point of impact. It knocks nearby foes back and interrupts light windups.
- **Arcane Echo Card before any attack, spell or Iron Guard Card:** the following card fires twice. This counts as an empowered combo.
- **Dash Strike Card before Slash Card:** the hero lunges into melee range, so the Slash cleaves multiple foes cleanly.
- **Iron Guard Card first in the sequence:** the barrier is up before you close distance or trade blows.

**Cursed rooms**
- Cursed Rune Tiles pulse and periodically trigger extra arena hazards.
- Surviving the room awards a rare Card Scroll.

**Rewards**
- A cleared battle room may give a Card Scroll (a new card for the deck) or a Heart Gem (restores health).
- A Treasure Vault gives a Relic Charm, sometimes with a Heart Gem.
- A Campfire lets you upgrade one card's effect or remove one card from the deck.

**Relic Charms**
- Passive for the rest of the run.
- Each one changes how spells or combos behave.

### Win, lose and score

- **Win:** defeat the Abyssal Overlord at the end of Level 3. The Victory screen opens.
- **Lose:** all health is gone. The Game Over screen opens quickly.
- **Gentle failure:** losing is soft and quick. There is no grind and no penalty, only an immediate Play Again.
- **Score:** there is no points total. A run is measured by rooms cleared, bosses defeated, Relic Charms gathered, cards collected and combos triggered, all shown on the end screen.

### Entities

**Player**
- **Spellblade Hero:** a compact hooded battlemage in a dark indigo cloak with bright gold trim, wielding a glowing arcane blade.

**Enemies**

| Enemy | How it looks | What it does |
| --- | --- | --- |
| Crypt Slime | Translucent emerald ooze with a glowing inner core | Telegraphs a short hop toward the hero and leaves a brief puddle hazard where it lands |
| Bone Archer | Nimble skeleton ranger in a tattered dark hood with a glowing violet bow | Telegraphs a straight violet arrow line across the arena and retreats if the hero gets close |
| Gargoyle Sentinel | Winged stone guardian with ember eyes and cracked granite armor | Telegraphs a wide stone slam or a swooping charge. Shrugs off light hits unless staggered by a Steam Burst or an empowered combo |

**Bosses**

| Boss | Floor | How it looks | What it does |
| --- | --- | --- | --- |
| Dread Knight | Level 1 boss | Towering horned armor in obsidian and crimson with a heavy rune greatsword | Alternates wide crimson greatsword sweeps with charging slams. At low health it shifts to faster double-telegraph swings |
| Frost Lich | Level 2 boss | Floating skeletal sorcerer in icy cyan robes, ringed by orbiting frost shards | Summons orbiting frost shards and telegraphs crossing ice lanes. Vulnerable when knockback forces it out of position |
| Abyssal Overlord | Level 3 final boss | Colossal crowned shadow-dragon knight with molten gold runes and twin dark-fire blades | Combines sweeping dark-fire arcs, Cursed Rune Tile eruptions and multi-stage patterns. Defeating it wins the run |

**Cards**

Each card is a pixel-art card with a single icon.

| Card | Icon | What it does |
| --- | --- | --- |
| Slash Card | Crimson sword arc | Close-range melee cleave |
| Dash Strike Card | Silver blade trail | Lunges in the aimed direction and strikes |
| Frost Bolt Card | Icy cyan crystal | Chilling projectile that slows enemies |
| Fireball Card | Blazing orange flame | Explosive bolt that bursts on impact. Triggers Steam Burst when it follows Frost Bolt Card |
| Iron Guard Card | Steel kite shield | Raises a temporary barrier around the hero |
| Arcane Echo Card | Violet twin star | Modifier: the following card fires twice |

**Effects**
- **Steam Burst:** a billowing white-cyan cloud with expanding force rings.

**Pickups**
- **Heart Gem:** a faceted ruby crystal that restores health.
- **Relic Charm:** an ornate golden amulet or talisman.
- **Card Scroll:** rolled parchment tied with a colored ribbon.
- **Treasure Chest:** an iron-bound oak chest with a gold clasp.
- **Campfire:** a crackling bonfire with glowing embers.

**Tiles, hazards and props**
- **Dungeon Floor Tile:** weathered slate flagstones with mossy cracks.
- **Cursed Rune Tile:** dark obsidian etched with glowing violet sigils.
- **Stone Wall & Pillar:** chiseled dark brick walls and crumbling columns. They block movement and projectiles.
- **Iron Arena Door:** a heavy barred gate.
- **Telegraph Marker:** a glowing crimson ground or arc warning showing the exact path or area of an enemy's next move.
- **Brazier:** a flickering iron torch bowl in the arena corners.

**UI**
- **Heart Icon:** a red pixel heart.
- **Shield Icon:** a silver shield, showing the barrier.
- **Discard Pips:** three glowing blue card-swap tokens.
- **Execution Slot Frames:** three ornate stone-and-gold frames.
- **Pause Icon:** two gold bars.
- **Mute Icon:** a pixel speaker.
- **Map Node Icons:**
  - skull: monster room
  - purple rune: cursed room
  - chest: treasure vault
  - flame: campfire
  - crown: boss

### Places

The dungeon has three floors, each with its own look and its own enemies.

| Floor | Look | Enemies |
| --- | --- | --- |
| Level 1: Sunken Crypt | Mossy slate flagstones, flickering amber Braziers, Stone Walls & Pillars, Iron Arena Doors | Crypt Slimes and Bone Archers. Boss: Dread Knight |
| Level 2: Frostbound Vaults | Rime-covered dark stone, pale cyan crystal pillars, drifting icy mist | Bone Archers and Gargoyle Sentinels. Boss: Frost Lich |
| Level 3: Abyssal Sanctum | Obsidian floor etched with molten gold runes, crimson-lit stone arches, rising shadow embers | Gargoyle Sentinels. Boss: Abyssal Overlord |

### Screens and flow

**The screens**
- **Title Screen:** the Bossbreaker pixel logo over a dungeon backdrop, with a Play button and the Mute Icon.
- **Branching Dungeon Map:** a vertical portrait path of connected Map Node Icons that ends in the floor's boss arena.
- **Arena Encounter:**
  - The HUD sits above the arena: Heart Icon, Shield Icon, Discard Pips, Pause Icon and Mute Icon.
  - The compact top-down arena sits in the middle.
  - The five-card hand and the three Execution Slot Frames sit below.
- **Campfire Rest:** a cozy Campfire scene with a choice: upgrade a card or remove a card permanently.
- **Treasure Vault:** a torchlit alcove centered on a Treasure Chest.
- **Pause Menu:** a small overlay with Resume, Restart Run and a Mute toggle.
- **Victory / Game Over End Screen:** the run summary and a Play Again button.

**How they flow**
1. The Title Screen leads to the map. On a first run, the first room is the tutorial encounter.
2. From the map, each node opens its screen: Arena Encounter for monster, cursed and boss rooms, Campfire Rest, or Treasure Vault.
3. Each node screen leads back to the map.
4. Beating a floor's boss leads to the next floor's map.
5. Beating the Abyssal Overlord leads to Victory. Losing all health leads to Game Over.
6. Play Again starts a new run.
7. Pause opens over any play screen.
8. Mute works with one press anywhere it appears, and the choice is remembered next session.

### Controls

| Action | Desktop | Mobile | Gamepad |
| --- | --- | --- | --- |
| Move | W / A / S / D | Virtual stick (left) | Left stick |
| Aim | Mouse | Drag on the right side | Right stick |
| Fire next queued card | Left click | Release the aim drag | RT |
| Pick, discard and rearrange cards | Click cards, drag to reorder | Tap cards, drag to reorder | Cursor on left stick or d-pad, face buttons to select and confirm |
| Pause | Escape / P | Pause Icon | Start |

On-screen controls appear only on touch screens.

### How a new player learns

The first encounter is a short hands-on tutorial that teaches by doing, not by reading. It guides the player to:
- move,
- aim,
- read a Telegraph Marker and step out of it,
- slot a two-card Frost Bolt Card then Fireball Card combo and see the Steam Burst.

### Optional polish (only once everything above works)

- The screen shakes when heavy spells and Steam Bursts hit.
- The Spellblade Hero squashes slightly and recoils backward on every cast.
- Hit creatures flash white and pop into shadow smoke when defeated.
- Cards slide smoothly into the hand and glow when ready to cast.
- Iron Arena Doors slam shut with a heavy thud and spark open when the room is clear.
- A crisp retro zap or chime plays for every cast, hit and card draw.

## Difficulty & Feel

### Targets

- **Careless player:** one who ignores Telegraph Markers, never spends Discard Pips and skips defensive or combo ordering. They start taking steady hits in the later rooms of Level 1 and most likely fall to the Dread Knight or early in Level 2.
- **Attentive player:** one who reads telegraphs and uses basic combos. They clear Level 1 reliably, feel real pressure in Level 2, and reach Level 3 with a lean, upgraded deck.
- **Good run:** strong order synergies, Relic Charms and well-managed carryover Discard Pips. This beats the Abyssal Overlord in a tense finale, ending on low health with a narrow, hard-earned win.
- **Failure:** clean and quick, with run highlights and an immediate retry.

### How it should feel

- Snappy, responsive movement and aiming, paired with calm, readable turn planning.
- Telegraphs always feel clear and fair.
- Card flow is brisk, with no energy math.
- Impacts and casts feel tactile and punchy.

### What gets harder

Across the three floors, enemies get faster patterns, tighter and more overlapping Telegraph Markers, tougher armor, and more floor hazards. The player keeps pace with sharper combos, Relic Charms, and Campfire upgrades and removals.

- **Sunken Crypt:** forgiving opening rooms teach telegraphs, aiming and simple two-card and three-card combos. The Dread Knight tests whether the player respects telegraphs and sequences Iron Guard Card or Dash Strike Card cleanly, especially once it starts its double-telegraph swings.
- **Frostbound Vaults:** overlapping markers and tough Gargoyle Sentinels push the player toward Steam Burst knockbacks, Relic Charms and deck refinement before the Frost Lich's crossing ice lanes.
- **Abyssal Sanctum:** Cursed Rune Tile hazards weigh heaviest here. The Abyssal Overlord chains multi-stage telegraphs of dark-fire arcs and rune eruptions that punish greedy, unguarded sequences.

## The look

- **Style:** crisp 16-bit pixel art with a high fantasy and dark fantasy mood.
- **Palette:**
  - dark indigo and bright gold for the hero
  - obsidian and crimson for danger and telegraphs
  - icy cyan for frost
  - blazing orange for fire
  - emerald and violet accents
  - mossy slate and dark stone for the dungeon
- **Key words:** torchlit, runic, punchy, readable, "Bossbreaker".

---

## A prototype

This build is a prototype: the design's whole game, playable from the title to the win and lose screens, made quickly to find out whether it is fun. No art, sounds or music were made for it. `assets.json` loads nothing and the contact sheet is blank: everything the game shows and plays is made in code, with the engine, by this build. Wherever the briefs speak of the art, the art is what you draw.

![Concept art](https://cdn.phaser.games/projects/BJQAFd8RdA9/concept/4d9da40a85bf126b.jpg) (reference picture: look at it, it is not a game asset)

The concept art: one picture of how the game could look in play. Open it before you plan. Use it for the look, the layout and how much is on screen; the design decides what is in the game.

- **The look.** Draw the game the way The look describes and the concept art shows: its palette, its shapes, its mood. Keep one style throughout. Give every entity a clear silhouette and a color of its own, so a player tells everything apart at a glance, at phone size.
- **Pictures.** Paint each entity, tile, background, button and panel once, as the game starts, with `game.paint(name, width, height, ctx => …)` and the Canvas 2D API (an animation is `{ frames }`, drawn with `(ctx, i)`); a sprite shows it with `texture: name`, at its size. Name each picture for what it is (`player`, `enemy-bat`, `tile-grass`, `button-play`), as a full build's Assets section names its files: when real art is made later, it replaces your pictures by those names. `game.background` gives a scene its color, gradient or stars; `game.graphics()` draws what changes while the game runs (trails, glows, meters).
- **Words.** The title and every word on screen are `game.text`, with a stroke or shadow where they sit over the scene. The title screen is the game's name over a scene drawn like the rest of the game.
- **Effects.** `game.particles` (its shapes are `particle:spark`, `particle:soft` and more, or your own pictures), `game.tween` and `game.feel` add the juice the guides ask for.
- **Sound.** Define every sound effect by name as a synthesized sound with `game.sound.defineAll`, and play it by name. Where the design has music, it is a short chiptune in the audio pack's notation, played with `game.sound.loop`.
- **What stays whole.** Everything in the design above: every rule, entity, level, screen and control. A prototype is plain in its art, never in its game.

---

## Debug controls

These let builders and the designer reach any floor, boss, room or end screen at once, hand out cards, items and relics, and turn off the dangers, so any part of a run can be checked without playing to it.

| Control | Takes | Does |
| --- | --- | --- |
| level | n: 1 to 3 | Starts the map of floor n as a player would arrive: the earlier floors cleared, with the health, deck, Relic Charms and run stats a player would have by then. |
| boss | n: 1 to 3 | Opens the boss arena of floor n (Dread Knight, Frost Lich or Abyssal Overlord) with the earlier floors cleared and a deck and health a player would have there. |
| room | type: monster, cursed, treasure, campfire or boss | Opens a room of that type on the current floor, as the map would open it. Monster, cursed and boss rooms open as an Arena Encounter with the door shut and the telegraph phase begun. |
| enemy | name: Crypt Slime, Bone Archer or Gargoyle Sentinel | Opens an Arena Encounter on the current floor with that enemy, so its telegraph and behavior can be checked. |
| screen | name: victory or game-over | Opens that end screen with the run summary a player would have at that point. |
| give-card | card: Slash, Dash Strike, Frost Bolt, Fireball, Iron Guard or Arcane Echo | Adds that card to the deck, and into the current hand if a battle is on. |
| give | item: heart-gem, relic-charm or card-scroll | Gives the item as a pickup would, so it takes effect and counts toward the end screen stats. |
| heal | nothing | Restores health to full. |
| discard-pips | nothing | Refills the Discard Pips to three. |
| infinite-health | on or off | Switch: hits take no health, and the barrier is unaffected. |
| invincible | on or off | Switch: Telegraph Markers, hazards and Cursed Rune Tiles cannot hurt the hero. |
| infinite-pips | on or off | Switch: Discard Pips are never spent. |
| one-hit-kills | on or off | Switch: every card defeats any enemy or boss in one hit. |
| win-room | nothing | Wins the current room by the game's own path: the door sparks open, any reward appears, and the player returns to the map. On a boss arena it wins the boss and moves on to the next floor, or to Victory after the Abyssal Overlord. |
| lose-run | nothing | Ends the run by the game's own path: all health is lost and the Game Over screen opens with its run summary. |

In the engine each is added once at boot with `game.cheats.add({ name, does, args, run })` (the kernel manual says how); `bake play` lists them with `cheat` and runs one with `cheat <name> [args]`; a person opens them in a panel with the backquote key (`), or with `?cheats` in the address.

---

## Recommended packs

| Pack | For | Notes |
| --- | --- | --- |
| `encounter-director` | The enemy turn's Telegraph Markers: timed, warned hazards (slime hops, archer lines, boss sweeps and rune eruptions) that stay fair and always leave time to step out. | It is built for lanes, so check that it fits free-roaming arena zones. Enemy and boss patterns and the turn flow stay in the game's own code. |
| `arena-layout` | The compact top-down arenas: Stone Walls and Pillars, obstacles that block movement, and start and exit spots. | Make sure the rooms stay small and portrait-shaped. Braziers, Cursed Rune Tiles and the boss arenas are placed by hand. |
| `controls-2d` | Move and aim axes and the fire intent across WASD, mouse, gamepad and touch. | Cards, the hand cursor and the drag-to-aim release-to-fire mapping are the game's own code. |
| `controls-touch` | The left virtual stick, shown only on touch screens. | Aim is a right-side drag, which the game handles itself. |
| `card-motion` | Cards sliding into the hand and glowing, and moving into the Execution Slot Frames. | It is motion maths only. The deck, the draw pile, the discard pile and the combo rules are the game's own code. |

No pack plays this kind of game. The deckbuilding core is the game's own code. That covers the three-card queue, the order combos, the Discard Pips, the branching map, and the rewards. The `cards` pack is for playing-card suits and ranks, so it was left out.

From a search of the pack library for this design, made before the build: recommendations for the lead, who checks each (`packs.mjs get <id>`), chooses, and adds what fits. A pack that doesn't fit the game is left out. `core-2d` and the packs it brings (maths, color, typography, audio, ui, tween, save, backdrops, backdrop-sky, backdrop-stars, feel, render-auto, world-screen, world-side, rig-follow, render-texture, particle-textures, particles-2d, collision, pointer) are in the game already.