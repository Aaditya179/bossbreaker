import { game } from '../engine.js';
import { COMBOS, discovered, type ComboId } from '../combos.js';
import { GOLD, INK, LOW, label } from '../ui/chrome.js';

export const Elements = {
    name:'elements',
    enter(): void {
        game.ui.panel({anchor:'center',w:720,h:1280,z:110,safeArea:false,
            style:{fill:'#11101aff',radius:0,border:0,bevel:0,gloss:0,shadow:0}});
        label('COMBO COLLECTION',360,78,34,GOLD,'serif-bold','center',111);
        label('Discover reactions by triggering them in battle.',360,132,20,INK,'sans-bold','center',111);
        (Object.keys(COMBOS) as ComboId[]).forEach((id,i) => {
            const item=COMBOS[id], known=discovered(id), y=195+i*116;
            label(known ? (id === 'lunge' ? 'SWORD · ' : 'ELEMENT · ')+item.name.toUpperCase() : (id === 'lunge' ? 'SWORD' : 'ELEMENT')+' · UNDISCOVERED',48,y,23,known ? GOLD : LOW,'sans-bold','left',111);
            if (known) {
                label(item.recipe,48,y+32,20,INK,'sans-bold','left',111);
                const detail=label(item.effect,48,y+61,19,LOW,'sans-bold','left',111);
                detail.scale=Math.min(1,66/Math.max(1,item.effect.length));
            } else label('Experiment with card order.',48,y+37,19,LOW,'sans-bold','left',111);
        });
        game.ui.button({anchor:'bottom',y:-30,h:68,z:110,text:'Back',onClick:()=>game.scenes.pop()});
    },
};
