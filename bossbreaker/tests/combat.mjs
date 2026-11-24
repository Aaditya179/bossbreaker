import { strict as assert } from 'node:assert';
import { build } from '../phaser/node_modules/esbuild/lib/main.js';

const mockEngine = `
let seed = 42;
export const game = {
  rng: {
    shuffle(cards) { for (let i = cards.length - 1; i > 0; i--) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; } return cards; },
    chance() { return false; }, pick(items) { return items[0]; }, weighted(items) { return items[0][0]; },
    fork() { return this; }, snapshot() { return [1,2,3,4]; }, restore(state) { seed = state[0] >>> 0; }
  },
  sound: { play() {} },
  particles: { burst() {} },
  feel: { shake() {} },
  save: { read(_key, fallback) { return fallback; }, write() {} },
  scenes: { go() {} }
};
`;
const result = await build({
    stdin: {
        contents: "export { game } from './game/engine.js'; export * from './game/arena.ts'; export { run, reset, upgrade, addCard, cardSize, cardFamily, completeRoom, sellCard } from './game/run.ts'; export { reaction } from './game/elements.ts'; export { applyStatus, stacks, tickStatuses } from './game/status.ts';",
        resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{
        name: 'mock-engine',
        setup(builder) {
            builder.onResolve({ filter: /(?:^|\/)engine\.js$/ }, () => ({ path: 'engine', namespace: 'mock' }));
            builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: mockEngine, loader: 'js' }));
        },
    }],
});
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64');
const { game, battle, run, reset, initBattle, discard: discardIds, queueCard, queueSelected, execute, stepBattle, upgrade, addCard, cardSize, cardFamily, completeRoom, sellCard, reaction, applyStatus, stacks, tickStatuses } = await import(moduleUrl);

function start() {
    reset(1, false);
    run.room = 'boss';
    initBattle();
}
function tickUntil(predicate, limit = 600) {
    for (let i = 0; i < limit && !predicate(); i++) stepBattle(1 / 60);
    assert.ok(predicate(), 'battle did not reach expected state');
}
function counts(cards) {
    return [...cards].sort().join(',');
}
function assertCards() {
    assert.equal(battle.hand.length, 6);
    assert.equal(counts([...battle.hand, ...battle.draw, ...battle.spent]), counts(run.deck));
    assert.equal(counts([...battle.handIds,...battle.drawIds,...battle.spentIds]),counts(run.deckIds));
    assert.equal(new Set([...battle.handIds,...battle.drawIds,...battle.spentIds]).size,run.deck.length);
}
function discard(indices) { return discardIds(indices.map(i => battle.handIds[i])); }
function add(i) { battle.selected = [battle.handIds[i]]; queueSelected(); }
function act(indices) {
    for (const i of indices) add(i);
    execute();
    tickUntil(() => battle.phase === 'plan' || battle.phase === 'clear' || battle.phase === 'lost');
}
function configureHand(hand) {
    const all = [...battle.hand.map((card,i) => ({card,id:battle.handIds[i]})),
        ...battle.draw.map((card,i) => ({card,id:battle.drawIds[i]})),
        ...battle.spent.map((card,i) => ({card,id:battle.spentIds[i]}))];
    const selected = [];
    for (const card of hand) {
        const index = all.findIndex(entry => entry.card === card);
        assert.ok(index >= 0);
        selected.push(all.splice(index, 1)[0]);
    }
    battle.hand = selected.map(entry => entry.card);
    battle.handIds = selected.map(entry => entry.id);
    battle.draw = all.map(entry => entry.card);
    battle.drawIds = all.map(entry => entry.id);
    battle.spent = [];
    battle.spentIds = [];
}

function test(name, fn) {
    fn();
    console.log('PASS ' + name);
}

