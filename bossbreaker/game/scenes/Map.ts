import { game } from '../engine.js';
import { initBattle } from '../arena.js';
import { BOSSES, connected, RELICS, ROOMS, run, type Node } from '../run.js';
import { backdrop, floorHeading, GOLD, INK, label, LOW, menuInput, sprite, topButtons } from '../ui/chrome.js';

const NODE_Y = 934;
const ROW_GAP = 156;
const LANE_GAP = 181;
const position = (n: Node) => ({ x: 360+LANE_GAP*n.lane, y: NODE_Y-ROW_GAP*n.row });

export function openNode(node: Node): void {
    run.node = node;
    run.room = node.room;
    if (node.room === 'treasure' || node.room === 'campfire') game.scenes.go(node.room);
    else {
        initBattle();
        game.scenes.go('play');
    }
}

export const Map = {
    name: 'map',
    enter(): void {
        backdrop();
        floorHeading('DUNGEON MAP   /   FLOOR 0'+run.floor, ['Sunken Crypt','Frostbound Vaults','Abyssal Sanctum'][run.floor-1]);
        topButtons();
        label('Choose a connected room and climb toward the crown.',40,164,23,LOW,'sans-bold','left');
        const floor = sprite('panel',360,638,656,0,'map-panel');
        floor.height = 833;
        const grid = game.graphics({ layer: 'hud' });
        grid.handle.z = 1;
        const current = run.path.at(-1);
        for (const a of run.map) for (const b of run.map.filter(node => connected(a,node))) {
            const from = position(a), to = position(b);
            const active = a === current || (run.path.includes(a) && run.path.includes(b));
            grid.draw(c => {
                c.strokeStyle = active ? '#cd9f77' : '#574957';
                c.lineWidth = active ? 4 : 3;
                c.setLineDash([8,7]);
                c.beginPath(); c.moveTo(from.x,from.y); c.lineTo(to.x,to.y); c.stroke();
            });
        }
        const entries: Parameters<typeof menuInput>[0] = [];
        for (const node of run.map) {
            const { x, y } = position(node);
            const active = connected(current,node);
            const passed = run.path.includes(node);
            const activate = () => { game.sound.play('select'); openNode(node); };
            const art = game.spawn({
                id: 'map-'+node.room+'-'+node.row, texture: 'node', x, y, layer: 'hud', z: 2, frame: active || passed ? 1 : 0,
                pointer: active ? { onTap: activate, onOver: e => e.target.tint = '#ffe0a5', onOut: e => e.target.tint = '#ffffff' } : undefined,
            });
            if (active) entries.push({ art, activate });
            const icon = sprite('icon-'+node.room,x,y-9,56,3);
            if (!active && !passed) icon.alpha = 0.65;
            label(passed ? 'CLEARED' : active ? 'ENTER' : ROOMS[node.room].toUpperCase(),x,y+34,15,active ? GOLD : LOW,'mono-bold');
            if (active) label(node.room === 'boss' ? BOSSES[run.floor-1] : ROOMS[node.room],x,y+73,20);
        }
        sprite('icon-heart',72,1123,32);
        label(run.hp+' / '+run.maxHp,98,1123,25,INK,'mono-bold','left');
        label(run.deck.length+' cards',357,1123,23,INK,'mono-bold');
        label(run.relics.length+' relics',632,1123,23,GOLD,'mono-bold','right');
        label(run.relics.length ? run.relics.map(id => RELICS[id].name).join('   /   ') : 'Treasure vaults grant relics for the rest of the run.',360,1190,21,LOW);
        menuInput(entries);
    },
};
