import { game } from '../engine.js';
import { CARDS, cardLevel, cardRarity, cardSize, type Card, type Rarity } from '../run.js';
import { preferences } from './preferences.js';
import { GOLD, HOT, INK, label } from './chrome.js';
export const RARITY_COLORS:Record<Rarity,string>={Common:'#c0bdc8',Uncommon:'#75d596',Rare:'#79baff',Epic:'#c792ff',Mythical:'#f18ad7',Legendary:'#ffce68',Cursed:'#d85771'};
export function cardVisual(x:number,y:number,width=108,id='card',z=1,onTap?:()=>void) {
    const factor=width/108;
    const base=game.spawn({id,texture:'card-slash',x,y,width,layer:'hud',z,pointer:onTap?{onTap,onOver:e=>{if(!preferences.reducedMotion)game.tween.to(e.target,{rot:0.07},{duration:0.16,ease:'easeOutQuad'});},onOut:e=>{if(!preferences.reducedMotion)game.tween.to(e.target,{rot:0},{duration:0.18,ease:'easeOutBack'});}}:undefined});
    const icon=game.spawn({id:id+'-icon',texture:'icon-slash',x,y:y-4*factor,width:46*factor,layer:'hud',z:z+1});
    const name=label('',x,y-46*factor,21*factor,INK,'sans-bold','center',z+2);
    const effect=label('',x,y+49*factor,15*factor,INK,'sans-bold','center',z+2);
    const badge=label('',x+38*factor,y-62*factor,20*factor,GOLD,'mono-bold','center',z+2);
    const discardMark=label('×',x+40*factor,y+39*factor,21*factor,HOT,'mono-bold','center',z+2);
    const inspectMark=label('ⓘ',x-36*factor,y-55*factor,18*factor,INK,'sans-bold','center',z+2);
    const rarity=label('',x,y+23*factor,11*factor,INK,'mono-bold','center',z+2);
    const show=(card:Card|null,instance?:number):void=>{
        base.visible=icon.visible=name.visible=effect.visible=rarity.visible=Boolean(card);
        badge.visible=discardMark.visible=inspectMark.visible=false;
        if (!card) return;
        base.texture='card-'+card; icon.texture='icon-'+card;
        name.text=CARDS[card].name; name.scale=Math.min(1,13/Math.max(1,name.text.length));
        name.color=CARDS[card].color;
        effect.text='LV '+cardLevel(instance)+' · SIZE '+cardSize(card,instance);
        rarity.text=cardRarity(card).toUpperCase();rarity.color=RARITY_COLORS[cardRarity(card)];
    };
    return {base,icon,name,effect,badge,discardMark,inspectMark,rarity,show};
}
