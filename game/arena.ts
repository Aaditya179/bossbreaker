import { gearBonus, setCount } from './equipment.js';
import { planReactions, type Reaction } from './elements.js';
import { COMBOS, discover } from './combos.js';
import { applyStatus, stacks, tickStatuses, type Status, type Statuses } from './status.js';
import { game } from './engine.js';
import { BOSSES, CARDS, EARTH_BLOCK_BASE, EARTH_BLOCK_STEP, ELEMENT_POWER_STEP, HAND_SIZE, MAX_CASTS, PIPS, cardLevel, cardSize, relicCount, run, type Card, type Element } from './run.js';

export type Point = { x: number; y: number };
export type CombatEvent = { kind:'card'|'damage'|'combo'|'status'|'block'|'enemy'|'defeat'|'echo'; text:string; amount?:number; target?:number; critical?:boolean; color?:string; phase?:Phase }; 
export const FIELD = { left: 65, right: 655, top: 215, bottom: 705 };
export const PILLARS = [{ x: 117, y: 431 }, { x: 603, y: 431 }];
export const RUNES = [{ x: 250, y: 310 }, { x: 470, y: 310 }, { x: 250, y: 575 }, { x: 470, y: 575 }];
const PILLAR_RADIUS = 25;

export const CRITICAL_CHANCE = 0.10;
export const CRITICAL_MULTIPLIER = 1.5;
export const LUCKY_OVERLOAD_CHANCE = 0.15;
export const PHANTOM_EDGE_CHANCE = 0.12;
const SPELL_SPEED = 1050;
const HIT_WAIT = 0.38;
const DODGE_TIME = 0.95;
const STAGE_TIME = 0.51;
const UPGRADE_POWER = ELEMENT_POWER_STEP;
const ENRAGE_HP = 0.44;

export const FOES = {
    slime: { name: 'Crypt Slime', hp: 45, size: 69, color: '#81dcb1' },
    archer: { name: 'Bone Archer', hp: 48, size: 78, color: '#dcacf9' },
    gargoyle: { name: 'Gargoyle Sentinel', hp: 72, size: 96, color: '#d9b787' },
    knight: { name: BOSSES[0], hp: 200, size: 141, color: '#ff847b' },
    lich: { name: BOSSES[1], hp: 230, size: 145, color: '#95edff' },
    overlord: { name: BOSSES[2], hp: 270, size: 158, color: '#ffbd79' },
} as const;
export type FoeId = keyof typeof FOES;
export type Foe = Point & { id: FoeId; hp: number; max: number; statuses: Statuses; stagger: boolean; flash: number };
type Shape = { kind: 'circle'; r: number } | { kind: 'lane'; end: Point; r: number } | { kind: 'arc'; ang: number; arc: number; r: number };
export type Zone = Point & Shape & { label: string; damage: number; owner?: Foe; stage: number; rune?: boolean; puddle?: boolean };
export type Effect = Point & { end?: Point; kind: 'slash' | 'dash' | 'ring' | 'steam' | 'impact' | 'door'; color: string; age: number; life: number; angle?: number; text?: string };
type Shot = Point & { aim: Point; card: Element; time: number; reaction: Reaction | null; empowered: boolean; bonus: number; target: number; level: number; critical: boolean };
type Phase = 'plan' | 'execute' | 'enemy' | 'clear' | 'lost';

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export const angle = (a: Point, b: Point): number => Math.atan2(b.y - a.y, b.x - a.x);
export const along = (a: Point, ang: number, length: number): Point => ({ x: a.x + Math.cos(ang) * length, y: a.y + Math.sin(ang) * length });
export const deltaAngle = (a: number, b: number): number => Math.atan2(Math.sin(a-b), Math.cos(a-b));
const clamp = (a: number, min: number, max: number): number => Math.max(min, Math.min(max, a));

function inZone(p: Point, z: Zone): boolean {
    if (z.kind === 'circle') return distance(p, z) <= z.r;
    if (z.kind === 'arc') return distance(p, z) <= z.r && Math.abs(deltaAngle(angle(z, p), z.ang)) <= z.arc;
    const dx = z.end.x - z.x, dy = z.end.y - z.y;
    const t = clamp(((p.x-z.x)*dx + (p.y-z.y)*dy) / (dx*dx + dy*dy || 1), 0, 1);
    return distance(p, { x: z.x+dx*t, y: z.y+dy*t }) <= z.r;
}

function walkable(p: Point, padding = 0): boolean {
    return p.x >= FIELD.left + padding && p.x <= FIELD.right - padding &&
        p.y >= FIELD.top + padding && p.y <= FIELD.bottom - padding &&
        PILLARS.every(pillar => distance(pillar, p) > PILLAR_RADIUS + padding);
}

const shuffled = (cards: readonly Card[]): Card[] => game.rng.shuffle([...cards]);

