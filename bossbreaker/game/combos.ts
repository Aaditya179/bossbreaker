import { game } from './engine.js';
import type { Reaction } from './elements.js';

export type ComboId = Reaction | 'lunge';
export const COMBOS: Record<ComboId,{name:string;recipe:string;effect:string}> = {
    lunge:{name:'Lunging Cleave',recipe:'Dash Strike → Slash',effect:'Slash deals 8 bonus damage to every enemy.'},
    steam:{name:'Steam Burst',recipe:'Fire → Frost',effect:'10 area damage and Weaken.'},
    thermal:{name:'Thermal Shock',recipe:'Frost → Fire',effect:'14 bonus damage to the target.'},
    overload:{name:'Overload',recipe:'Fire + Storm (either order)',effect:'8 area damage; 15% chance of 5 extra area damage.'},
    shatter:{name:'Shatter',recipe:'Frost + Storm (either order)',effect:'10 bonus damage and Armor Break.'},
    inferno:{name:'Inferno',recipe:'Fire → Fire',effect:'Apply an additional Burn stack.'},
    freeze:{name:'Deep Freeze',recipe:'Frost → Frost',effect:'Apply an additional Chill stack.'},
    surge:{name:'Static Surge',recipe:'Storm → Storm',effect:'8 damage to each enemy.'},
};
const KEY='bossbreaker.combos.v1';
export function discoveries(): string[] { return game.save.read(KEY, [] as string[]); }
export function discovered(id: ComboId): boolean { return discoveries().includes(id); }
export function discover(id: ComboId): boolean {
    const known=discoveries();
    if (known.includes(id)) return false;
    game.save.write(KEY,[...known,id]);
    return true;
}
export function resetDiscoveries(): void { game.save.write(KEY,[]); }