test('single and simultaneous discards spend one action each', () => {
    start();
    assert.ok(discard([0]));
    assert.equal(battle.pips, 2);
    assertCards();
    assert.ok(discard([0, 2, 4]));
    assert.equal(battle.pips, 1);
    assertCards();
    assert.ok(discard([1]));
    assert.equal(battle.pips, 0);
    assert.equal(discard([2]), false);
    assertCards();
});
test('discard budget persists across turns and resets on a new battle', () => {
    start();
    discard([0,1,2]);
    discard([1,3]);
    assert.equal(battle.pips,1);
    act([0]);
    assert.equal(battle.turn,2);
    assert.equal(battle.pips,1);
    act([0]);
    assert.equal(battle.pips,1);
    initBattle();
    assert.equal(battle.pips,3);
});
test('draw-pile exhaustion and repeated reshuffles conserve cards', () => {
    start();
    run.cheats.infinitePips = true;
    for (let i = 0; i < 25; i++) {
        assert.ok(discard([0,1,2,3,4]));
        assertCards();
    }
});
test('all discards spent stay depleted through a turn', () => {
    start();
    discard([0]); discard([1]); discard([2]);
    assert.equal(battle.pips,0);
    act([0]);
    assert.equal(battle.pips,0);
    assert.equal(discard([0]),false);
    assertCards();
});
test('minimum deck redraw can reshuffle selected cards only when necessary', () => {
    start();
    run.deck = ['slash','dash','frost','fire','guard','echo'];
    run.deckIds = [101,102,103,104,105,106];
    initBattle();
    assert.ok(discard([0,1,2,3,4]));
    assert.equal(battle.pips,2);
    assertCards();
});
test('duplicate indices do not spend extra actions or duplicate a card', () => {
    start();
    assert.ok(discard([1,1,1]));
    assert.equal(battle.pips,2);
    assert.equal(battle.spent.length,1);
    assertCards();
});
test('queued cards and non-planning discards are rejected', () => {
    start();
    add(0);
    assert.equal(discard([0]),false);
    assert.equal(discard([0,1]),false);
    assert.equal(battle.pips,3);
    queueCard(battle.handIds[0]);
    assert.ok(discard([0]));
    add(1);
    execute();
    assert.equal(discard([2]),false);
    assert.equal(battle.pips,2);
    tickUntil(() => battle.phase !== 'execute');
});
test('three cards execute in order without input before enemy response', () => {
    start();
    configureHand(['slash','fire','guard','dash','echo']);
    add(0); add(1); add(2);
    execute();
    const seen = [];
    let last = '';
    for (let i=0; i<500 && battle.phase === 'execute'; i++) {
        stepBattle(1/60);
        const cardsInZones = [...battle.hand.filter(Boolean), ...battle.draw, ...battle.spent];
        assert.equal(counts(cardsInZones), counts(run.deck), 'cards conserved during execution');
        assert.equal(counts([...battle.handIds.filter(id=>id!==null),...battle.drawIds,...battle.spentIds]),counts(run.deckIds),'IDs conserved during execution');
        if (battle.resolving && battle.resolving !== last) {
            seen.push(battle.resolving);
            last = battle.resolving;
        }
    }
    assert.deepEqual(seen,['Slash','Fireball','Iron Guard']);
    assert.equal(battle.phase,'enemy');
    assert.equal(battle.foes[0].hp,battle.foes[0].max-22-20);
    assert.equal(battle.barrier,22);
    assert.equal(run.hp,100);
    tickUntil(() => battle.phase === 'plan');
    assert.equal(run.hp,100);
    assert.equal(battle.barrier,0);
    assertCards();
});
test('guard survives until enemy and expires afterwards', () => {
    start();
    configureHand(['guard','slash','fire','dash','echo']);
    act([0]);
    assert.equal(run.hp,100);
    assert.equal(battle.barrier,0);
    configureHand(['slash','fire','dash','echo','frost']);
    act([0]);
    assert.ok(run.hp < 100);
});
test('fire and frost react consistently in either order', () => {
    start();
    configureHand(['frost','fire','slash','guard','dash']);
    act([0,1]);
    const forward = battle.foes[0].hp;
    const forwardCombos = run.stats.combos;
    start();
    configureHand(['frost','fire','slash','guard','dash']);
    act([1,0]);
    assert.equal(forward,battle.foes[0].hp);
    assert.equal(forwardCombos,run.stats.combos);
    assert.equal(forwardCombos,1);
});
test('boss defeat stops the rest of the combo and enemy response', () => {
    start();
    configureHand(['slash','fire','guard','dash','echo']);
    battle.foes[0].hp = 1;
    add(0); add(1); add(2);
    execute();
    tickUntil(() => battle.phase === 'clear');
    assert.equal(run.hp,100);
    assert.equal(battle.resolving,'Slash');
    assert.equal(battle.queue.length,0);
});