export const battle = {
    phase: 'plan' as Phase, turn: 1, pips: PIPS, barrier: 0, statuses: {} as Statuses, hand: [] as (Card | null)[],
    queue: [] as number[], draw: [] as Card[], spent: [] as Card[],
    handIds: [] as (number | null)[], drawIds: [] as number[], spentIds: [] as number[], foes: [] as Foe[],
    zones: [] as Zone[], puddles: [] as Zone[], effects: [] as Effect[], shots: [] as Shot[],
    hero: { x: 360, y: 553 }, aim: -Math.PI / 2, cast: 0,
    tutorial: false, moved: false, dodged: false, steamed: false,
    events: [] as CombatEvent[], planned: [] as (Reaction|null)[], rejectedId: -1, randomLog: [] as string[], note: '', resolving: '', last: null as Card | null, echo: false,
    castWait: 0, repeat: null as { card: Card; aim: number; reaction: Reaction | null; dashCombo: boolean } | null,
    enemyTime: 0, enemyStage: 0, discardOnly: [] as number[], selected: [] as number[], redraw: 0, inspected: -1, sequence: [] as Card[], activeSlot: -1, target: 0, targets: {} as Record<number,number>, activeTarget: 0, activeCardId: -1, echoBonus: 0, sequenceIds: [] as number[], dodges: 0, ripostes: 0, ripostePowers: [] as {damage:number;burn:boolean}[], debuffWard:0, powerUsed: {} as Record<string,boolean>,
};

export function initBattle(single?: FoeId): void {
    const floor = run.floor;
    const tutorial = run.tutorial && run.room === 'monster' && run.path.length === 0 && !single;
    const byFloor: FoeId[][] = [['slime','archer'], ['archer','gargoyle'], ['gargoyle','gargoyle']];
    const ids: FoeId[] = single ? [single] : run.room === 'boss'
        ? [(['knight','lich','overlord'] as const)[floor-1]]
        : tutorial ? ['slime'] : byFloor[floor-1];
    const foes = ids.map((id, i): Foe => {
        const hp = tutorial ? 62 : FOES[id].hp + (run.room === 'cursed' ? 12 : 0) + (run.room === 'boss' ? 0 : run.path.length*2);
        return { id, x: ids.length === 1 ? 360 : 239 + 242*i, y: ids.length === 1 ? 344 : 347 + 35*i, hp, max: hp, statuses: {}, stagger: false, flash: 0 };
    });
    const deck = game.rng.shuffle(run.deck.map((card,i) => ({ card, id:run.deckIds[i] })));
    Object.assign(battle, {
        phase: 'plan', turn: 1, pips: PIPS, barrier: 0, hand: [], queue: [], spent: [], effects: [], shots: [],
        zones: [], puddles: [], foes, draw: deck.map(entry => entry.card), drawIds: deck.map(entry => entry.id), handIds: [], spentIds: [], hero: { x: 360, y: 553 }, aim: -Math.PI / 2,
        tutorial, moved: false, dodged: false, steamed: false, cast: 0, events: [], planned: [], rejectedId: -1, randomLog: ['rng '+JSON.stringify(game.rng.snapshot())], note: '', resolving: '',
        last: null, echo: false, castWait: 0, repeat: null, enemyTime: 0, enemyStage: 0, discardOnly: [], selected: [], redraw: 0, inspected: -1, sequence: [], activeSlot: -1, target: 0, targets: {}, activeTarget: 0, activeCardId: -1, echoBonus: 0, sequenceIds: [], dodges: 0, ripostes: 0, ripostePowers: [], debuffWard:0, powerUsed: {}, statuses: {},
    });
    if (tutorial) {
        const opening: {card: Card; id: number}[] = [];
        for (const card of ['frost','fire','guard'] as Card[]) {
            const index = battle.draw.indexOf(card);
            if (index >= 0) opening.push({ card: battle.draw.splice(index,1)[0], id: battle.drawIds.splice(index,1)[0] });
        }
        while (opening.length < HAND_SIZE) opening.push({ card:battle.draw.shift()!, id:battle.drawIds.shift()! });
        game.rng.shuffle(opening);
        battle.draw.unshift(...opening.map(entry => entry.card));
        battle.drawIds.unshift(...opening.map(entry => entry.id));
    }
    deal();
    if (relicCount(8)) applyHeroStatus('poison');
    telegraph();
    game.sound.play('gate');
}

function draw(): {card: Card; id: number} {
    if (!battle.draw.length) {
        const entries = game.rng.shuffle(battle.spent.map((card,i) => ({card,id:battle.spentIds[i]})));
        battle.draw = entries.map(entry => entry.card);
        battle.drawIds = entries.map(entry => entry.id);
        battle.spent = [];
        battle.spentIds = [];
        battle.note = 'Discard pile reshuffled.';
        game.sound.play('shuffle');
    }
    const card = battle.draw.shift();
    const id = battle.drawIds.shift();
    if (!card || id === undefined) throw new Error('No card available to draw');
    return { card, id };
}

function deal(): void {
    const cards = Array.from({ length: HAND_SIZE }, draw);
    battle.hand = cards.map(entry => entry.card);
    battle.handIds = cards.map(entry => entry.id);
    game.sound.play('draw');
}

export function cardIndex(id: number): number { return battle.handIds.indexOf(id); }

export function discard(ids: number[]): boolean {
    const unique = [...new Set(ids)];
    const indices = unique.map(cardIndex);
    if (battle.phase !== 'plan' || !battle.pips || !unique.length ||
        indices.some((i,n) => i < 0 || !battle.hand[i] || battle.queue.includes(unique[n]))) return false;
    const removed = indices.map(i => ({card:battle.hand[i]!,id:battle.handIds[i]!}));
    for (const i of indices) {
        if (!battle.draw.length && !battle.spent.length) {
            battle.spent.push(...removed.map(entry => entry.card));
            battle.spentIds.push(...removed.map(entry => entry.id));
            removed.length = 0;
        }
        const replacement = draw();
        battle.hand[i] = replacement.card;
        battle.handIds[i] = replacement.id;
    }
    battle.spent.push(...removed.map(entry => entry.card));
    battle.spentIds.push(...removed.map(entry => entry.id));
    if (!run.cheats.infinitePips) battle.pips--;
    battle.selected = [];
    battle.discardOnly = [];
    battle.redraw++;
    game.sound.play('draw');
    return true;
}

