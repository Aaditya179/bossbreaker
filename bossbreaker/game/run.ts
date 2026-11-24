import { game } from './engine.js';

export const MAX_HP = 100;
export const HAND_SIZE = 6;
export const START_CAPACITY = 5;
export const cardLevel = (id: number | undefined): number => id === undefined ? 1 : (run.levels[id] ?? 1);
export const cardSize = (card: Card, id?: number): number => (card === 'cleave' ? 3 : card === 'frost' || card === 'fire' || card === 'storm' || card === 'riposte' ? 2 : 1) + (cardLevel(id ?? run.deckIds[run.deck.indexOf(card)]) >= 3 ? 1 : 0);
export const cardFamily = (card: Card): string => card === 'slash' || card === 'dash' || card === 'cleave' ? 'Sword' : card === 'guard' || card === 'dodge' ? 'Defense' : card === 'riposte' ? 'Counter' : card === 'echo' ? 'Arcane' : card === 'storm' ? 'Storm' : 'Elemental';
export const cardRarity = (card: Card): string => card === 'cleave' ? 'Rare' : card === 'storm' ? 'Uncommon' : 'Common';
export const evolutionEffect = (card: Card): string => ({
    slash:'Slash gains damage.', cleave:'Cleave also Weakens surviving targets.',
    dash:'Dash Strike gains damage.', frost:'Frost Bolt adds another Chill.',
    fire:'Fireball adds another Burn.', storm:'Storm Bolt chains to other foes.',
    dodge:'Dodge gains more barrier.', riposte:'Riposte counters for more damage.',
    guard:'Iron Guard gains extra barrier.', echo:'The repeated card gains more power.',
})[card];

export const PIPS = 3;
const HEAL = 24;
const BOSS_HEAL = 18;
const MIN_DECK = 8;

export const CARDS = {
    slash: { name: 'Slash', color: '#ff756d', kind: 'SWORD', action: '22 cleave', tip: '22 damage. After Dash Strike, 30 damage to all foes.', power: 22 },
    cleave: { name:'Cleave', color:'#ff9c87', kind:'SWORD', action:'26 all foes', tip:'Deal 26 damage to all enemies, or 34 to a lone enemy.', power:26 },
    dash: { name: 'Dash Strike', color: '#a6cfdf', kind: 'STYLE', action: '17 lunge', tip: '17 damage. Follow with Slash to cleave all foes.', power: 17 },
    frost: { name: 'Frost Bolt', color: '#7ce1fa', kind: 'SPELL', action: '15 chill', tip: '15 damage and Chill (attacks −4). Combines with Fire or Storm.', power: 15 },
    fire: { name: 'Fireball', color: '#ffab66', kind: 'SPELL', action: '20 blast', tip: '20 damage, Burn 3 per turn. Pairs with Frost or Storm.', power: 20 },
    storm: { name: 'Storm Bolt', color: '#ffe48c', kind: 'SPELL', action: '16 shock', tip: '16 damage. Combines with Fire, Frost or Storm.', power: 16 },
    dodge: { name:'Dodge', color:'#a8e5c5', kind:'DEFENSE', action:'Evade 1 hit', tip:'Evade the next hit. Higher levels also grant barrier.', power:0 },
    riposte: { name:'Riposte', color:'#e1c5a8', kind:'DEFENSE', action:'Counter 14', tip:'Counter for 14 after blocking or dodging a hit this turn.', power:14 },
    guard: { name: 'Iron Guard', color: '#c1d6be', kind: 'DEFENSE', action: '22 barrier', tip: '22 barrier until enemy response ends. First slot adds 6.', power: 22 },
    echo: { name: 'Arcane Echo', color: '#d4a5fa', kind: 'SPELL', action: 'Repeat next', tip: 'The next attack, spell or defense fires twice.', power: 0 },
} as const;
export type Card = keyof typeof CARDS;
export type Room = 'monster' | 'cursed' | 'treasure' | 'campfire' | 'boss';
export type Item = 'heart-gem' | 'relic-charm' | 'card-scroll';
export const FLOORS = ['Sunken Crypt', 'Frostbound Vaults', 'Abyssal Sanctum'];
export const BOSSES = ['Dread Knight', 'Frost Lich', 'Abyssal Overlord'];
export const ROOMS: Record<Room, string> = {
    monster: 'Battle', cursed: 'Cursed room', treasure: 'Treasure Vault', campfire: 'Campfire', boss: 'Boss',
};
export const RELICS = [
    { name: 'Cinder Seal', tip: 'Fireballs deal 5 more damage.' },
    { name: 'Glacier Eye', tip: 'Frost Bolts deal 5 more damage.' },
    { name: 'Vapor Knot', tip: 'Steam Bursts deal 8 more damage.' },
];

