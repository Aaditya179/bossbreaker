import type { Card, Element } from './run.js';
export type Reaction = 'steam'|'overload'|'firestorm'|'magma'|'shatter'|'blizzard'|'fortress'|'tempest'|'magnetic'|'sandstorm'|'inferno'|'freeze'|'surge'|'cataclysm'|'bastion'|'meteorfall'|'absolute';
export const TRIPLES: {id:Reaction;cards:[Element,Element,Element]}[] = [
    {id:'cataclysm',cards:['fire','wind','storm']}, {id:'bastion',cards:['earth','frost','wind']},
    {id:'meteorfall',cards:['fire','earth','fire']}, {id:'absolute',cards:['frost','storm','wind']},
];
const PAIRS: Record<string,Reaction> = {
    'fire:frost':'steam','fire:storm':'overload','fire:wind':'firestorm','earth:fire':'magma',
    'frost:storm':'shatter','frost:wind':'blizzard','earth:frost':'fortress','storm:wind':'tempest',
    'earth:storm':'magnetic','earth:wind':'sandstorm','fire:fire':'inferno','frost:frost':'freeze','storm:storm':'surge',
};
export function reaction(first: Card | null, second: Card): Reaction | null {
    if (!first) return null;
    return PAIRS[[first,second].sort().join(':')] ?? null;
}
// Triples take precedence over the two pairs wholly inside them; adjacent pairs
// crossing the boundary remain valid. No card can belong to two triples.
export function planReactions(cards:Card[],levels:number[]):(Reaction|null)[] {
    const out:(Reaction|null)[]=cards.map(()=>null), used=new Set<number>(), group=cards.map(()=>-1);
    for(let i=0;i+2<cards.length;i++) {
        const triple=TRIPLES.find(t=>t.cards.every((card,j)=>cards[i+j]===card));
        if(triple && [0,1,2].every(j=>(levels[i+j]??1)>=3 && !used.has(i+j))) {
            out[i+2]=triple.id; used.add(i); used.add(i+1); used.add(i+2); group[i]=group[i+1]=group[i+2]=i; i+=2;
        }
    }
    for(let i=1;i<cards.length;i++) if(!(group[i]>=0 && group[i-1]===group[i])) out[i]=reaction(cards[i-1],cards[i]);
    return out;
}