export function maxCapacity(): number { return Math.max(1,run.capacity-stacks(battle.statuses,'paralysis')); }

export function usedCapacity(): number {
    return battle.queue.reduce((sum, id) => sum + cardSize(battle.hand[cardIndex(id)]!,id), 0);
}

export function queueSelected(): boolean {
    if (battle.phase !== 'plan' || !battle.selected.length) {
        battle.note = 'Select cards first.';
        return false;
    }
    if (stacks(battle.statuses,'silence') && battle.selected.some(id => ['fire','storm'].includes(battle.hand[cardIndex(id)]!))) {
        battle.note = 'Silenced: Fire and Storm are blocked this turn.';
        return false;
    }
    const size = battle.selected.reduce((sum, id) => sum + cardSize(battle.hand[cardIndex(id)]!,id), 0);
    if (usedCapacity() + size > maxCapacity()) {
        battle.note = 'Selection exceeds remaining casts.';
        return false;
    }
    battle.selected.sort((a,b) => cardIndex(a)-cardIndex(b));
    for (const id of battle.selected) battle.targets[id] ??= battle.target;
    battle.queue.push(...battle.selected);
    battle.selected = [];
    battle.inspected = -1;
    battle.note = '';
    game.sound.play('select');
    return true;
}

export function queueCard(id: number, target?: number): void {
    if (battle.phase !== 'plan') return;
    const current = battle.queue.indexOf(id);
    if (current >= 0) {
        battle.queue.splice(current, 1);
        if (target !== undefined) battle.queue.splice(target, 0, id);
        else delete battle.targets[id];
    }
    game.sound.play('select');
}

export function endTurn(): void {
    if (battle.phase !== 'plan' || battle.queue.length) return;
    battle.selected = [];
    battle.phase = 'enemy';
    event({kind:'enemy',text:'ENEMY RESPONSE'});
    battle.enemyStage = 0;
    battle.enemyTime = DODGE_TIME;
    battle.note = '';
}

function event(entry: CombatEvent): void { battle.events.push({...entry,phase:battle.phase}); }
function applyFoeStatus(foe:Foe,status:Status): void {
    applyStatus(foe.statuses,status);
    event({kind:'status',text:status.toUpperCase(),target:battle.foes.indexOf(foe),color:'#b3e7ff'});
}
function applyHeroStatus(status:Status): boolean {
    if (battle.debuffWard>0) { battle.debuffWard--; event({kind:'status',text:'DEBUFF RESISTED',color:'#a7e9ff'}); return false; }
    applyStatus(battle.statuses,status);
    event({kind:'status',text:status.toUpperCase(),color:'#ffad98'});
    return true;
}

export function execute(): void {
    if (battle.phase !== 'plan' || !battle.queue.length) return;
    battle.phase = 'execute';
    battle.events = [];
    battle.sequenceIds = [...battle.queue];
    battle.sequence = battle.queue.map(id => battle.hand[cardIndex(id)]!);
    battle.planned = planReactions(battle.sequence,battle.sequenceIds.map(id=>cardLevel(id)));
    battle.activeSlot = -1;
    battle.selected = [];
    battle.note = '';
    battle.castWait = 0;
    game.sound.play('ready');
}

function telegraph(): void {
    const { turn, hero } = battle;
    if (!battle.foes[battle.target] || battle.foes[battle.target].hp <= 0) battle.target = Math.max(0,battle.foes.findIndex(foe => foe.hp > 0));
    battle.zones = [...battle.puddles];
    battle.puddles = [];
    const add = (foe: Foe, name: string, damage: number, origin: Point, shape: Shape, stage = 0): void => {
        battle.zones.push({ ...origin, ...shape, label: name, damage:damage + (battle.tutorial ? 0 : Math.floor(run.path.length/2)), stage, owner: foe });
    };
    for (const f of battle.foes.filter(foe => foe.hp > 0)) {
        const ang = angle(f, hero);
        const chill = stacks(f.statuses,'chill') ? 0.77 : 1;
        const lane = (origin: Point, end: Point, r: number): Shape => ({ kind: 'lane', end: along(origin, angle(origin,end), 950), r: r*chill });
        const circle = (r: number): Shape => ({ kind: 'circle', r: r*chill });
        const arc = (r: number, spread = 1): Shape => ({ kind: 'arc', r: r*chill, ang, arc: spread });
        f.stagger = false;
        if (f.id === 'slime') add(f, 'Slime hop', battle.tutorial ? 5 : 10, hero, circle(78));
        if (f.id === 'archer') {
            let length = 8;
            while (length < 950 && walkable(along(f,ang,length))) length += 8;
            add(f, 'Bone arrow', 12, f, { kind:'lane', end:along(f,ang,length), r:31*chill });
        }
        if (f.id === 'gargoyle') {
            if (turn % 2) add(f, 'Stone slam', 17, hero, circle(104));
            else add(f, 'Swooping charge', 18, f, { kind: 'lane', end: along(f, ang, Math.min(400, distance(f,hero)+60)), r: 48*chill });
        }
        if (f.id === 'knight') {
            if (turn % 2) add(f, 'Greatsword sweep', 22, f, arc(Math.max(252, Math.min(390, distance(f,hero)+35))));
            else add(f, 'Charging slam', 24, hero, circle(111));
            if (f.hp <= f.max * ENRAGE_HP) add(f, 'Second swing', 17, hero, circle(89), 1);
        }
        if (f.id === 'lich') {
            add(f, 'Crossing ice', 19, {x: hero.x, y: FIELD.top}, lane({x: hero.x, y: FIELD.top}, {x: hero.x, y: FIELD.bottom}, 43));
            add(f, 'Crossing ice', 19, {x: FIELD.left, y: hero.y}, lane({x: FIELD.left, y: hero.y}, {x: FIELD.right, y: hero.y}, 40), 1);
            if (turn % 2 === 0) add(f, 'Frost shards', 16, f, circle(125), 1);
        }
        if (f.id === 'overlord') {
            add(f, 'Dark-fire sweep', 25, f, arc(380, 0.79));
            add(f, 'Second blade', 17, hero, circle(112), 1);
        }
    }
    for (const zone of battle.zones) {
        if (zone.stage !== 0) continue;
        if (zone.owner?.id === 'slime' && !battle.tutorial && !zone.puddle) zone.label += ' + poison';
        if (zone.owner?.id === 'archer' && turn % 2 === 0) zone.label += ' + weaken';
        if (zone.owner?.id === 'overlord' && turn % 2 === 0) zone.label += ' + burn';
    }
    if (turn % 3 === 0) {
        for (const zone of battle.zones) {
            if (zone.stage === 0 && zone.owner?.id === 'knight') zone.label += ' + armor break';
            if (zone.stage === 0 && zone.owner?.id === 'lich') zone.label += ' + silence';
            if (zone.stage === 0 && zone.owner?.id === 'overlord') zone.label += ' + paralysis';
        }
    }
    if (run.room === 'cursed' || battle.foes.some(f => f.id === 'overlord')) {
        battle.zones.push({ ...RUNES[turn % RUNES.length], r: 76, kind: 'circle', stage: 1, label: 'Rune eruption', damage: 15, rune: true });
    }
}

