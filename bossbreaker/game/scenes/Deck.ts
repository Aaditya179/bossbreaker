import { cardVisual } from '../ui/cards.js';
import { game } from '../engine.js';
import { battle } from '../arena.js';
import { CARDS, cardFamily, cardLevel, cardRarity, cardSize, evolutionEffect, RELICS, run, saleValue, sellCard, type Card } from '../run.js';
import { GOLD, INK, label, LOW } from '../ui/chrome.js';



export const Deck = {
    name:'deck',
    enter(): void {
        const shade=game.graphics({layer:'hud',x:360,y:640,width:720,height:1280});
        shade.handle.z=79; shade.draw(c=>{c.fillStyle='#11101af8';c.fillRect(0,0,720,1280);});
        game.ui.panel({ anchor:'center', w:720, h:1280, z:80, safeArea:false,
            style:{ fill:'#00000000',radius:0,border:0,bevel:0,gloss:0,shadow:0 } });
        label('YOUR DECK',360,90,46,GOLD,'serif-bold','center',91);
        const combat = game.scenes.stack.includes('play');
        const canSell = !combat && !game.scenes.stack.includes('reward');
        const summary = label('',360,150,22,INK,'mono-bold','center',91);
        const families = label('',360,185,18,LOW,'sans-bold','center',91);
        const hand = label('',360,815,20,INK,'sans-bold','center',91);
        const queued = label('',360,855,20,INK,'sans-bold','center',91);
        const detail = label('Select a card to inspect it.',360,920,22,INK,'sans-bold','center',91);
        const copy = label('',360,966,20,GOLD,'mono-bold','center',91);
        const evolution = label('',360,997,18,GOLD,'sans-bold','center',91);
        const sale = label('',360,1030,20,LOW,'sans-bold','center',91);
        let selected: Card | null = null;
        let selectedId = -1;
        let confirm = false;
        let relicCursor = -1;
        let types = (Object.keys(CARDS) as Card[]).filter(card => run.deck.includes(card));
        let page = 0;
        const rows = Array.from({length:6},(_,i) => {
            const x=140+(i%3)*220, y=320+Math.floor(i/3)*245;
            return cardVisual(x,y,145,'deck-card-'+i,90,()=>{
                const id=types[page*6+i]; if (!id) return;
                selected=id; selectedId=run.deckIds[run.deck.indexOf(id)] ?? -1; confirm=false; update();
            });
        });
        let sortMode=0, familyIndex=0;
        const refreshTypes=():void=>{
            const families=['',...new Set(run.deck.map(cardFamily))]; familyIndex%=families.length;
            types=(Object.keys(CARDS) as Card[]).filter(card=>run.deck.includes(card) && (!families[familyIndex] || cardFamily(card)===families[familyIndex]));
            const rarityOrder=['Common','Uncommon','Rare','Epic','Mythical','Legendary','Cursed'];
            types.sort((a,b)=>sortMode===0 ? CARDS[a].name.localeCompare(CARDS[b].name) : sortMode===1 ? rarityOrder.indexOf(cardRarity(a))-rarityOrder.indexOf(cardRarity(b)) : sortMode===2 ? cardFamily(a).localeCompare(cardFamily(b)) : cardSize(a)-cardSize(b));
        };
        const update = (): void => {
            summary.text = 'OWNED '+run.deck.length+'  ·  GOLD '+run.gold+
                (combat ? '  ·  DRAW '+battle.draw.length+'  ·  DISCARD '+battle.spent.length : '');
            hand.text = combat ? 'HAND  '+battle.hand.filter(Boolean).map(card => CARDS[card!].name).join(' / ') : '';
            hand.scale = Math.min(1, 60/Math.max(hand.text.length,1));
            queued.text = combat ? 'SELECTED '+battle.selected.length+'  ·  QUEUE  '+battle.queue.map(id => CARDS[battle.hand[battle.handIds.indexOf(id)]!]?.name ?? 'Executed').join(' / ') : '';
            queued.scale = Math.min(1, 60/Math.max(queued.text.length,1));
            const names = [...new Set(run.deck.map(card => cardFamily(card)))];
            families.text = 'FAMILIES '+names.length+'/5   '+names.join(' / ');
            families.scale = Math.min(1,60/Math.max(families.text.length,1));
            rows.forEach((row,i) => {
                const id = types[page*6+i];
                const count = id ? run.deck.filter(card => card===id).length : 0;
                row.show(id ?? null,id ? run.deckIds[run.deck.indexOf(id)] : undefined);
                row.badge.visible=Boolean(id); row.badge.text='×'+count;
            });
            if (!selected) { sale.text = canSell ? 'Sell the final copy to free its family slot.' : 'Sell from the map or a rest room.'; return; }
            detail.text = CARDS[selected].tip;
            detail.scale = Math.min(1, 60/Math.max(detail.text.length,1));
            const ids = run.deckIds.filter((_,index) => run.deck[index]===selected);
            if (!ids.includes(selectedId)) selectedId = ids[0] ?? -1;
            copy.text = ids.length ? 'COPY '+(ids.indexOf(selectedId)+1)+'/'+ids.length+' · Lv '+cardLevel(selectedId)+' · Size '+cardSize(selected,selectedId)+' · '+cardRarity(selected) : 'No copies owned';
            copy.scale = Math.min(1,75/Math.max(copy.text.length,1));
            evolution.text = cardLevel(selectedId) >= 3 ? evolutionEffect(selected) :
                cardLevel(selectedId) === 2 ? 'Lv 3: size '+cardSize(selected,selectedId)+' → '+(cardSize(selected,selectedId)+1)+' · '+evolutionEffect(selected) : '';
            evolution.scale = Math.min(1,68/Math.max(evolution.text.length,1));
            sale.text = !canSell ? 'Sell from the map or a rest room.' : confirm ? 'Tap Sell again to confirm.' : 'Sale value: '+saleValue(selectedId)+' gold';
        };
        const button = (text:string,x:number,y:number,fn:()=>void) =>
            game.ui.button({ anchor:'top-left',x,y,h:66,z:90,text,onClick:fn });
        button('Next page',280,755,() => { page = (page+1)%Math.max(1,Math.ceil(types.length/6)); update(); });
        button('Sort',55,755,()=>{sortMode=(sortMode+1)%4;refreshTypes();page=0;update();sale.text='Sort: '+['name','rarity','family','size'][sortMode];});
        button('Family',165,755,()=>{familyIndex++;refreshTypes();page=0;update();sale.text='Family: '+([...new Set(run.deck.map(cardFamily))][familyIndex-1] ?? 'all');});
        button('Relics',490,755,() => {
            const entries = run.relics.map(id => ({name:RELICS[id].name,tip:RELICS[id].tip}));
            const powers: Record<string,{name:string;tip:string}> = {
                knight:{name:'Knight’s Rend',tip:'First sword hit each turn applies Armor Break.'},
                lich:{name:'Lich’s Chill',tip:'Frost Bolt adds an extra Chill stack.'},
                overlord:{name:'Abyssal Embers',tip:'First Fireball each turn adds an extra Burn.'},
                whetstone:{name:'Tempered Edge',tip:'Sword attacks gain 3 damage.'},
            };
            for (const id of run.powers) if (powers[id]) entries.push(powers[id]);
            if (run.curses.includes('glassheart')) entries.push({name:'Glassheart',tip:'+6 damage per hit. Lose 20 maximum health.'});
            if (!entries.length) { detail.text='No relics or powers yet.'; copy.text=''; evolution.text=''; sale.text=''; return; }
            relicCursor = (relicCursor+1)%entries.length;
            const entry=entries[relicCursor];
            selected=null;
            detail.text=entry.name+' · '+entry.tip;
            detail.scale=Math.min(1,60/Math.max(detail.text.length,1));
            copy.text='RELIC / POWER '+(relicCursor+1)+' / '+entries.length;
            copy.scale=1;
            evolution.text='';
            sale.text='';
        });
        game.step('deck-gallery-input',()=>{
            for(const p of game.input.pointers) {
                if (!p.released || Math.hypot(p.x-p.startX,p.y-p.startY)>20) continue;
                const col=[140,360,580].findIndex(x=>Math.abs(p.x-x)<72);
                const row=[320,565].findIndex(y=>Math.abs(p.y-y)<95);
                if (col<0 || row<0) continue;
                const id=types[page*6+row*3+col]; if(!id) continue;
                selected=id; selectedId=run.deckIds[run.deck.indexOf(id)]??-1; confirm=false; update();
            }
        });
        button('Next copy',64,1075,() => {
            if (!selected) return;
            const ids = run.deckIds.filter((_,index) => run.deck[index]===selected);
            if (ids.length) selectedId = ids[(ids.indexOf(selectedId)+1)%ids.length];
            confirm = false;
            update();
        });
        button('Sell',300,1075,() => {
            if (!canSell || !selected || selectedId < 0) return;
            if ((cardLevel(selectedId) >= 3 || ['Rare','Epic','Mythical','Legendary','Cursed'].includes(cardRarity(selected))) && !confirm) { confirm=true; update(); return; }
            const result = sellCard(selectedId);
            types = types.filter(card => run.deck.includes(card));
            page = Math.min(page,Math.max(0,Math.ceil(types.length/6)-1));
            update();
            sale.text = result;
        });
        button('Close',520,1075,() => game.scenes.pop());
        update();
    },
};
