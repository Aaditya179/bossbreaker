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
        const ids=(Object.keys(COMBOS) as ComboId[]).filter(id=>id!=='lunge');
        let page=0;
        const rows=Array.from({length:6},(_,i)=>({
            title:label('',48,205+i*145,23,GOLD,'sans-bold','left',111),
            recipe:label('',48,240+i*145,20,INK,'sans-bold','left',111),
            detail:label('',48,270+i*145,19,LOW,'sans-bold','left',111),
        }));
        const update=():void=>rows.forEach((row,i)=>{
            const id=ids[page*6+i], item=id?COMBOS[id]:null, known=id?discovered(id):false;
            row.title.text=item?(known?item.name.toUpperCase():'UNDISCOVERED'):'';
            row.recipe.text=item?(known?item.recipe:['cataclysm','bastion','meteorfall','absolute'].includes(id)?'Triple · all cards level 3+':'Experiment with elements.'):'';
            row.detail.text=item && known ? item.effect : '';
            row.detail.scale=Math.min(1,66/Math.max(1,row.detail.text.length));
        });
        game.ui.button({anchor:'bottom',x:-140,y:-30,h:68,z:110,text:'Next page',onClick:()=>{page=(page+1)%Math.ceil(ids.length/6);update();}});
        update();
        game.ui.button({anchor:'bottom',x:140,y:-30,h:68,z:110,text:'Back',onClick:()=>game.scenes.pop()});
    },
};