function effect(kind: Effect['kind'], p: Point, color: string, extra: Partial<Effect> = {}): void {
    battle.effects.push({ ...p, kind, color, age: 0, life: 0.48, ...extra });
}
function burst(p: Point, color: string, big = false): void {
    game.particles.burst({ x: p.x, y: p.y, count: big ? 24 : 11, layer: 'front', frame: big ? 'particle:smoke' : 'particle:spark', color: [color, '#fff3d8'], speed: [60, 230], lifespan: [0.2, 0.45], scale: [0.4, 1.1] });
}

function hurtFoe(f: Foe, power: number, color: string, empowered: boolean, knockback = false, critical = false): void {
    if (f.hp <= 0) return;
    power = Math.max(0, power - stacks(battle.statuses,'weaken')*3 - stacks(battle.statuses,'chill')*4) + stacks(f.statuses,'armorBreak')*3 + (run.curses.includes('glassheart') ? 6 : 0);
    if (empowered && f.id !== 'knight' && f.id !== 'overlord' && f.id !== 'lich') f.stagger = true;
    let damage = f.id === 'gargoyle' && !f.stagger ? Math.ceil(power * 0.53) : power;
    if (f.id === 'lich' && knockback) damage += 6;
    const before = f.hp;
    f.hp = Math.max(0, f.hp - (run.cheats.oneHit ? f.hp : damage));
    event({kind:'damage',text:critical ? 'CRITICAL' : 'DAMAGE',amount:before-f.hp,target:battle.foes.indexOf(f),critical,color});
    if (!f.hp) event({kind:'defeat',text:FOES[f.id].name+' defeated',target:battle.foes.indexOf(f)});
    f.flash = 0.13;
    effect('impact', f, color, { text: (critical ? 'CRIT ' : '')+String(damage), life: 0.62 });
    burst(f, color, f.hp === 0);
    game.sound.play(f.hp === 0 ? 'vanish' : critical ? 'critical' : 'hit');
    if (knockback) {
        const retreat = along(f, angle(battle.hero, f), 48);
        if (walkable(retreat, 20)) Object.assign(f, retreat);
    }
}

