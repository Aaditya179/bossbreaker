import { game } from './engine.js';

export const MAX_HP = 100;
export const HAND_SIZE = 6;
export const START_CAPACITY = 5;
export const ELEMENT_POWER_STEP = 3;
export const EARTH_BLOCK_BASE = 8;
export const EARTH_BLOCK_STEP = 2;
export const cardLevel = (id: number | undefined): number => id === undefined ? 1 : (run.levels[id] ?? 1);
export const ELEMENTS = ['fire','frost','storm','wind','earth'] as const;
export type Element = typeof ELEMENTS[number];
export const isElement = (card: Card | null): card is Element => card !== null && (ELEMENTS as readonly string[]).includes(card);
export const cardSize = (card: Card, _id?: number): number => isElement(card) ? 1 : card === 'cleave' || card === 'sovereign' ? 3 : card === 'bulwark' || card === 'immolate' || card === 'riposte' ? 2 : 1;
export const cardFamily = (card: Card): string => isElement(card) ? card.toUpperCase() : card === 'slash' || card === 'dash' || card === 'cleave' || card === 'sovereign' || card === 'immolate' ? 'Sword' : card === 'guard' || card === 'dodge' || card === 'bulwark' ? 'Defense' : card === 'riposte' ? 'Counter' : 'Arcane';
export type Rarity = 'Common'|'Uncommon'|'Rare'|'Epic'|'Mythical'|'Legendary'|'Cursed';
export const CARD_RARITIES: Record<Card,Rarity> = {
    wind:'Common', earth:'Common', slash:'Common', dash:'Common', guard:'Common', frost:'Uncommon', fire:'Uncommon', dodge:'Uncommon',
    storm:'Rare', riposte:'Rare', cleave:'Epic', echo:'Epic', bulwark:'Mythical', sovereign:'Legendary', immolate:'Cursed',
};
export const cardRarity = (card: Card): Rarity => CARD_RARITIES[card];
export const RARITY_WEIGHTS: Record<Rarity,number> = {Common:16,Uncommon:8,Rare:4,Epic:2,Mythical:1,Legendary:1,Cursed:1};
export const rewardWeight = (card: Card): number => RARITY_WEIGHTS[cardRarity(card)];
export const evolutionEffect = (card: Card): string => ({
    wind:'Each level adds 3 damage; level 3 unlocks triples.', earth:'Each level adds 3 damage and 2 barrier; level 3 unlocks triples.',
    sovereign:'Sovereign strike gains damage.', bulwark:'Bulwark gains barrier.', immolate:'Blood blade gains damage.',
    slash:'Slash gains damage.', cleave:'Cleave also Weakens surviving targets.',
    dash:'Dash Strike gains damage.', frost:'Each level adds 3 damage; level 3 unlocks triples.',
    fire:'Each level adds 3 damage; level 3 unlocks triples.', storm:'Each level adds 3 damage; level 3 unlocks triples.',
    dodge:'Dodge gains more barrier.', riposte:'Riposte counters for more damage.',
    guard:'Iron Guard gains extra barrier.', echo:'The repeated card gains more power.',
})[card];

export const PIPS = 3;
const HEAL = 24;
const BOSS_HEAL = 18;
const MIN_DECK = 8;