export type Node = { room: Room; row: number; lane: number };
const STARTER: Card[] = ['slash','slash','dash','dash','frost','frost','fire','fire','guard','guard','dodge','riposte','echo','echo'];
const CARD_KEYS = Object.keys(CARDS) as Card[];
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
        { room: 'campfire', row: 2, lane: swap ? -1 : 1 },
        { room: 'monster', row: 3, lane: restSwap ? 1 : -1 },
        { room: 'campfire', row: 3, lane: restSwap ? -1 : 1 },
        { room: 'boss', row: 4, lane: 0 },
    ];
}

export const run = {
    floor: 1, hp: MAX_HP, capacity: START_CAPACITY, maxHp: MAX_HP, powers: [] as string[], curses: [] as string[], deck: [...STARTER], deckIds: STARTER.map(newCardId), gold: 0,
    levels: {} as Record<number, number>,
    relics: [] as number[], map: [] as Node[], path: [] as Node[],
    room: 'monster' as Room, node: null as Node | null,
    stats: { rooms: 0, bosses: 0, relics: 0, cards: 0, combos: 0 },
    tutorial: false, result: '' as 'victory' | 'game-over' | '',
    cheats: { infiniteHealth: false, invincible: false, infinitePips: false, oneHit: false },
};

export function reset(floor = 1, tutorial = false): void {
    Object.assign(run, {
        floor, hp: MAX_HP, capacity: START_CAPACITY + floor - 1, maxHp: MAX_HP, powers: [], curses: [], deck: [...STARTER], deckIds: STARTER.map(newCardId), gold: 0, levels: {}, relics: [], map: makeMap(),
        path: [], node: null, room: 'monster', result: '', tutorial,
        stats: { rooms: (floor - 1) * 5, bosses: floor - 1, relics: 0, cards: 0, combos: (floor - 1) * 5 },
        cheats: { infiniteHealth: false, invincible: false, infinitePips: false, oneHit: false },
    });
    for (let i = 1; i < floor; i++) {
        grant('relic-charm');
        grant('card-scroll');
        upgrade(i === 1 ? 'fire' : 'guard');
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
        const card = game.rng.pick(rare ? (['echo', 'fire'] as const) : CARD_KEYS);
        const id = addCard(card);
        if (id < 0) return 'No family slot available.';
        run.stats.cards++;
        if (rare) upgrade(card,id);
        return (rare ? 'Rare scroll  ·  ' : 'Card Scroll  ·  ') + CARDS[card].name;
    }
    const available = RELICS.map((_, i) => i).filter(i => !run.relics.includes(i));
    const index = game.rng.pick(available.length ? available : RELICS.map((_, i) => i));
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
    if (level >= 3 || cardSize(card,id) + (level === 2 ? 1 : 0) > run.capacity) return;
    run.levels[id] = level + 1;
}

export function saleValue(id: number): number {
    const card = run.deck[run.deckIds.indexOf(id)];
    if (!card) return 0;
    return (cardRarity(card) === 'Rare' ? 20 : cardRarity(card) === 'Uncommon' ? 15 : 10) + (cardLevel(id)-1)*5;
}

export function sellCard(id: number): string {
    if (game.scenes.stack?.includes('play') || game.scenes.stack?.includes('reward')) return 'Sell from the map or a rest room.';
    const index = run.deckIds.indexOf(id);
    if (index < 0 || run.deck.length <= MIN_DECK) return 'Keep at least eight cards.';
    const card = run.deck[index];
    const remaining = run.deck.filter((_,i) => i !== index);
    if (!remaining.includes('guard') || !remaining.some(c => c === 'slash' || c === 'dash' || c === 'cleave' || c === 'fire' || c === 'frost' || c === 'storm')) return 'Keep an attack and a Guard.';
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
    if (!remaining.includes('guard') || !remaining.some(c => c === 'slash' || c === 'dash' || c === 'cleave' || c === 'fire' || c === 'frost' || c === 'storm')) return false;
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
        run.capacity++;
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