function resolveReaction(combo:Reaction, hit:Foe, color:string): void {
    const index=battle.foes.indexOf(hit), area=battle.foes.filter(f=>f.hp>0);
    const triple=['cataclysm','bastion','meteorfall','absolute'].includes(combo);
    if (triple) run.stats.triples++;
    if(discover(combo)) battle.note='NEW COMBO: '+COMBOS[combo].name;
    const lucky=combo==='overload' && game.rng.chance(LUCKY_OVERLOAD_CHANCE);
    if(lucky) { battle.randomLog.push('Lucky Overload'); battle.note='SUPER OVERLOAD'; }
    event({kind:'combo',text:lucky?'SUPER OVERLOAD':COMBOS[combo].name.toUpperCase(),target:index,color});
    const hitAll=(amount:number,status?:Status):void=>{ for(const foe of area) { hurtFoe(foe,amount,color,false); if(status && foe.hp>0)applyFoeStatus(foe,status); } };
    const block=(amount:number):void=>{battle.barrier+=amount;event({kind:'block',text:'BLOCK GAINED',amount});};
    switch(combo) {
      case 'steam': hitAll(7+relicCount(2)*8,'weaken'); break;
      case 'overload': hitAll(6+(lucky?5:0)); break;
      case 'firestorm': hitAll(6,'burn'); break;
      case 'magma': battle.powerUsed.magmaArmor=true; block(12); battle.ripostes++; battle.ripostePowers.push({damage:8,burn:true}); break;
      case 'shatter': hurtFoe(hit,8,color,false); if(hit.hp>0)applyFoeStatus(hit,'armorBreak'); break;
      case 'blizzard': hitAll(5,'chill'); break;
      case 'fortress': block(20); battle.debuffWard=1; break;
      case 'tempest': hurtFoe(hit,4,color,false); { const other=area.find(foe=>foe!==hit && foe.hp>0); hurtFoe(other ?? hit,4,color,false); } break;
      case 'magnetic': block(10); battle.ripostes++; battle.ripostePowers.push({damage:10,burn:false}); break;
      case 'sandstorm': battle.dodges=Math.max(1,battle.dodges); hitAll(5); break;
      case 'inferno': if(hit.hp>0)applyFoeStatus(hit,'burn'); break;
      case 'freeze': if(hit.hp>0)applyFoeStatus(hit,'chill'); break;
      case 'surge': hitAll(6); break;
      case 'cataclysm': hitAll(20,'burn'); break;
      case 'bastion': block(35); battle.ripostes++; battle.ripostePowers.push({damage:15,burn:false}); break;
      case 'meteorfall': hitAll(24,'burn'); break;
      case 'absolute': hurtFoe(hit,10,color,false); hurtFoe(hit,10,color,false); if(hit.hp>0){applyFoeStatus(hit,'chill');applyFoeStatus(hit,'weaken');} break;
    }
    const ingredients=battle.sequence.slice(Math.max(0,battle.activeSlot-(triple?2:1)),battle.activeSlot+1);
    if(setCount('sentinel')>=3 && ingredients.includes('earth') && !battle.powerUsed.sentinelSet) { battle.powerUsed.sentinelSet=true; battle.ripostes++; battle.ripostePowers.push({damage:6,burn:false}); event({kind:'combo',text:'SENTINEL COUNTER',target:index}); }
    if(setCount('ember')>=3 && ingredients.includes('fire') && !battle.powerUsed.emberSet) { battle.powerUsed.emberSet=true; hurtFoe(hit,4,color,false); event({kind:'combo',text:'EMBER SET',target:index}); }
    if(relicCount(4) && ingredients.includes('earth') && !battle.powerUsed.knightRelic) {
        battle.powerUsed.knightRelic=true; block(8); if(hit.hp>0)applyFoeStatus(hit,'armorBreak');
        event({kind:'combo',text:'KNIGHT’S BASTION',target:index,color:'#e7c187'});
    }
    if(relicCount(5) && ingredients.includes('frost') && !battle.powerUsed.winterRelic) {
        battle.powerUsed.winterRelic=true; if(hit.hp>0){applyFoeStatus(hit,'chill');applyFoeStatus(hit,'weaken');}
        event({kind:'combo',text:'CROWN OF WINTER',target:index,color:'#a5eaff'});
    }
    if(relicCount(6) && ingredients.includes('fire') && !battle.powerUsed.reactorRelic) {
        battle.powerUsed.reactorRelic=true; hitAll(5,'burn');
        event({kind:'combo',text:'ABYSSAL REACTOR',target:index,color:'#ffa76e'});
    }
    if(relicCount(7) && !battle.powerUsed.prismRelic) { battle.powerUsed.prismRelic=true; hurtFoe(hit,4,color,false); event({kind:'combo',text:'PRISMATIC CORE',target:index,color:'#e1c5ff'}); }
    if(relicCount(9) && ingredients.includes('wind') && !battle.powerUsed.galeRelic) { battle.powerUsed.galeRelic=true; block(6); event({kind:'combo',text:'GALE MANTLE',target:index,color:'#b7f5d2'}); }
    if(relicCount(10) && ingredients.includes('earth') && !battle.powerUsed.earthRelic) { battle.powerUsed.earthRelic=true; block(6); event({kind:'combo',text:'EARTHEN HEART',target:index,color:'#e0c790'}); }
    if(relicCount(8) && !battle.powerUsed.plagueRelic) { battle.powerUsed.plagueRelic=true; hurtFoe(hit,6,color,false); event({kind:'combo',text:'PLAGUEBOUND IDOL',target:index,color:'#cbe591'}); }
    effect(combo==='steam'?'steam':'ring',hit,color,{end:{x:triple?145:90,y:0},life:triple?0.85:0.6});
    burst(hit,color,true); game.sound.play(combo==='overload'||combo==='tempest'?'storm':'steam');
    battle.castWait=Math.max(battle.castWait,triple?0.8:0.65);
}
function land(shot: Shot, hit?: Foe): void {
    if (!hit) return;
    const color=CARDS[shot.card].color;
    const bonus=shot.card==='fire'?relicCount(0)*5:shot.card==='frost'?relicCount(1)*5:0;
    const raw=CARDS[shot.card].power+(shot.level-1)*UPGRADE_POWER+gearBonus(shot.card)+bonus+shot.bonus;
    hurtFoe(hit,shot.critical?Math.ceil(raw*CRITICAL_MULTIPLIER):raw,color,shot.empowered,false,shot.critical);
    if(shot.card==='fire' && hit.hp>0)applyFoeStatus(hit,'burn');
    if(shot.card==='frost' && hit.hp>0)applyFoeStatus(hit,'chill');
    if(shot.card==='wind') battle.dodges=Math.max(1,battle.dodges);
    if(shot.card==='earth') { const amount=EARTH_BLOCK_BASE+(shot.level-1)*EARTH_BLOCK_STEP+(setCount('sentinel')>=2 ? 4 : 0); battle.barrier+=amount; event({kind:'block',text:'BLOCK GAINED',amount}); }
    if(shot.reaction) resolveReaction(shot.reaction,hit,color);
    else effect('ring',hit,color);
}