export const CARDS = {
    wind: { name:'Wind', color:'#a5e8c1', kind:'SPELL', action:'6 + evade', tip:'6 damage and evade the next hit.', power:6 },
    earth: { name:'Earth', color:'#d8b77e', kind:'SPELL', action:'6 + block 8', tip:'6 damage and 8 barrier until the enemy response.', power:6 },
    sovereign: { name:'Sovereign Strike', color:'#ffd36f', kind:'SWORD', action:'38 break', tip:'38 damage and Armor Break.', power:38 },
    immolate: { name:'Blood Blade', color:'#f36a80', kind:'SWORD', action:'34 / lose 5 HP', tip:'34 damage. Lose 5 HP, but cannot defeat yourself.', power:34 },
    bulwark: { name:'Aegis Veil', color:'#e9a1f6', kind:'DEFENSE', action:'35 block + evade', tip:'Gain 35 barrier and evade the next hit.', power:35 },
    slash: { name: 'Slash', color: '#ff756d', kind: 'SWORD', action: '22 cleave', tip: '22 damage. After Dash Strike, 30 damage to all foes.', power: 22 },
    cleave: { name:'Cleave', color:'#ff9c87', kind:'SWORD', action:'26 all foes', tip:'Deal 26 damage to all enemies, or 34 to a lone enemy.', power:26 },
    dash: { name: 'Dash Strike', color: '#a6cfdf', kind: 'STYLE', action: '17 lunge', tip: '17 damage. Follow with Slash to cleave all foes.', power: 17 },
    frost: { name: 'Frost Bolt', color: '#7ce1fa', kind: 'SPELL', action: '9 chill', tip: '9 damage and Chill. Combines with all elements.', power: 9 },
    fire: { name: 'Fireball', color: '#ffab66', kind: 'SPELL', action: '12 blast', tip: '12 damage and Burn. Combines with all elements.', power: 12 },
    storm: { name: 'Storm Bolt', color: '#ffe48c', kind: 'SPELL', action: '10 shock', tip: '10 damage. Combines with all elements.', power: 10 },
    dodge: { name:'Dodge', color:'#a8e5c5', kind:'DEFENSE', action:'Evade 1 hit', tip:'Evade the next hit. Higher levels also grant barrier.', power:0 },
    riposte: { name:'Riposte', color:'#e1c5a8', kind:'DEFENSE', action:'Counter 14', tip:'Counter for 14 after blocking or dodging a hit this turn.', power:14 },
    guard: { name: 'Iron Guard', color: '#c1d6be', kind: 'DEFENSE', action: '22 barrier', tip: '22 barrier until enemy response ends. First slot adds 6.', power: 22 },
    echo: { name: 'Arcane Echo', color: '#d4a5fa', kind: 'SPELL', action: 'Repeat next', tip: 'The next attack, spell or defense fires twice.', power: 0 },
} as const;
export type Card = keyof typeof CARDS;
export function cardDescription(card:Card,id?:number):string {
    const level=cardLevel(id), power=CARDS[card].power+(level-1)*ELEMENT_POWER_STEP;
    if(card==='fire') return power+' damage; apply Burn (3 per stack).';
    if(card==='frost') return power+' damage; apply Chill (attacks −4).';
    if(card==='storm') return power+' damage. Combines with the other elements.';
    if(card==='wind') return power+' damage; evade the next hit (maximum one).';
    if(card==='earth') return power+' damage and '+(EARTH_BLOCK_BASE+(level-1)*EARTH_BLOCK_STEP)+' barrier.';
    return CARDS[card].tip;
}

export type Room = 'monster' | 'cursed' | 'treasure' | 'campfire' | 'boss' | 'shop';
export type Item = 'heart-gem' | 'relic-charm' | 'card-scroll';
export const FLOORS = ['Sunken Crypt', 'Frostbound Vaults', 'Abyssal Sanctum'];
export const BOSSES = ['Dread Knight', 'Frost Lich', 'Abyssal Overlord'];
export const ROOMS: Record<Room, string> = {
    monster: 'Battle', cursed: 'Cursed room', treasure: 'Treasure Vault', campfire: 'Campfire', boss: 'Boss', shop:'Merchant',
};
export const RELICS = [
    { name: 'Cinder Seal', tip: 'Fireballs deal 5 more damage.' },
    { name: 'Glacier Eye', tip: 'Frost Bolts deal 5 more damage.' },
    { name: 'Vapor Knot', tip: 'Steam Bursts deal 8 more damage.' },
    { name: 'Phantom Edge', tip: 'Legacy sword relic.' },
    { name:'Knight’s Bastion', tip:'First Earth reaction each turn: +8 barrier and Armor Break.' },
    { name:'Crown of Winter', tip:'First Frost reaction each turn adds Chill and Weaken to its target.' },
    { name:'Abyssal Reactor', tip:'First Fire reaction each turn deals 5 area damage and adds Burn.' },
    { name:'Prismatic Core', tip:'First reaction each turn deals 4 bonus damage to its target.' },
    { name:'Plaguebound Idol', tip:'First reaction deals 6 bonus damage each turn. Begin each battle Poisoned.' },
    { name:'Gale Mantle', tip:'First Wind reaction each turn grants 6 barrier.' },
    { name:'Earthen Heart', tip:'First Earth reaction each turn grants 6 barrier.' },
];

