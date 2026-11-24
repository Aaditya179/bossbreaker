# Bossbreaker prototype

## Play and test

- Run `npm run -s serve` and open http://localhost:4173. Run `npm test` for combat checks and `npm run -s test:mobile` while the server is running for portrait touch checks.
- The title button enters the map. Tap a gold-framed connected node to enter a room. The crown opens the floor boss.
- In combat, read the enemy action and damage above the queue. Chill reduces each affected enemy hit by 4. Rune eruptions and slime puddles are extra telegraphed hits.
- Tap a hand card to queue it and see its effect. Tap a filled slot, then another slot to move it. Tap the same slot twice to remove it. Dragging cards or slots is also supported. There are three slots and no energy costs.
- Tap **Discard & Draw**, tap any unqueued cards to select them, then tap **Draw** to replace them together for one action. Tap the button with no selection to cancel. There are three actions per battle. The discard pile is shuffled when the draw pile empties. With a very small deck, newly discarded cards can be drawn after the rest of the deck has been exhausted.
- Tap **Execute Combo** once. Cards resolve in order, followed by surviving enemies. Guard absorbs damage across enemy hits and expires after the response. Frost Bolt followed by Fireball triggers Steam Burst. Dash Strike followed by Slash cleaves all enemies. Arcane Echo repeats the next eligible card. Guard first adds 6 barrier.
- Mouse and touch use the same controls. Keyboard Enter executes and Q opens discard selection. Gamepad D-pad or left stick moves focus, A selects, X controls discards, Y executes and Start pauses.
- Treasure awards a relic, sometimes with healing. Campfires upgrade a card type or remove one copy. Battle rewards and the map lead toward three bosses. Victory and Game Over show run statistics.
- Pause and sound are at the top right. Mute is remembered.

## Inspect and debug

Use `npm run -s play -- "wait 0.4; cheat"` for the held browser. Screen names are `title`, `map`, `play`, `treasure`, `campfire`, `pause`, and `end`. Inspect IDs include `hero`, `foe-`, `hand-1` through `hand-5`, `slot-1` through `slot-3`, and `discard-pip-`.

- `level 1|2|3`, `boss 1|2|3`, `room monster|cursed|treasure|campfire|boss`, and `enemy Crypt Slime|Bone Archer|Gargoyle Sentinel` open encounters.
- `screen victory|game-over`, `win-room`, and `lose-run` check outcomes.
- `give-card <name>`, `give heart-gem|relic-charm|card-scroll`, `heal`, and `discard-pips` modify a run.
- `infinite-health on|off`, `invincible on|off`, `infinite-pips on|off`, and `one-hit-kills on|off` set debug switches.

## Code and design

`run.ts` owns deck composition, map, rewards and run stats. `arena.ts` owns card piles, ordered execution, enemy intents and resolution. `scenes/Play.ts` handles interaction and the room outcome. `ui/arenaView.ts` presents combat. `art.ts` paints the existing pixel art and defines synthesized effects. Other scenes manage the title, map, rooms, pause and results.

Five-card hands, limited group redraws and readable intents create the decisions. Sequence bonuses reward discovery, while impact effects, audio and paced automatic playback make the consequences visible. The map and relics carry those decisions between encounters.

## Prototype limits

Maps use a five-row structure with shuffled branches and authored encounters. Balance is a first pass. The existing roster uses Guard and interruption for defense and has no separate Dodge, Riposte or Shield Bash cards. The 320px layout fits and responds to touch, though card text is small. Physical gamepad testing remains outstanding.