function cast(card: Card, aim: number, empowered: boolean, combo: Reaction | null, dashCombo: boolean, first: boolean, repeating = false): void {
    const p = battle.hero;
    const bonus = repeating ? battle.echoBonus : 0;
    const level = cardLevel(battle.activeCardId);
    const power = CARDS[card].power + (level - 1)*UPGRADE_POWER + gearBonus(card) + bonus + (CARDS[card].kind === 'SWORD' && run.powers.includes('whetstone') ? 3 : 0);
    const color = CARDS[card].color;
    const offensive = ['slash','dash','cleave','sovereign','immolate','fire','frost','storm','wind','earth'].includes(card);
    const critical = offensive && game.rng.chance(CRITICAL_CHANCE);
    if (critical) battle.randomLog.push('Critical '+card);
    battle.cast = 0.18;
    game.sound.play(card);
    switch (card) {
        case 'echo':
            battle.echo = true;
            battle.echoBonus = (level-1)*UPGRADE_POWER;
            effect('ring', p, color);
            break;
        case 'dodge':
            battle.dodges++;
            battle.barrier += (level-1)*4;
            effect('ring',p,color);
            break;
        case 'bulwark':
            battle.barrier += power; battle.dodges++;
            event({kind:'block',text:'BLOCK GAINED',amount:power}); effect('ring',p,color); break;
        case 'riposte':
            battle.ripostes++;
            battle.ripostePowers.push({damage:power,burn:false});
            effect('ring',p,color);
            break;
        case 'guard':
            battle.barrier += power + (first ? 6 : 0) + (level >= 3 ? 4 : 0);
            event({kind:'block',text:'BLOCK GAINED',amount:power + (first ? 6 : 0) + (level >= 3 ? 4 : 0)});
            effect('ring', p, color);
            break;
        case 'dash':
        case 'slash':
        case 'cleave':
        case 'sovereign':
        case 'immolate': {
            const target = battle.foes[battle.activeTarget];
            if (!target || target.hp <= 0) break;
            if (dashCombo) { if (discover('lunge')) battle.note='NEW COMBO: '+COMBOS.lunge.name; event({kind:'combo',text:'LUNGING CLEAVE',target:battle.activeTarget,color:'#ffd17c'}); }
            const strike = along(target, angle(target,p), 60);
            effect('dash', p, color, { end: strike });
            effect('slash', strike, color, { angle: angle(strike,target), end: { x: 105, y: 0 } });
            const targets = (card === 'cleave' || card === 'slash' && dashCombo) ? battle.foes.filter(f => f.hp > 0) : [target];
            const loneBonus = card === 'cleave' && battle.foes.filter(foe => foe.hp > 0).length === 1 ? 8 : 0;
            for (const foe of targets) hurtFoe(foe, (critical ? Math.ceil(power*CRITICAL_MULTIPLIER) : power) + (dashCombo ? 8 : 0) + loneBonus, color, empowered || dashCombo, false, critical);
            if (!repeating && relicCount(3) && game.rng.chance(PHANTOM_EDGE_CHANCE)) {
                battle.randomLog.push('Phantom Edge '+card); battle.note='PHANTOM ECHO'; event({kind:'echo',text:'PHANTOM ECHO',target:battle.activeTarget,color:'#d9b4fa'});
                effect('slash',strike,'#d9b4fa',{angle:0,end:{x:80,y:0},life:0.65});
                for (const foe of targets) if (foe.hp > 0) hurtFoe(foe,Math.ceil(power*0.5),'#d9b4fa',false);
            }
            if (card === 'cleave' && level >= 3) for (const foe of targets) if (foe.hp > 0) applyStatus(foe.statuses,'weaken');
            if (card === 'sovereign' && target.hp > 0) applyFoeStatus(target,'armorBreak');
            if (card === 'immolate') { const before=run.hp; run.hp=Math.max(1,run.hp-5); event({kind:'status',text:'BLOOD COST '+(before-run.hp),color:'#ff8294'}); }
            if (run.powers.includes('knight') && !battle.powerUsed.knight && target.hp > 0) {
                applyFoeStatus(target,'armorBreak');
                battle.powerUsed.knight = true;
            }
            break;
        }
        default:
            battle.shots.push({ ...p, aim: along({ x: 0, y: 0 }, aim, 1), card, reaction:combo, empowered, bonus, target:battle.activeTarget, level, critical, time: 0 });
    }
}

