import { game } from './engine.js';
import { battle, FOES, initBattle, winBattle } from './arena.js';
import { addCard, CARDS, endRun, grant, MAX_HP, PIPS, reset, run, type Card, type Item, type Room } from './run.js';

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z]/g,'');
const argText = (parts: string[]): string => parts.join(' ');
const floor = (value: string | undefined): number => Math.max(1,Math.min(3,Math.floor(Number(value) || 1)));
const rooms: Room[] = ['monster','cursed','treasure','campfire','boss'];
const items: Item[] = ['heart-gem','relic-charm','card-scroll'];
let initialized = false;

function arena(room: Room, enemy?: Parameters<typeof initBattle>[0]): void {
    run.node = null;
    run.room = room;
    if (room === 'campfire' || room === 'treasure') game.scenes.go(room);
    else {
        initBattle(enemy);
        game.scenes.go('play');
    }
}

export function addDebugControls(): void {
    game.inspect.state(() => ({ run, battle }));
    const add = (name: string, does: string, args: string, action: (...parts: string[]) => string): void => {
        game.cheats.add({ name, does, args, run: (...parts) => {
            if (!initialized && !run.map.length) reset();
            initialized = true;
            return action(...parts);
        } });
    };
    add('level','Jump to a floor map','n',n=>{reset(floor(n));game.scenes.go('map');return 'Floor '+run.floor;});
    add('boss','Jump to a floor boss','n',n=>{reset(floor(n));arena('boss');return 'Boss on floor '+run.floor;});
    add('room','Open a room on this floor','type',name=>{
        const room = rooms.find(known=>known===name);
        if (!room) return 'Use '+rooms.join(', ');
        arena(room);
        return 'Room '+room;
    });
    add('enemy','Fight one named enemy','name',(...parts)=>{
        const name = normalize(argText(parts));
        const id = (['slime','archer','gargoyle'] as const).find(id => normalize(FOES[id].name)===name || id===name);
        if (!id) return 'Use Crypt Slime, Bone Archer or Gargoyle Sentinel';
        arena('monster',id);
        return FOES[id].name;
    });
    add('screen','Show an outcome screen','name',name=>{
        if (name !== 'victory' && name !== 'game-over') return 'Use victory or game-over';
        reset(name==='victory'?3:run.floor);
        if (name==='victory') {run.stats.bosses++;run.stats.rooms++;}
        endRun(name);
        return name;
    });
    add('give-card','Add a card to the deck and active hand','card',(...parts)=>{
        const name = normalize(argText(parts));
        const id = (Object.keys(CARDS) as Card[]).find(id=>normalize(CARDS[id].name)===name || id===name);
        if (!id) return 'Unknown card';
        const cardId = addCard(id);
        if (cardId < 0) return 'No card family slot available';
        run.stats.cards++;
        if (game.scenes.current === 'play') {
            if (battle.phase === 'plan') {
                const slot = battle.hand.findIndex((_,i)=>!battle.queue.includes(battle.handIds[i]!));
                const previous = battle.hand[slot];
                if (previous) { battle.spent.push(previous); battle.spentIds.push(battle.handIds[slot]!); }
                battle.hand[slot] = id;
                battle.handIds[slot] = cardId;
            } else { battle.draw.unshift(id); battle.drawIds.unshift(cardId); }
        }
        return 'Added '+CARDS[id].name;
    });
    add('give','Grant an item','item',name=>{
        const item = items.find(known=>known===name);
        return item ? grant(item) : 'Use '+items.join(', ');
    });
    add('heal','Restore full health','',()=>{run.hp=run.maxHp;return 'Health restored';});
    add('discard-pips','Refill three discard pips','',()=>{battle.pips=PIPS;return 'Pips restored';});
    const toggles = {'infinite-health':'infiniteHealth','invincible':'invincible','infinite-pips':'infinitePips','one-hit-kills':'oneHit'} as const;
    for (const name of Object.keys(toggles) as (keyof typeof toggles)[]) {
        add(name,'Toggle '+name,'on|off',value=>{
            if (value!=='on' && value!=='off') return 'Use on or off';
            run.cheats[toggles[name]]=value==='on';
            return name+' '+value;
        });
    }
    add('win-room','Clear the active encounter','',()=>{
        if (game.scenes.current !== 'play') return 'Open an arena first';
        winBattle();
        return 'Room cleared';
    });
    add('lose-run','End the active run','',()=>{endRun('game-over');return 'Run ended';});
}
