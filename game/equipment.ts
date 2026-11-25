import { game } from './engine.js';
import { addCard, CARDS, ELEMENTS, run, type Element } from './run.js';
export type GearSlot = 'weapon'|'head'|'chest'|'legs';
export type Gear = {name:string;slot:GearSlot;price:number;set?:'sentinel'|'ember';description:string};
export const GEAR:Record<string,Gear> = {
    blade:{name:'Gale Staff',slot:'weapon',price:24,description:'Wind and Storm deal 4 more damage.'},
    wand:{name:'Ash Wand',slot:'weapon',price:24,description:'Fire, Frost and Earth deal 3 more damage.'},
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
    if (['wind','storm'].includes(card) && run.equipped.weapon==='blade') amount+=4;
    if (['fire','frost','earth'].includes(card) && run.equipped.weapon==='wand') amount+=3;
    if (card==='fire' && setCount('ember')>=2) amount+=3;
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
    if (run.shopKey!==key) { run.shopKey=key; run.shopStock=[...game.rng.shuffle(Object.keys(GEAR)).slice(0,3),...game.rng.shuffle(ELEMENTS.filter(element=>run.mastery[element]>0)).slice(0,3).map(card=>'card:'+card)]; }
    return run.shopStock;
}
export function buyGear(id:string):boolean {
    const item=GEAR[id];
    if (!item || game.scenes.current !== 'shop' || !shopInventory().includes(id) || run.gearOwned.includes(id) || run.gold<item.price) return false;
    run.gold-=item.price; run.gearOwned.push(id); run.shopStock=run.shopStock.filter(entry=>entry!==id); return true;
}
export function sellGear(id:string):boolean {
    if (!game.scenes.stack?.includes('shop') || !run.gearOwned.includes(id) || !GEAR[id] || Object.values(run.equipped).includes(id)) return false;
    run.gearOwned=run.gearOwned.filter(item=>item!==id); run.gold+=Math.floor(GEAR[id].price/2); return true;
}

export function shopItem(id:string): {name:string;slot:string;price:number;description:string;icon:string} | null {
    if(id.startsWith('card:')) { const card=id.slice(5) as Element; if(!(ELEMENTS as readonly string[]).includes(card))return null; return {name:CARDS[card].name,slot:'card',price:18,description:CARDS[card].tip,icon:card}; }
    const item=GEAR[id];return item ? {...item,icon:item.slot==='weapon'?'storm':'earth'} : null;
}
export function buyShopItem(id:string):boolean {
    if(!id.startsWith('card:'))return buyGear(id);
    const item=shopItem(id);
    if(!item || game.scenes.current!=='shop' || !shopInventory().includes(id) || run.gold<item.price)return false;
    const card=id.slice(5) as Element;
    if(addCard(card)<0)return false;
    run.gold-=item.price;run.shopStock=run.shopStock.filter(entry=>entry!==id);run.stats.cards++;return true;
}
