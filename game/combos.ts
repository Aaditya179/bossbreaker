import { game } from './engine.js';
import type { Reaction } from './elements.js';
export type ComboId = Reaction | 'lunge';
export const COMBOS: Record<ComboId,{name:string;recipe:string;effect:string}> = {
 lunge:{name:'Lunging Cleave',recipe:'Dash → Slash',effect:'Legacy sword combination.'},
 steam:{name:'Steam Burst',recipe:'Fire + Frost',effect:'7 area damage and Weaken.'},
 overload:{name:'Overload',recipe:'Fire + Storm',effect:'6 area damage; 15% chance of +5.'},
 firestorm:{name:'Firestorm',recipe:'Fire + Wind',effect:'6 area damage and Burn.'},
 magma:{name:'Magma Armor',recipe:'Fire + Earth',effect:'12 barrier; counter for 8 and Burn.'},
 shatter:{name:'Shatter',recipe:'Frost + Storm',effect:'8 target damage and Armor Break.'},
 blizzard:{name:'Blizzard',recipe:'Frost + Wind',effect:'5 area damage and Chill.'},
 fortress:{name:'Glacial Fortress',recipe:'Frost + Earth',effect:'20 barrier; resist the next debuff.'},
 tempest:{name:'Tempest',recipe:'Storm + Wind',effect:'Two 4-damage strikes, chaining when possible.'},
 magnetic:{name:'Magnetic Field',recipe:'Storm + Earth',effect:'10 barrier and 10 counter.'},
 sandstorm:{name:'Sandstorm',recipe:'Wind + Earth',effect:'Evade one hit and 5 area damage.'},
 inferno:{name:'Inferno',recipe:'Fire + Fire',effect:'Add Burn.'}, freeze:{name:'Deep Freeze',recipe:'Frost + Frost',effect:'Add Chill.'},
 surge:{name:'Static Surge',recipe:'Storm + Storm',effect:'6 area damage.'},
 cataclysm:{name:'Cataclysm',recipe:'Fire → Wind → Storm',effect:'20 area damage and Burn. All cards level 3+.'},
 bastion:{name:'Crystal Bastion',recipe:'Earth → Frost → Wind',effect:'35 barrier and 15 counter. All cards level 3+.'},
 meteorfall:{name:'Meteorfall',recipe:'Fire → Earth → Fire',effect:'24 area damage and Burn. All cards level 3+.'},
 absolute:{name:'Absolute Tempest',recipe:'Frost → Storm → Wind',effect:'Two 10-damage strikes, Chill and Weaken. All cards level 3+.'},
};
const KEY='bossbreaker.combos.v1';
export function discoveries(): string[] { return game.save.read(KEY, [] as string[]); }
export function discovered(id: ComboId): boolean { return discoveries().includes(id); }
export function discover(id: ComboId): boolean { const known=discoveries(); if(known.includes(id)) return false; game.save.write(KEY,[...known,id]); return true; }
export function resetDiscoveries(): void { game.save.write(KEY,[]); }