export type Node = { room: Room; row: number; lane: number };
const STARTER: Card[] = ['fire','fire','fire','frost','frost','frost','storm','storm','storm','wind','wind','wind','earth','earth','earth'];
const CARD_KEYS: Card[] = [...ELEMENTS];
let nextCardId = 1;
const newCardId = (): number => nextCardId++;

function makeMap(): Node[] {
    const swap = game.rng.chance(0.5);
    const restSwap = game.rng.chance(0.5);
    return [
        { room: 'monster', row: 0, lane: 0 },
        { room: 'monster', row: 1, lane: -1 },
        { room: 'cursed', row: 1, lane: 1 },
        { room: 'treasure', row: 2, lane: swap ? 1 : -1 },
        { room: 'shop', row: 2, lane: swap ? -1 : 1 },
        { room: 'monster', row: 3, lane: restSwap ? 1 : -1 },
        { room: 'campfire', row: 3, lane: restSwap ? -1 : 1 },
        { room: 'boss', row: 4, lane: 0 },
    ];
}

export const run = {
    floor: 1, hp: MAX_HP, capacity: START_CAPACITY, maxHp: MAX_HP, powers: [] as string[], curses: [] as string[], deck: [...STARTER], deckIds: STARTER.map(newCardId), gold: 0,
    gearOwned: [] as string[], equipped: {weapon:null,head:null,chest:null,legs:null} as Record<'weapon'|'head'|'chest'|'legs',string|null>, shopStock: [] as string[], shopKey:'',
    levels: {} as Record<number, number>,
    relics: [] as number[], map: [] as Node[], path: [] as Node[],
    room: 'monster' as Room, node: null as Node | null,
    stats: { rooms: 0, bosses: 0, relics: 0, cards: 0, combos: 0, triples: 0 },
    tutorial: false, result: '' as 'victory' | 'game-over' | '',
    cheats: { infiniteHealth: false, invincible: false, infinitePips: false, oneHit: false },
};

export function reset(floor = 1, tutorial = false): void {
    Object.assign(run, {
        floor, hp: MAX_HP, capacity: START_CAPACITY + floor - 1, maxHp: MAX_HP, powers: [], curses: [], deck: [...STARTER], deckIds: STARTER.map(newCardId), gold: 0, gearOwned: [], equipped: {weapon:null,head:null,chest:null,legs:null}, shopStock: [], shopKey:'', levels: {}, relics: [], map: makeMap(),
        path: [], node: null, room: 'monster', result: '', tutorial,
        stats: { rooms: (floor - 1) * 5, bosses: floor - 1, relics: 0, cards: 0, combos: (floor - 1) * 5, triples: 0 },
        cheats: { infiniteHealth: false, invincible: false, infinitePips: false, oneHit: false },
    });
    for (let i = 1; i < floor; i++) {
        grant('relic-charm');
        grant('card-scroll');
        upgrade(i === 1 ? 'fire' : 'earth');
    }
}

export function startRun(): void {
    const attempts = game.save.read('attempts', 0) + 1;
    game.save.write('attempts', attempts);
    game.rng.restore(game.rng.fork('run-'+attempts).snapshot());
    reset(1, !game.save.read('tutorialSeen', false));
    game.scenes.go('map');
}

