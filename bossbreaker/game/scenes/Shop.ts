import { game } from '../engine.js';
import { buyGear, equipGear, GEAR, setCount, shopInventory, sellGear, unequipGear, type GearSlot } from '../equipment.js';
import { run } from '../run.js';
import { GOLD, INK, LOW, label, sprite } from '../ui/chrome.js';

export const Shop = {
    name:'shop',
    enter():void {
        game.ui.panel({anchor:'center',w:720,h:1280,z:80,safeArea:false,style:{fill:'#11101afa',radius:0,border:0,bevel:0,gloss:0,shadow:0}});
        label('WAYFARER SHOP',360,72,38,GOLD,'serif-bold','center',91);
        const gold=label('',360,128,24,INK,'mono-bold','center',91);
        const detail=label('Choose an item to inspect it.',360,845,21,INK,'sans-bold','center',91);
        const sets=label('',360,900,19,GOLD,'sans-bold','center',91);
        const notice=label('',360,945,20,LOW,'sans-bold','center',91);
        let selected='';
        const ids=[...shopInventory()];
        const rows=Array.from({length:6},(_,i)=>game.ui.button({anchor:'top-left',x:50,y:170+i*100,w:620,h:78,z:90,text:'',onClick:()=>{selected=ids[i]??'';update();}}));
        ids.forEach((id,i)=>sprite('icon-'+(GEAR[id].slot==='weapon' ? 'slash' : 'guard'),92,209+i*100,42,92));
        const update=():void => {
            gold.text='GOLD '+run.gold;
            rows.forEach((row,i)=>{const id=ids[i], item=GEAR[id]; row.ui.text=item ? item.name+' · '+(item.slot==='weapon'?'RARE':'UNCOMMON')+' · '+(run.gearOwned.includes(id)?'OWNED':item.price+' GOLD') : '';row.ui.disabled=!item;});
            const item=GEAR[selected];
            detail.text=item ? item.name+' · '+item.description : 'Choose an item to inspect it.';
            detail.scale=Math.min(1,60/Math.max(1,detail.text.length));
            sets.text='SENTINEL '+setCount('sentinel')+'/3 · EMBER '+setCount('ember')+'/3';
        };
        game.ui.button({anchor:'bottom',x:-140,y:-210,h:65,z:90,text:'Buy',onClick:()=>{notice.text=buyGear(selected)?'Purchased.':'Unavailable or not enough gold.';update();}});
        game.ui.button({anchor:'bottom',x:140,y:-210,h:65,z:90,text:'Equipment',onClick:()=>game.scenes.push('equipment')});
        game.ui.button({anchor:'bottom',y:-110,h:65,z:90,text:'Back to map',onClick:()=>game.scenes.pop()});
        update();
    },
};

export const Equipment = {
    name:'equipment',
    enter():void {
        game.ui.panel({anchor:'center',w:720,h:1280,z:100,safeArea:false,style:{fill:'#11101aff',radius:0,border:0,bevel:0,gloss:0,shadow:0}});
        label('EQUIPMENT',360,70,38,GOLD,'serif-bold','center',111);
        const info=label('',360,150,20,INK,'sans-bold','center',111);
        const setInfo=label('',360,200,19,GOLD,'sans-bold','center',111);
        const emberInfo=label('',360,230,19,GOLD,'sans-bold','center',111);
        const notice=label('',360,980,19,INK,'sans-bold','center',111);
        const help=label('Select an owned item to equip it.',360,925,20,LOW,'sans-bold','center',111);
        const compare=label('',360,950,18,INK,'sans-bold','center',111);
        const slots:GearSlot[]=['weapon','head','chest','legs'];
        let selected=''; let page=0; let pendingSale='';
        const rows=Array.from({length:6},(_,i)=>game.ui.button({anchor:'top-left',x:50,y:275+i*94,w:620,h:72,z:110,text:'',onClick:()=>{selected=run.gearOwned[page*6+i]??'';pendingSale='';update();}}));
        const update=():void=>{
            info.text=slots.map(slot=>slot.toUpperCase()+': '+(GEAR[run.equipped[slot]??'']?.name??'—')).join('  ·  ');
            info.scale=Math.min(1,67/Math.max(1,info.text.length));
            setInfo.text='SENTINEL '+setCount('sentinel')+'/3: 2 +4 Guard, 3 +6 Riposte';
            emberInfo.text='EMBER '+setCount('ember')+'/3: 2 +3 Fire, 3 +3 Sword';
            rows.forEach((row,i)=>{const id=run.gearOwned[page*6+i],item=GEAR[id];row.ui.text=item ? item.name+' · '+item.slot.toUpperCase()+(run.equipped[item.slot]===id?' · EQUIPPED':'') : ''; row.ui.hidden=!item;row.ui.disabled=!item;});
            if(selected && GEAR[selected]) { const slot=GEAR[selected].slot, old=GEAR[run.equipped[slot]??'']; help.text=GEAR[selected].name+' · '+GEAR[selected].description; compare.text='CURRENT '+(old?.name ?? 'none')+'  →  '+GEAR[selected].name; } else compare.text='';
            help.scale=Math.min(1,65/Math.max(1,help.text.length));
        };
        game.ui.button({anchor:'bottom',x:-220,y:-220,h:60,z:110,text:'Equip',onClick:()=>{const set=GEAR[selected]?.set;const before=set ? setCount(set) : 0;const ok=equipGear(selected);const after=set ? setCount(set) : 0;notice.text=ok && set && after>before && after>=2 ? 'SET BONUS ACTIVATED · '+set.toUpperCase()+' '+after+'/3' : ok ? 'Equipped.' : 'Choose an owned item.';if(ok)game.sound.play('select');update();}});
        game.ui.button({anchor:'bottom',x:0,y:-220,h:60,z:110,text:'Unequip',onClick:()=>{const slot=GEAR[selected]?.slot;notice.text=slot && unequipGear(slot)?'Unequipped.':'Select equipped gear.';update();}});
        game.ui.button({anchor:'bottom',x:220,y:-220,h:60,z:110,text:'Sell',onClick:()=>{if(!selected)return;if(pendingSale!==selected){pendingSale=selected;notice.text='Tap Sell again to confirm half-price sale.';return;}notice.text=sellGear(selected)?'Sold for half price.':'Unequip before selling.';pendingSale='';if(!run.gearOwned.includes(selected))selected='';update();}});
        game.ui.button({anchor:'bottom',x:-120,y:-120,h:60,z:110,text:'Next page',onClick:()=>{page=(page+1)%Math.max(1,Math.ceil(run.gearOwned.length/6));update();}});
        game.ui.button({anchor:'bottom',x:120,y:-120,h:60,z:110,text:'Close',onClick:()=>game.scenes.pop()});
        update();
    },
};
