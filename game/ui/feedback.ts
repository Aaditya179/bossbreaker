import { game } from '../engine.js';
import type { CombatEvent } from '../arena.js';
import { preferences } from './preferences.js';
import { label, GOLD, INK } from './chrome.js';

// Presentation-only presets. They consume resolved events and never run combat rules.
const PRESETS = {
    card: {duration:0.22, color:INK},
    damage: {duration:0.62, color:'#fff0cf'},
    critical: {duration:0.85, color:'#ffe18b'},
    combo: {duration:0.72, color:GOLD},
    status: {duration:0.65, color:'#a7e9ff'},
    block: {duration:0.65, color:'#a7e9ff'},
    echo: {duration:0.72, color:'#dfb7ff'},
} as const;

export function combatFeedback(targetAt:(index:number)=>{x:number;y:number}) {
    let source:CombatEvent[] | null=null;
    let cursor=0, total=0, current='', lastCombo='', target='', turnActive=false, now=0, shakeUntil=0, freezeUntil=0, ultimateUntil=0;
    const summary=label('',360,658,22,INK,'mono-bold','center',8);
    const banner=label('',360,368,34,GOLD,'serif-bold','center',9);
    banner.alpha=0;
    function show(event:CombatEvent): void {
        if (!preferences.reducedMotion && (event.kind==='combo' || event.kind==='damage' && event.critical)) { shakeUntil=Math.max(shakeUntil,now+0.13); if (now>=freezeUntil) freezeUntil=now+0.06; }
        if (event.kind==='card') { current=event.text; target=event.target === undefined || event.target < 0 ? 'SELF' : 'FOE '+(event.target+1); turnActive=true; }
        if (event.kind==='damage' && event.phase==='execute') total+=event.amount ?? 0;
        if (event.kind==='combo' || event.kind==='echo') {
            lastCombo=event.text;
            const ultimate=['CATACLYSM','CRYSTAL BASTION','METEORFALL','ABSOLUTE TEMPEST'].includes(event.text);
            if (ultimate || now>=ultimateUntil) {
                if (ultimate) ultimateUntil=now+0.95;
                banner.text=event.text; banner.color=event.color ?? GOLD;
                banner.alpha=1; banner.scale=1;
                if (!preferences.reducedMotion) game.tween.from(banner,{scale:0.83},{duration:0.18,ease:'easeOutBack'});
                game.tween.to(banner,{alpha:0},{duration:ultimate ? 0.95 : PRESETS.combo.duration});
            } else {
                const proc=label(event.text,140,370,19,event.color ?? GOLD,'mono-bold','center',10);
                game.tween.to(proc,{y:345,alpha:0},{duration:0.7,onComplete:()=>proc.destroy()});
            }
        }
        if (event.kind==='damage' || event.kind==='status' || event.kind==='block') {
            const at=event.target === undefined || event.target < 0 ? {x:140,y:482} : targetAt(event.target);
            const preset=event.kind==='damage' && event.critical ? PRESETS.critical : PRESETS[event.kind];
            const message=event.kind==='damage' ? (event.critical ? 'CRITICAL! ' : event.text==='POISON' || event.text==='BURN' ? event.text+' ' : '')+String(event.amount ?? 0) : event.text+(event.amount ? ' '+event.amount : '');
            const y=at.y-70-(cursor%4)*24;
            const text=label(message,at.x+(event.kind==='damage' ? 50 : -50),y,event.critical?29:23,event.color ?? preset.color,'mono-bold','center',10);
            if (!preferences.reducedMotion) game.tween.from(text,{scale:0.7},{duration:0.12,ease:'easeOutBack'});
            game.tween.to(text,{y:y-(preferences.reducedMotion ? 0 : 48),alpha:0},{duration:preset.duration,onComplete:()=>text.destroy()});
        }
    }
    return (events:CombatEvent[],phase:string,sequenceLength:number,time:number):{shake:number;frozen:boolean} => {
        now=time;
        if (source!==events) { source=events; cursor=0; total=0; current=''; lastCombo=''; turnActive=false; }
        while (cursor<events.length) show(events[cursor++]);
        summary.visible=turnActive && (phase==='execute' || phase==='enemy' || phase==='clear');
        summary.text=current ? 'CARD '+Math.min(sequenceLength,events.filter(e=>e.kind==='card').length)+'/'+sequenceLength+'  '+current.toUpperCase()+' → '+target+'  ·  '+total+' DAMAGE' : '';
        summary.scale=Math.min(1,58/Math.max(1,summary.text.length));
        if (phase==='plan') { total=0; current=''; lastCombo=''; turnActive=false; }
        return {shake: now < shakeUntil && preferences.shake > 0 ? Math.sin(now*95)*(preferences.shake===1 ? 2 : 4) : 0, frozen:now<freezeUntil};
    };
}
