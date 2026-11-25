import { game } from './engine.js';
import { run } from './run.js';
export type GearSlot = 'weapon'|'head'|'chest'|'legs';
export type Gear = {name:string;slot:GearSlot;price:number;set?:'sentinel'|'ember';description:string};
export const GEAR:Record<string,Gear> = {
    blade:{name:'Runed Sword',slot:'weapon',price:24,description:'Sword cards deal 4 more damage.'},
    wand:{name:'Ash Wand',slot:'weapon',price:24,description:'Elemental cards deal 3 more damage.'},
    sentinel_helm:{name:'Sentinel Helm',slot:'head',price:18,set:'sentinel',description:'Iron Sentinel armor.'},
    sentinel_mail:{name:'Sentinel Mail',slot:'chest',price:22,set:'sentinel',description:'Iron Sentinel armor.'},
    sentinel_greaves:{name:'Sentinel Greaves',slot:'legs',price:18,set:'sentinel',description:'Iron Sentinel armor.'},
    ember_helm:{name:'Ember Helm',slot:'head',price:18,set:'ember',description:'Ember Knight armor.'},
    ember_mail:{name:'Ember Mail',slot:'chest',price:22,set:'ember',description:'Ember Knight armor.'},
    ember_greaves:{name:'Ember Greaves',slot:'legs',price:18,set:'ember',description:'Ember Knight armor.'},
};
export function setCount(set:'sentinel'|'ember'):number {
    return (['head','chest','legs'] as GearSlot[]).filter(slot=>GEAR[run.equipped[slot] ?? '']?.set===set).length;
}
export function gearBonus(card:string):number {
    let amount=0;
    if (['slash','dash','cleave','sovereign','immolate'].includes(card) && run.equipped.weapon==='blade') amount+=4;
    if (['fire','frost','storm'].includes(card) && run.equipped.weapon==='wand') amount+=3;
    if (card==='guard' && setCount('sentinel')>=2) amount+=4;
    if (card==='riposte' && setCount('sentinel')>=3) amount+=6;
    if (card==='fire' && setCount('ember')>=2) amount+=3;
    if (['slash','dash','cleave','sovereign','immolate'].includes(card) && setCount('ember')>=3) amount+=3;
    return amount;
}
export function equipGear(id:string):boolean {
    if (game.scenes.stack?.includes('play') || !run.gearOwned.includes(id) || !GEAR[id]) return false;
    run.equipped[GEAR[id].slot]=id; return true;
}
export function unequipGear(slot:GearSlot):boolean {
    if (game.scenes.stack?.includes('play') || !run.equipped[slot]) return false;
    run.equipped[slot]=null; return true;
}
export function shopInventory():string[] {
    const key=run.floor+':'+run.path.length;
    if (run.shopKey!==key) { run.shopKey=key; run.shopStock=game.rng.shuffle(Object.keys(GEAR)).slice(0,6); }
    return run.shopStock;
}
export function buyGear(id:string):boolean {
    const item=GEAR[id];
    if (!item || game.scenes.stack?.includes('play') || !shopInventory().includes(id) || run.gearOwned.includes(id) || run.gold<item.price) return false;
    run.gold-=item.price; run.gearOwned.push(id); run.shopStock=run.shopStock.filter(entry=>entry!==id); return true;
}
export function sellGear(id:string):boolean {
    if (game.scenes.stack?.includes('play') || !run.gearOwned.includes(id) || !GEAR[id] || Object.values(run.equipped).includes(id)) return false;
    run.gearOwned=run.gearOwned.filter(item=>item!==id); run.gold+=Math.floor(GEAR[id].price/2); return true;
}
