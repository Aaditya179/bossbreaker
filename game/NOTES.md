# Bossbreaker elemental prototype

## Play and rules

Run `npm run -s serve` and open http://localhost:4173. Choose one starting element, then choose connected nodes on the map; shops are accessible only at merchant nodes. Equipment may be changed between encounters. Drag the six-card hand to reorder it. Tap cards to select them within the cast limit, or tap a card's × to mark it for discard. Discard & Draw replaces all marked cards for one of three encounter-wide discard actions. Play Combo executes the selected cards once in hand order. Tap a combo card then an enemy to assign a target; if it dies, the first living enemy is the fallback. Pass requires confirmation.

The cast limit starts at 5 and increases after boss defeats to a maximum of 7; every card costs one cast. A run starts with twelve copies of one chosen element. Unlock rewards add four copies of another family, up to three families. Mastery levels 1–5 are shared across every copy. Each level adds 3 direct damage. Fire deals 12 and applies Burn; Frost deals 9 and applies Chill; Storm deals 10; Wind deals 6 and prepares one evade; Earth deals 6 and grants 8 barrier, plus 2 barrier per upgrade. Only one Wind/Sandstorm evade can be held at once. Block and evasion expire after the enemy response. The deck uses physical card IDs and reshuffles its discard pile as needed.

## Reactions

Adjacent different elements form the same pair in either order. The second card triggers the reaction in addition to its basic effect:

- Fire + Frost: Steam Burst, 7 area damage and Weaken.
- Fire + Storm: Overload, 6 area damage; 15% chance of 5 more.
- Fire + Wind: Firestorm, 6 area damage and Burn.
- Fire + Earth: Magma Armor, 12 barrier and an 8-damage counter that applies Burn.
- Frost + Storm: Shatter, 8 damage and Armor Break.
- Frost + Wind: Blizzard, 5 area damage and Chill.
- Frost + Earth: Glacial Fortress, 20 barrier and resistance to the next debuff.
- Storm + Wind: Tempest, two 4-damage strikes that chain to a second enemy when possible.
- Storm + Earth: Magnetic Field, 10 barrier and a 10-damage counter.
- Wind + Earth: Sandstorm, one evade and 5 area damage.
- Matching Fire, Frost, or Storm pairs add Burn, Chill, or 6 area damage respectively.

Triples are order-sensitive and require all participating elemental families to have mastery level 3 or higher. Their base card effects still apply, but the two pairs wholly inside a valid triple are suppressed. Non-overlapping neighboring pairs remain eligible. Fire → Wind → Storm is Cataclysm (20 area damage and Burn); Earth → Frost → Wind is Crystal Bastion (35 barrier and 15 counter); Fire → Earth → Fire is Meteorfall (24 area damage and Burn); Frost → Storm → Wind is Absolute Tempest (two 10-damage strikes, Chill and Weaken). The planning preview reports planned reactions and the mastery needed for locked triples. The Combos collection records actual triggers locally across runs; `cheat reset-combos` clears it.

Poison deals 2 per stack and Burn 3 per stack after the enemy response; both cap at 5 for two ticks. Chill reduces attack damage by 4 per stack, Weaken by 3, and Armor Break increases incoming hit damage by 3; each caps at 2 for two turns. Silence blocks Fire and Storm for the next turn, and Paralysis reduces capacity by 1. Reapplication refreshes duration. A counter triggers once on a blocked or evaded hit. Direct attacks have a 10% critical chance at 1.5×; reaction and status damage cannot crit.

## Rewards, relics and equipment

Normal encounter rewards offer one of a new element, an eligible upgrade, or recovery/utility. Paid rerolls cost 15, 30, 45 gold and so on for the current screen. Boss rewards cannot be rerolled and offer exactly three high-tier relics, including the defeated boss's signature relic. Knight’s Bastion adds 8 barrier and Armor Break on the first Earth reaction per turn; Crown of Winter adds Chill and Weaken on the first Frost reaction; Abyssal Reactor adds 5 area damage and Burn on the first Fire reaction. Prismatic Core adds 4 damage to the first reaction; the cursed Plaguebound Idol adds 6 and starts each battle Poisoned. Gale Mantle and Earthen Heart grant 6 barrier on their first corresponding reaction. Each bonus has a per-turn limit.

Encounters grant 12 gold (18 cursed, 25 boss). The merchant sells elemental copies and equipment. Items are unique, purchases atomic, and unequipped equipment sells for half price only at a shop. The Sentinel set grants +4 Earth barrier at two pieces and a 6-damage counter on the first Earth reaction at three; Ember grants +3 Fire damage at two and +4 damage on the first Fire reaction at three. Gale Staff adds 4 Wind/Storm damage; Ash Wand adds 3 Fire/Frost/Earth damage. Existing legacy card definitions remain for compatibility, but are excluded from the active starter and rewards.

## Testing and limits

`npm test` runs elemental, deck-conservation, reaction, relic and equipment tests plus seeded isolated-encounter simulations. With the development server running, use `npm run -s test:interactions`, `test:mobile`, `test:shop`, `test:rewards`, and `test:map`. Use `npm run -s build` and `npm run -s smoke -- --seconds 30` for release checks. Debug controls include `cheat room shop`, `cheat card-level <slot> <level>`, `cheat gold <amount>`, `cheat boss <floor>`, and `cheat win-room`.

PVFX Foundry, Torpil Studio and LuizMelo packs have not been imported: their itch.io free-download flow requires an interactive browser, which was unavailable during this pass. Ground Slam and sprite-sheet character/enemy animation remain unfinished. The simulation uses a simple no-redraw policy and is not a complete-run win-rate estimate. The side-view stage remains the supported camera; optional corridor travel and three-quarter camera experiments are not implemented. Real phones, haptics and Reddit Devvit storage have not been verified. Runs are not currently durably saved; combo discoveries use local storage. Art, reveals, and some reaction effects use lightweight reusable pixel effects rather than bespoke animations. The old pre-element combat and interaction tests are retained as legacy references, not current acceptance tests.
