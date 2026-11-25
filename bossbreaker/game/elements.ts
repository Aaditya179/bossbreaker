import type { Card } from './run.js';
export type Reaction = 'steam' | 'thermal' | 'overload' | 'shatter' | 'inferno' | 'freeze' | 'surge';
export function reaction(first: Card | null, second: Card): Reaction | null {
    if (first === 'fire' && second === 'fire') return 'inferno';
    if (first === 'frost' && second === 'frost') return 'freeze';
    if (first === 'storm' && second === 'storm') return 'surge';
    if (first === 'fire' && second === 'frost') return 'steam';
    if (first === 'frost' && second === 'fire') return 'thermal';
    if ((first === 'fire' && second === 'storm') || (first === 'storm' && second === 'fire')) return 'overload';
    if ((first === 'frost' && second === 'storm') || (first === 'storm' && second === 'frost')) return 'shatter';
    return null;
}