test('six two-element reactions are order-independent', () => {
    for (const [a,b,expected] of [['fire','frost','steam'],['fire','storm','overload'],['frost','storm','shatter'],['fire','fire','inferno'],['frost','frost','freeze'],['storm','storm','surge']]) {
        assert.equal(reaction(a,b),expected);
        assert.equal(reaction(b,a),expected);
    }
});
test('statuses stack to their cap and expire', () => {
    const values = {};
    for (let i=0;i<8;i++) applyStatus(values,'burn');
    assert.equal(stacks(values,'burn'),5);
    assert.equal(tickStatuses(values),15);
    assert.equal(tickStatuses(values),15);
    assert.equal(stacks(values,'burn'),0);
});
test('evolution increases size at level three', () => {
    start();
    assert.equal(cardSize('fire'),2);
    upgrade('fire'); assert.equal(cardSize('fire'),2);
    upgrade('fire'); assert.equal(cardSize('fire'),3);
});
test('selling removes only the selected instance', () => {
    start();
    const id = run.deckIds[0];
    const gold = run.gold;
    const before = run.deck.length;
    sellCard(id);
    assert.ok(!run.deckIds.includes(id));
    assert.equal(run.deck.length,before-1);
    assert.ok(run.gold > gold);
    assert.equal(new Set(run.deckIds).size,run.deckIds.length);
});

test('capacity accepts five small cards and rejects excess atomically', () => {
    start();
    configureHand(['slash','slash','dash','guard','echo']);
    battle.selected = [...battle.handIds];
    assert.equal(queueSelected(),true);
    assert.equal(battle.queue.length,5);
    battle.foes[0].hp = 1000;
    const executed = [];
    execute();
    let prior = -1;
    while (battle.phase === 'execute') {
        stepBattle(1/60);
        if (battle.activeSlot !== prior && battle.activeSlot >= 0) { executed.push(battle.resolving); prior=battle.activeSlot; }
    }
    assert.deepEqual(executed,['Slash','Slash','Dash Strike','Iron Guard','Arcane Echo']);
});
test('size three plus two fits and three twos require six capacity', () => {
    start();
    addCard('cleave');
    initBattle();
    configureHand(['cleave','fire','frost','fire','guard']);
    battle.selected = [battle.handIds[0],battle.handIds[1]];
    assert.equal(queueSelected(),true);
    assert.equal(battle.queue.length,2);
    start();
    configureHand(['fire','frost','fire','slash','guard']);
    battle.selected = battle.handIds.slice(0,3);
    assert.equal(queueSelected(),false);
    assert.equal(battle.queue.length,0);
    assert.equal(battle.selected.length,3);
    run.capacity = 6;
    assert.equal(queueSelected(),true);
    assert.equal(battle.queue.length,3);
});
test('targets lock per card and defeated targets fall back predictably', () => {
    reset(1,false);
    run.room='monster';
    initBattle();
    configureHand(['slash','slash','guard','fire','frost']);
    battle.target=1;
    add(0);
    battle.target=0;
    add(1);
    battle.foes[1].hp=1;
    execute();
    tickUntil(() => battle.phase==='enemy' || battle.phase==='clear');
    assert.equal(battle.foes[1].hp,0);
    assert.ok(battle.foes[0].hp < battle.foes[0].max);
});
test('silence blocks elemental cards but leaves swords available', () => {
    start();
    configureHand(['fire','slash','guard','dash','echo']);
    applyStatus(battle.statuses,'silence');
    battle.selected=[battle.handIds[0]];
    assert.equal(queueSelected(),false);
    battle.selected=[battle.handIds[1]];
    assert.equal(queueSelected(),true);
});



test('dodge and riposte respond once and expire', () => {
    start();
    configureHand(['dodge','riposte','slash','guard','fire']);
    const health = battle.foes[0].hp;
    act([0,1]);
    assert.equal(run.hp,100);
    assert.equal(battle.foes[0].hp,health-14);
    assert.equal(battle.dodges,0);
    assert.equal(battle.ripostes,0);
});
test('guard followed by riposte counters a blocked hit', () => {
    start();
    configureHand(['guard','riposte','slash','dash','fire']);
    const health = battle.foes[0].hp;
    act([0,1]);
    assert.equal(run.hp,100);
    assert.equal(battle.foes[0].hp,health-14);
});
test('upgrading a single copy preserves the other copy', () => {
    start();
    const ids = run.deckIds.filter((_,i)=>run.deck[i]==='fire');
    upgrade('fire',ids[1]); upgrade('fire',ids[1]);
    assert.equal(cardSize('fire',ids[0]),2);
    assert.equal(cardSize('fire',ids[1]),3);
});
test('last storm card sale frees its family', () => {
    start();
    assert.equal(addCard('storm'),-1);
    const riposte = run.deckIds[run.deck.indexOf('riposte')];
    sellCard(riposte);
    const id=addCard('storm');
    const before=run.deck.length;
    assert.ok(id > 0);
    sellCard(id);
    assert.equal(run.deck.length,before-1);
    assert.ok(!run.deck.includes('storm'));
});
test('boss silence prevents elemental selection for one turn only', () => {
    reset(2,false);
    run.room='boss';
    initBattle();
    battle.turn=3;
    configureHand(['guard','slash','fire','dash','echo']);
    act([0]);
    assert.ok(stacks(battle.statuses,'silence'));
    configureHand(['fire','slash','guard','dash','echo']);
    battle.selected=[battle.handIds[0]];
    assert.equal(queueSelected(),false);
    battle.selected=[battle.handIds[1]];
    assert.equal(queueSelected(),true);
    execute();
    tickUntil(()=>battle.phase==='plan' || battle.phase==='lost');
    assert.equal(stacks(battle.statuses,'silence'),0);
});