export function fire(): void {
    if (battle.phase !== 'execute' || battle.castWait > 0 || !battle.queue.length) return;
    const id = battle.queue.shift()!;
    const index = cardIndex(id);
    const card = battle.hand[index];
    if (!card) return;
    battle.activeCardId = id;
    battle.hand[index] = null;
    battle.handIds[index] = null;
    battle.spent.push(card);
    battle.spentIds.push(id);
    battle.activeSlot++;
    const previous = battle.last;
    const first = previous === null;
    const empowered = battle.echo && card !== 'echo';
    const combo = battle.planned[battle.activeSlot] ?? null;
    const dashCombo = previous === 'dash' && card === 'slash';
    if (empowered || combo || dashCombo || (first && card === 'guard')) {
        run.stats.combos += Number(empowered) + Number(Boolean(combo)) + Number(dashCombo) + Number(first && card === 'guard');
        battle.note = combo ? 'ELEMENTAL REACTION' : dashCombo ? 'LUNGING CLEAVE' : empowered ? 'ARCANE ECHO' : 'GUARD FIRST';
    } else battle.note = CARDS[card].name;
    if (combo === 'steam') battle.steamed = true;
    battle.resolving = CARDS[card].name;
    battle.echo = false;
    battle.last = card;
    battle.castWait = HIT_WAIT;
    const chosen = battle.targets[id];
    battle.activeTarget = battle.foes[chosen]?.hp > 0 ? chosen : battle.foes.findIndex(foe => foe.hp > 0);
    delete battle.targets[id];
    const target = battle.foes[battle.activeTarget];
    event({kind:'card',text:CARDS[card].name,amount:battle.activeSlot+1,target:['slash','dash','cleave','sovereign','immolate','fire','frost','storm','wind','earth'].includes(card) ? battle.activeTarget : -1});
    if (target) battle.aim = angle(battle.hero, target);
    cast(card, battle.aim, empowered, combo, dashCombo, first);
    if (empowered) event({kind:'echo',text:'ARCANE ECHO',target:battle.activeTarget,color:'#d9b4fa'});
    if (empowered) battle.repeat = { card, aim: battle.aim, reaction:null, dashCombo };
}

function takeHit(zone: Zone): boolean {
    if (run.cheats.infiniteHealth || run.cheats.invincible) return false;
    const avoided = battle.dodges > 0;
    if (avoided) battle.dodges--;
    const incoming = zone.damage + stacks(battle.statuses,'armorBreak')*3;
    const blocked = avoided ? 0 : Math.min(battle.barrier, incoming);
    battle.barrier -= blocked;
    const loss = avoided ? 0 : incoming - blocked;
    run.hp = Math.max(0, run.hp - loss);
    if (blocked) event({kind:'block',text:'BLOCKED',amount:blocked});
    battle.note = avoided ? 'DODGED' : loss ? zone.label + '  ·  −' + loss + ' health' : 'Barrier absorbed ' + blocked;
    effect('impact', battle.hero, loss ? '#ff766e' : '#bbf0ff', { text: avoided ? 'DODGE' : loss ? '−' + loss : 'BLOCK' });
    game.sound.play(loss ? 'ouch' : 'guard');
    if ((avoided || blocked > 0) && battle.ripostes > 0 && zone.owner && zone.owner.hp > 0) {
        battle.ripostes--;
        event({kind:'combo',text:'RIPOSTE',target:battle.foes.indexOf(zone.owner),color:'#e1c5a8'});
        const counter=battle.ripostePowers.shift() ?? {damage:14,burn:false};
        hurtFoe(zone.owner,counter.damage,'#e1c5a8',true);
        if(counter.burn && zone.owner.hp>0) applyFoeStatus(zone.owner,'burn');
        battle.note = 'RIPOSTE';
    }
    return !avoided;
}

function resolveStage(stage: number): void {
    const resolved = new Set<Foe>();
    for (const zone of battle.zones) {
        const f = zone.owner;
        if (zone.stage !== stage || (f && (f.hp <= 0 || f.stagger || (stage === 0 && stacks(f.statuses,'paralysis')) || (f.id === 'lich' && stacks(f.statuses,'silence'))))) continue;
        const damage = f ? Math.max(1, zone.damage - stacks(f.statuses,'chill')*4 - stacks(f.statuses,'weaken')*3) : zone.damage;
        const hit = takeHit({ ...zone, damage });
        if (hit && stage === 0 && f) {
            const status = f.id === 'slime' && !battle.tutorial && !zone.puddle ? 'poison' :
                f.id === 'archer' && battle.turn % 2 === 0 ? 'weaken' :
                f.id === 'overlord' && battle.turn % 2 === 0 ? 'burn' : null;
            if (status && applyHeroStatus(status) && status === 'weaken') battle.statuses[status]!.turns++;
        }
        effect('ring', zone.kind === 'arc' ? along(zone, zone.ang, zone.r*0.65) : zone, zone.rune ? '#ce7af3' : '#ff6659', { end: { x: 72, y: 0 } });
        if (!f || resolved.has(f)) continue;
        resolved.add(f);
        if (hit && stage === 0 && battle.turn % 3 === 0 && (f.id === 'knight' || f.id === 'lich' || f.id === 'overlord')) {
            const status = f.id === 'knight' ? 'armorBreak' : f.id === 'lich' ? 'silence' : 'paralysis';
            if (applyHeroStatus(status)) battle.statuses[status]!.turns++;
        }
        if (f.id === 'slime' && !zone.puddle) {
            if (walkable(zone, 18)) { f.x = zone.x; f.y = zone.y; }
            battle.puddles.push({ x: f.x, y: f.y, r: 47, kind: 'circle', label: 'Slime puddle', damage: 7, stage: 0, puddle: true, owner: f });
        }
        if (f.id === 'archer' && distance(f,battle.hero) < 195) {
            const next = along(f, angle(battle.hero,f), stacks(f.statuses,'chill') ? 54 : 114);
            if (walkable(next, 22)) Object.assign(f, next);
        }
        if ((f.id === 'knight' && zone.kind === 'circle' && stage === 0) || (f.id === 'gargoyle' && zone.kind === 'lane')) {
            const next = along(f, angle(f,zone.kind === 'lane' ? zone.end : zone), Math.min(155,distance(f,zone.kind === 'lane' ? zone.end : zone)-30)*(stacks(f.statuses,'chill') ? 0.65 : 1));
            if (walkable(next, 25)) Object.assign(f,next);
        }
    }
    if (run.hp === 0) { battle.phase = 'lost'; return; }
    game.sound.play('enemy');
}