export function grant(item: Item, rare = false): string {
    if (item === 'heart-gem') {
        const healed = Math.min(HEAL, run.maxHp - run.hp);
        run.hp += healed;
        return 'Heart Gem  ·  +' + healed + ' health';
    }
    if (item === 'card-scroll') {
        const card = game.rng.pick(CARD_KEYS);
        const id = addCard(card);
        if (id < 0) return 'No family slot available.';
        run.stats.cards++;
        if (rare) upgrade(card,id);
        return (rare ? 'Rare scroll  ·  ' : 'Card Scroll  ·  ') + CARDS[card].name;
    }
    const available = [0,1,2].filter(i => !run.relics.includes(i));
    const index = game.rng.pick(available.length ? available : [0,1,2]);
    run.relics.push(index);
    run.stats.relics++;
    return RELICS[index].name + '  ·  ' + RELICS[index].tip;
}

export function addCard(card: Card): number {
    const families = new Set(run.deck.map(cardFamily));
    if (families.size >= 5 && !families.has(cardFamily(card))) return -1;
    const id = newCardId();
    run.deck.push(card);
    run.deckIds.push(id);
    return id;
}

export function relicCount(id: number): number {
    return run.relics.filter(relic => relic === id).length;
}

export function upgrade(card: Card, id = run.deckIds[run.deck.indexOf(card)]): void {
    if (id === undefined || run.deck[run.deckIds.indexOf(id)] !== card) return;
    const level = cardLevel(id);
    if (level >= 5) return;
    run.levels[id] = level + 1;
}

export function saleValue(id: number): number {
    const card = run.deck[run.deckIds.indexOf(id)];
    if (!card) return 0;
    return ({Common:10,Uncommon:15,Rare:20,Epic:25,Mythical:30,Legendary:35,Cursed:30})[cardRarity(card)] + (cardLevel(id)-1)*5;
}

export function sellCard(id: number): string {
    if (game.scenes.stack?.includes('play') || game.scenes.stack?.includes('reward')) return 'Sell from the map or a rest room.';
    const index = run.deckIds.indexOf(id);
    if (index < 0 || run.deck.length <= MIN_DECK) return 'Keep at least eight cards.';
    const card = run.deck[index];
    const remaining = run.deck.filter((_,i) => i !== index);
    if (!remaining.some(c => c === 'earth' || c === 'wind') || !remaining.some(c => isElement(c))) return 'Keep elemental offense and Earth or Wind.';
    const price = saleValue(id);
    run.deck.splice(index,1);
    run.deckIds.splice(index,1);
    delete run.levels[id];
    run.gold += price;
    return 'Sold '+CARDS[card].name+' for '+price+' gold.';
}

export function remove(card: Card, id = run.deckIds[run.deck.indexOf(card)]): boolean {
    const index = run.deckIds.indexOf(id);
    if (run.deck[index] !== card) return false;
    if (index < 0 || run.deck.length <= MIN_DECK) return false;
    const remaining = run.deck.filter((_,i) => i !== index);
    if (!remaining.some(c => c === 'earth' || c === 'wind') || !remaining.some(c => isElement(c))) return false;
    run.deck.splice(index, 1);
    run.deckIds.splice(index, 1);
    delete run.levels[id];
    return true;
}

export function connected(from: Node | undefined, to: Node): boolean {
    if (!from) return to.row === 0;
    return to.row === from.row + 1 && (from.row !== 1 || from.lane === to.lane);
}

export function completeRoom(): void {
    run.stats.rooms++;
    if (run.node) run.path.push(run.node);
    run.node = null;
    if (run.room === 'boss') {
        run.stats.bosses++;
        if (run.floor === FLOORS.length) {
            endRun('victory');
            return;
        }
        run.hp = Math.min(run.maxHp, run.hp + BOSS_HEAL);
        run.floor++;
        run.map = makeMap();
        run.path = [];
    }
    game.scenes.go('map');
}

export function endRun(result: typeof run.result): void {
    run.result = result;
    if (result === 'game-over') run.hp = 0;
    game.scenes.go('end');
}