test('boss victories grant persistent capacity up to eight', () => {
    reset(1,false);
    for (const expected of [6,7,8]) {
        run.room='boss';
        completeRoom();
        assert.equal(run.capacity,expected);
    }
    assert.equal(run.result,'victory');
});
test('family cap rejects a new family until its slot is freed', () => {
    start();
    assert.equal(new Set(run.deck.map(cardFamily)).size,5);
    assert.equal(addCard('storm'),-1);
    sellCard(run.deckIds[run.deck.indexOf('riposte')]);
    assert.equal(new Set(run.deck.map(cardFamily)).size,4);
    assert.ok(addCard('storm') > 0);
    assert.equal(new Set(run.deck.map(cardFamily)).size,5);
});
test('selling safeguards retain eight cards and a guard', () => {
    start();
    while(run.deck.length>8) {
        const index=run.deck.findIndex(card=>card==='slash' || card==='dash');
        const id=run.deckIds[index>=0 ? index : 0];
        const before=run.deck.length;
        sellCard(id);
        if(run.deck.length===before) break;
    }
    assert.equal(run.deck.length,8);
    const gold=run.gold;
    sellCard(run.deckIds[0]);
    assert.equal(run.deck.length,8);
    assert.equal(run.gold,gold);
    assert.ok(run.deck.includes('guard'));
});
test('dodge stops one hit, not an entire multi-hit action', () => {
    reset(2,false); run.room='boss'; initBattle();
    configureHand(['dodge','slash','fire','guard','dash']);
    act([0]);
    assert.equal(run.hp,81);
});
test('stolen knight power applies armor break once per turn', () => {
    start();
    run.powers.push('knight');
    configureHand(['slash','slash','guard','fire','dash']);
    add(0); add(1); execute();
    tickUntil(()=>battle.phase==='enemy');
    assert.equal(stacks(battle.foes[0].statuses,'armorBreak'),1);
});
test('fire and storm reaction damages both enemies', () => {
    reset(1,false); run.room='monster';
    sellCard(run.deckIds[run.deck.indexOf('riposte')]);
    addCard('storm');
    initBattle();
    configureHand(['fire','storm','guard','slash','dash']);
    add(0);add(1);execute();
    tickUntil(()=>battle.phase==='enemy' || battle.phase==='clear');
    assert.equal(run.stats.combos,1);
    assert.ok(battle.foes[1].hp < battle.foes[1].max);
});
test('Glassheart adds six damage to a direct hit', () => {
    start();run.curses.push('glassheart');
    configureHand(['slash','guard','fire','dash','echo']);
    add(0);execute();tickUntil(()=>battle.phase==='enemy');
    assert.equal(battle.foes[0].hp,battle.foes[0].max-28);
});

test('evolved Fireball applies a stronger burn to its target', () => {
    start();
    configureHand(['fire','slash','guard','dash','echo']);
    const fireId=battle.handIds[0];
    upgrade('fire',fireId); upgrade('fire',fireId);
    add(0); execute();
    tickUntil(()=>battle.phase==='enemy');
    assert.equal(stacks(battle.foes[0].statuses,'burn'),2);
});

