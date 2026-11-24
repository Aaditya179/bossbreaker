import { game } from '../engine.js';
import { GOLD, INK, label } from '../ui/chrome.js';

export const Elements = {
    name:'elements',
    enter(): void {
        game.ui.panel({anchor:'center',w:720,h:1280,z:110,safeArea:false,
            style:{fill:'#11101aff',radius:0,border:0,bevel:0,gloss:0,shadow:0}});
        label('ELEMENTAL REACTIONS',360,90,34,GOLD,'serif-bold','center',111);
        label('Play two elemental cards consecutively.',360,150,22,INK,'sans-bold','center',111);
        label('Either order works. The second card also has its normal effect.',360,188,19,INK,'sans-bold','center',111);
        const rows = [
            ['FIRE + FROST  ·  STEAM','10 damage to each enemy and apply Weaken.'],
            ['FIRE + STORM  ·  OVERLOAD','8 damage to each enemy.'],
            ['FROST + STORM  ·  SHATTER','10 extra damage and apply Armor Break.'],
            ['FIRE + FIRE  ·  INFERNO','Apply an additional Burn stack.'],
            ['FROST + FROST  ·  DEEP FREEZE','Apply an additional Chill stack.'],
            ['STORM + STORM  ·  STATIC SURGE','8 damage to each enemy.'],
        ];
        rows.forEach(([title,detail],i) => {
            const y=285+i*130;
            label(title,48,y,23,GOLD,'sans-bold','left',111);
            label(detail,48,y+40,20,INK,'sans-bold','left',111);
        });
        game.ui.button({anchor:'bottom',y:-32,h:68,z:110,text:'Back',onClick:()=>game.scenes.pop()});
    },
};
