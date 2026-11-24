# Bossbreaker prototype

## Play and test

Run `npm run -s serve` and open http://localhost:4173. The title leads to a branching map and three floor bosses. In a fight, tap hand cards to select or deselect them; the numbered marks show selection order. Play Combo executes the selection in that order, provided its total size fits the available combo capacity. Discard & Draw replaces all selected unqueued cards for one of three battle-wide discards. Cards remain selected if they cannot fit. Tap two selected combo cards to reorder them, or the same card twice to remove it; drag to reorder. Tap a selected combo card then an enemy to change its target. Tap an enemy or its target button before queueing to assign a target. A dead target falls back to the first living enemy. Area attacks affect all living enemies.

Play Combo resolves a nonempty selection automatically; Pass Turn requires a second tap to confirm. Inputs are locked while actions and enemy responses resolve. Six cards are drawn at each planning turn; unplayed and executed cards enter the discard pile and are reshuffled into the draw pile as needed. Newly discarded cards can be drawn only when the remaining draw pile and earlier discards cannot satisfy a draw. Each physical copy has a stable ID. No manual movement, aiming or energy is required.

Combo capacity starts at 5 and increases by 1 after each floor boss, to 8. Cards consume 1–3 units, with level-three evolution adding one. The six-card hand does not grow with capacity. Read enemy intents and statuses before executing. Guard lasts through the enemy response, Dodge evades one hit, and Riposte counters one blocked or evaded hit. Dash followed by Slash hits all enemies; Echo repeats the next eligible card. Use the Deck and Status buttons for details. Mouse and touch are supported; keyboard and gamepad controls are optional.

The Deck viewer lists owned copies, levels, sizes, families, piles and relics. Between encounters, it can sell a specific copy for gold; rare or level-three sales require confirmation. At least eight cards, an attack and a Guard must remain. The five-family limit counts Sword, Defense, Counter, Arcane, Elemental (Fire and Frost), and Storm; selling the last copy frees a family slot. Gold records resale value; there is currently no shop. Level-three upgrades add size and an effect, and previews disclose both. Normal fights offer a card, an eligible copy upgrade or recovery. Bosses guarantee capacity and offer a relic, a weaker signature power or an optional cursed relic. Campfires and treasure provide additional choices or rewards.

## Combat rules

Consecutive elemental cards react regardless of order, in addition to their ordinary effects: Fire + Frost deals 10 area damage and Weakens; Fire + Storm deals 8 area damage; Frost + Storm deals 10 extra damage and Armor Break; Fire + Fire adds Burn; Frost + Frost adds Chill; Storm + Storm deals 8 area damage. Non-elemental cards break the chain. Future three-element reactions could reward all three distinct elements with a controlled area effect, but are not implemented.

Statuses tick after the enemy response. Poison deals 2 per stack and Burn 3 per stack; each caps at 5 stacks for two ticks. Chill subtracts 4 damage per stack, Weaken subtracts 3, and Armor Break adds 3 incoming damage; each caps at 2 stacks for two turns. Paralysis reduces next-turn capacity by 1 and Silence prevents elemental cards from being queued; each lasts one turn and caps at one stack. Reapplying a status refreshes its duration. Statuses applied by enemies persist into the next planning turn. The Status viewer describes these rules in game.

The Dread Knight applies Armor Break, the Lich can Silence, and the Abyssal Overlord inflicts Burn and Paralysis on telegraphed attacks. Their optional inherited powers respectively apply Armor Break on the first sword hit, add a Chill stack to Frost, or add a Burn stack to the first Fireball each turn. Glassheart adds 6 direct damage per hit while reducing maximum health by 20. All boss choices disclose their effects.

## Validation and development

`npm test` runs deterministic combat and deck tests plus seeded encounter simulations. With the local server running, `npm run -s test:interactions` exercises actual desktop browser interactions and `npm run -s test:mobile` exercises touch layouts at 320, 375 and 430 pixels. `npm run -s build` builds the game; `npm run -s smoke -- --seconds 45` checks runtime startup. The simulation compares representative sword, elemental, defense, heavy, evolved and relic builds against isolated normal and boss encounters; it is a tuning aid, not a complete-run win-rate estimate.

`run.ts` owns persistent copies, capacity, rewards and run progression. `arena.ts` manages combat, piles, targets and the state machine. `status.ts` and `elements.ts` hold shared status and reaction rules. The Phaser scenes and `ui/arenaView.ts` render and animate those decisions. `art.ts` contains the existing pixel art and synthesized effects.

## Known limits

The portrait interface fits tested viewport sizes, but secondary card text is dense at 320px. Fast-forward and reduced-motion modes are not implemented. Physical gamepad devices, real phones and Reddit Devvit integration have not been verified. Balancing remains a prototype; isolated simulations cannot establish complete-run fairness or cover every build. Future three-element reactions and a gold-spending shop are not implemented.