test('all six reactions resolve during actual combat', () => {
    const pairs=[['fire','frost','weaken'],['fire','storm',null],['frost','storm','armorBreak'],
        ['fire','fire','burn'],['frost','frost','chill'],['storm','storm',null]];
    for(const [first,second,status] of pairs) {
        start();
        sellCard(run.deckIds[run.deck.indexOf('riposte')]);
        addCard('storm');addCard('storm');
        initBattle();
        configureHand([first,second,'guard','slash','dash']);
        add(0);add(1);execute();
        tickUntil(()=>battle.phase==='enemy');
        assert.equal(run.stats.combos,1,first+' + '+second);
        if(status) assert.ok(stacks(battle.foes[0].statuses,status)>0,first+' + '+second);
    }
});
test('enemy silence and paralysis interrupt applicable attacks', () => {
    reset(2,false);run.room='boss';initBattle();
    applyStatus(battle.foes[0].statuses,'silence');
    configureHand(['slash','guard','fire','dash','echo']);
    act([0]);
    assert.equal(run.hp,100);
    start();
    applyStatus(battle.foes[0].statuses,'paralysis');
    configureHand(['slash','guard','fire','dash','echo']);
    act([0]);
    assert.equal(run.hp,100);
});
test('armor break increases incoming attack damage', () => {
    start();
    applyStatus(battle.statuses,'armorBreak');
    configureHand(['slash','guard','fire','dash','echo']);
    act([0]);
    assert.equal(run.hp,75);
});
test('stolen lich and overlord powers strengthen elemental statuses', () => {
    start();run.powers.push('lich');
    configureHand(['frost','guard','fire','dash','echo']);
    add(0);execute();tickUntil(()=>battle.phase==='enemy');
    assert.equal(stacks(battle.foes[0].statuses,'chill'),2);
    start();run.powers.push('overlord');
    configureHand(['fire','guard','frost','dash','echo']);
    add(0);execute();tickUntil(()=>battle.phase==='enemy');
    assert.equal(stacks(battle.foes[0].statuses,'burn'),2);
});
for (const archetype of [
    {name:'sword', cards:['slash','slash','slash','slash','dash','dash','cleave','guard','guard','guard','echo','echo']},
    {name:'elemental', cards:['fire','fire','frost','frost','storm','storm','guard','guard','slash','dash','echo','echo']},
    {name:'defensive', cards:['slash','slash','dash','dash','guard','guard','guard','guard','frost','fire','echo','echo']},
    {name:'heavy', cards:['cleave','cleave','cleave','slash','slash','dash','guard','guard','frost','fire','echo','echo']},
    {name:'refined', cards:['slash','dash','guard','guard','frost','fire','echo','riposte'], evolved:true},
    {name:'relic', cards:['slash','dash','guard','guard','frost','frost','fire','fire','echo','echo','dodge','riposte'], relic:true},
]) {
    for (let floor=1;floor<=3;floor++) for (const room of ['monster','boss']) {
        let wins=0, totalTurns=0, damage=0, discards=0;
        const usage = {};
        for (let seed=1;seed<=20;seed++) {
            game.rng.restore([seed*137+floor]);
            reset(floor,false);
            run.deck=[...archetype.cards];
            run.deckIds=run.deck.map((_,i)=>i+1000);
            run.levels={};
            if (archetype.evolved) { run.levels[1000]=3; run.levels[1004]=3; }
            if (archetype.relic) { run.relics=[0,1,2]; run.powers=['knight']; }
            run.room=room;
            initBattle();
            while (battle.phase==='plan' && battle.turn<=12) {
                const hit = battle.zones.reduce((sum,zone)=>sum+zone.damage,0);
                if (hit >= 20 && battle.pips > 0 && !battle.hand.includes('guard')) {
                    const redraw = battle.hand.map((card,i)=>({card,i})).filter(entry=>entry.card==='echo').map(entry=>entry.i);
                    if (redraw.length) discard(redraw);
                }
                const indices = battle.hand.map((card,i)=>({card,i})).filter(entry=>entry.card);
                const order = indices.sort((a,b) => {
                    const score = entry => entry.card==='guard' && hit>=20 ? 50 : entry.card==='echo' ? 0 : (entry.card==='slash'||entry.card==='dash'||entry.card==='cleave') ? 25 : 20;
                    return score(b)-score(a);
                });
                for (const item of order) {
                    battle.selected=[battle.handIds[item.i]];
                    if (queueSelected()) usage[item.card]=(usage[item.card]??0)+1;
                }
                execute();
                tickUntil(()=>battle.phase !== 'execute' && battle.phase !== 'enemy');
            }
            wins += Number(battle.phase==='clear');
            totalTurns += battle.turn;
            damage += 100-run.hp;
            discards += 3-battle.pips;
        }
        console.log('SIM '+archetype.name+' floor '+floor+' '+room+': wins '+wins+'/20, turns '+(totalTurns/20).toFixed(1)+', damage '+(damage/20).toFixed(1)+', discards '+(discards/20).toFixed(1)+'; usage '+JSON.stringify(usage));
    }
}