export function winBattle(): void {
    if (battle.phase === 'clear') return;
    if (run.room === 'boss') run.capacity=Math.min(MAX_CASTS,run.capacity+1);
    run.gold += run.room === 'boss' ? 25 : run.room === 'cursed' ? 18 : 12;
    battle.foes.forEach(f => { if (f.hp > 0) burst(f,'#b69bdd',true); f.hp = 0; });
    battle.phase = 'clear';
    battle.zones = [];
    battle.shots = [];
    battle.repeat = null;
    game.sound.play('clear');
    effect('door', { x: 360, y: 201 }, '#ffc976');
}

export function stepBattle(dt: number): void {
    battle.cast = Math.max(0, battle.cast - dt);
    battle.effects = battle.effects.filter(fx => (fx.age += dt) < fx.life);
    battle.foes.forEach(f => { f.flash = Math.max(0, f.flash-dt); });
    if (battle.phase === 'execute') {
        battle.castWait -= dt;
        if (!battle.repeat && !battle.shots.length && battle.queue.length && battle.castWait <= 0) fire();
        if (battle.repeat && battle.castWait <= 0) {
            const { card, aim, reaction: combo, dashCombo } = battle.repeat;
            battle.repeat = null;
            cast(card, aim, true, combo, dashCombo, false, true);
            battle.castWait = HIT_WAIT;
        }
        battle.shots = battle.shots.filter(shot => {
            shot.time += dt;
            const next = { x: shot.x + shot.aim.x*dt*SPELL_SPEED, y: shot.y + shot.aim.y*dt*SPELL_SPEED };
            if (!walkable(next) || shot.time > 0.7) {
                const target = battle.foes[shot.target];
                if (target && target.hp > 0) { shot.x = target.x; shot.y = target.y; land(shot, target); }
                return false;
            }
            Object.assign(shot, next);
            const target = battle.foes[shot.target];
            const hit = target && target.hp > 0 && distance(shot,target) < FOES[target.id].size*0.34 ? target : undefined;
            if (hit) { land(shot, hit); return false; }
            return true;
        });
        if (battle.foes.every(f => f.hp <= 0)) { battle.queue = []; winBattle(); }
        else if (!battle.queue.length && !battle.repeat && !battle.shots.length && battle.castWait <= 0) {
            battle.phase = 'enemy';
            event({kind:'enemy',text:'ENEMY RESPONSE'});
            battle.enemyStage = 0;
            battle.enemyTime = DODGE_TIME;
        }
    } else if (battle.phase === 'enemy') {
        battle.enemyTime -= dt;
        if (battle.enemyTime > 0) return;
        if (battle.enemyStage < 2) {
            resolveStage(battle.enemyStage++);
            if (battle.enemyStage === 1 && !battle.zones.some(z => z.stage === 1)) battle.enemyStage = 2;
            battle.enemyTime = STAGE_TIME;
            return;
        }
        for (const f of battle.foes) {
            if (f.hp <= 0) continue;
            const poison = stacks(f.statuses,'poison')*2, burn = stacks(f.statuses,'burn')*3;
            const damage = tickStatuses(f.statuses);
            if (damage) {
                const before=f.hp; f.hp = Math.max(0,f.hp-damage);
                const poisonLoss=Math.min(before,poison), burnLoss=Math.min(Math.max(0,before-poisonLoss),burn);
                if (poisonLoss) event({kind:'damage',text:'POISON',amount:poisonLoss,target:battle.foes.indexOf(f),color:'#c7e68a'});
                if (burnLoss) event({kind:'damage',text:'BURN',amount:burnLoss,target:battle.foes.indexOf(f),color:'#ffad70'});
                f.flash = 0.13;
                effect('impact', f, '#c7e68a', { text:String(damage), life:0.62 });
                if (!f.hp) burst(f,'#c7e68a',true);
            }
        }
        const heroPoison=stacks(battle.statuses,'poison')*2, heroBurn=stacks(battle.statuses,'burn')*3;
        const statusDamage = tickStatuses(battle.statuses);
        if (!run.cheats.infiniteHealth && !run.cheats.invincible) {
            const before=run.hp; run.hp = Math.max(0,run.hp-statusDamage);
            const poisonLoss=Math.min(before,heroPoison),burnLoss=Math.min(Math.max(0,before-poisonLoss),heroBurn);
            if(poisonLoss) event({kind:'status',text:'POISON '+poisonLoss,color:'#c7e68a'});
            if(burnLoss) event({kind:'status',text:'BURN '+burnLoss,color:'#ffad70'});
        }
        if (run.hp <= 0) { battle.phase = 'lost'; return; }
        if (battle.foes.every(f => f.hp <= 0)) { winBattle(); return; }
        battle.turn++;
        battle.phase = 'plan';
        battle.powerUsed = {};
        battle.sequence = [];
        battle.activeSlot = -1;
        battle.inspected = -1;
        battle.note = '';
        battle.last = null;
        battle.echo = false;
        battle.barrier = 0;
        battle.dodges = 0;
        battle.ripostes = 0;
        battle.ripostePowers = [];
        battle.debuffWard = 0;
        battle.spent.push(...battle.hand.filter((card): card is Card => card !== null));
        battle.spentIds.push(...battle.handIds.filter((id): id is number => id !== null));
        telegraph();
        deal();
    }
}
