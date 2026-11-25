import { cardVisual } from '../ui/cards.js';
import { game } from '../engine.js';
import { CARDS, cardLevel, cardSize, completeRoom, evolutionEffect, grant, remove, run, startRun, upgrade, type Card } from '../run.js';
import { backdrop, chapter, floorHeading, framedButton, GOLD, INK, label, LOW, menuInput, sprite, topButtons } from '../ui/chrome.js';

export const Treasure = {
    name: 'treasure',
    enter(): void {
        backdrop();
        topButtons();
        floorHeading(chapter(),'Treasure Vault');
        sprite('panel',360,747);
        const chest = sprite('icon-treasure',360,485,288,1,'treasure-chest');
        const caption = label('An ironbound chest waits in the alcove.',360,705,26);
        const reward = label('',360,768,21,GOLD);
        const extra = label('',360,804,21,GOLD);
        game.tween.to(chest,{y:chest.y-8},{duration:1.05,loop:true,yoyo:true});
        let opened = false;
        const open = (): void => {
            if (opened) { completeRoom(); return; }
            opened = true;
            reward.text = grant('relic-charm');
            if (game.rng.chance(0.42)) extra.text = grant('heart-gem');
            caption.text = 'Relic claimed';
            buttonText.text = 'Continue to map';
            chest.tint = '#ffe0a6';
            game.particles.burst({ x:360,y:480,count:36,layer:'front',frame:'particle:spark',color:['#f9ba70','#fff0af'], speed:[110,250],lifespan:[0.35,0.65] });
            game.sound.play('clear');
        };
        const art = game.spawn({ id:'treasure-action', texture:'button', x:360,y:992,layer:'hud',z:1,pointer:{onTap:open} });
        const buttonText = label('Open the chest',360,991,24);
        menuInput([{art,activate:open}]);
    },
};

export const Campfire = {
    name: 'campfire',
    enter(): void {
        backdrop();
        topButtons();
        floorHeading(chapter(),'Campfire Rest');
        const flame = sprite('icon-campfire',360,342,190,1);
        game.tween.to(flame,{scale:flame.scale*1.06},{duration:0.52,yoyo:true,loop:true});
        label('Upgrade an element or remove one card.',360,434,24);
        const types = [...new Set(run.deck)];
        const entries: Parameters<typeof menuInput>[0] = [];
        const outlines: ReturnType<typeof sprite>[] = [];
        const tip = label('Choose an element; mastery affects every copy.',360,914,20,LOW);
        let selected: Card | undefined;
        let selectedId = -1;
        const showCopy = (): void => {
            if (!selected) return;
            const copies = run.deckIds.filter((_,index)=>run.deck[index]===selected);
            const level = cardLevel(selectedId);
            const prefix = 'All copies · Lv '+level+' · ';
            tip.text = prefix+(level >= 5 ? 'Maximum level.' : level === 2 ? 'Lv 3: +3 damage'+(selected==='earth'?' and +2 barrier':'')+'; unlocks triples. All copies improve.' : 'Next level +3 damage'+(selected==='earth'?' and +2 barrier':'')+'. All copies improve.');
            tip.scale = Math.min(1,62/Math.max(tip.text.length,1));
        };
        let used = false;
        types.forEach((id,i) => {
            const card = CARDS[id], x = 152+i%3*208, y = 510+Math.floor(i/3)*80;
            const choose = (): void => {
                if (used) return;
                selected = id;
                outlines.forEach((panel,index) => panel.texture = index === i ? 'slot-lit' : 'slot');
                selectedId = run.deckIds[run.deck.indexOf(id)];
                showCopy();
            };
            const art = game.spawn({ id:'camp-'+id, texture:'slot', x,y,width:173,height:94,layer:'hud',z:1,pointer:{ onTap: choose } });
            outlines.push(art);
            const visual=cardVisual(x-59,y,42,'camp-card-'+id,2); visual.show(id,run.deckIds[run.deck.indexOf(id)]); visual.name.visible=false; visual.effect.visible=false; visual.rarity.visible=false;
            label(card.name,x,y+5,19,card.color);
            const count = () => run.deck.filter(c=>c===id).length+' in deck  ·  Lv '+cardLevel(run.deckIds[run.deck.indexOf(id)]);
            const subtitle = label(count(),x,y+30,15,LOW);
            game.step('camp-count-'+id, () => { subtitle.text = count(); });
            entries.push({art,activate:choose});
        });
        const apply = (isUpgrade: boolean): void => {
            if (!selected || used) { if (!used) tip.text = 'Choose a card above first.'; return; }
            if (!isUpgrade && !remove(selected,selectedId)) { tip.text = 'Keep eight cards and one of each element.'; return; }
            if (isUpgrade) {
                const before = cardLevel(selectedId);
                upgrade(selected,selectedId);
                if (cardLevel(selectedId) === before) { tip.text = 'Already at maximum mastery.'; return; }
            }
            used = true;
            tip.text = CARDS[selected].name + (isUpgrade ? ' upgraded.' : ' removed from the deck.');
            game.sound.play('clear');
        };
        entries.push(framedButton('upgrade','Upgrade',217,995,()=>apply(true),226));
        entries.push(framedButton('remove','Remove',503,995,()=>apply(false),226));
        entries.push(framedButton('next-copy','Next copy',108,1101,() => {
            if (!selected || used) return;
            const copies = run.deckIds.filter((_,index)=>run.deck[index]===selected);
            selectedId = copies[(copies.indexOf(selectedId)+1)%copies.length];
            showCopy();
        },176));
        entries.push(framedButton('continue','Continue',414,1101,completeRoom,300));
        menuInput(entries);
    },
};

export const End = {
    name: 'end',
    enter(): void {
        backdrop();
        topButtons(false);
        const won = run.result === 'victory';
        sprite('icon-'+(won ? 'boss' : 'monster'),360,225,94);
        label(won ? 'VICTORY' : 'GAME OVER',360,331,66,won ? GOLD : '#ff948a','serif-bold');
        label(won ? 'The Abyssal Overlord has fallen.' : 'The Spellblade fell on floor '+run.floor+'.',360,417,29);
        const panel = sprite('panel',360,700,608);
        panel.height = 378;
        const stats = [
            ['Rooms cleared',run.stats.rooms],['Bosses defeated',run.stats.bosses],['Relic Charms gathered',run.stats.relics],
            ['Cards collected',run.stats.cards],['Combos triggered',run.stats.combos],
        ] as const;
        stats.forEach(([name,value],i) => {
            label(name,94,577+i*61,24,INK,'sans-bold','left');
            label(String(value),626,577+i*61,26,GOLD,'mono-bold','right');
        });
        menuInput([framedButton('play-again','Play Again',360,1000,startRun)],false);
    },
};
