import { preferences } from '../ui/preferences.js';
import { cardVisual } from '../ui/cards.js';
import { game } from '../engine.js';
import { addCard, CARDS, cardFamily, cardLevel, cardRarity, cardSize, completeRoom, evolutionEffect, RELICS, rewardWeight, run, upgrade, type Card } from '../run.js';
import { backdrop, chapter, floorHeading, GOLD, INK, label, LOW, menuInput, sprite, topButtons } from '../ui/chrome.js';

let rerollCount = 0;
let rerolling = false;
let previousCard: Card | null = null;
let previousUpgrade: number | undefined;

export const Reward = {
    name:'reward',
    enter(): void {
        backdrop();
        topButtons();
        const boss = run.room === 'boss';
        const wasReroll=rerolling;
        if (!wasReroll) { rerollCount=0; previousCard=null; previousUpgrade=undefined; }
        rerolling=false;
        floorHeading(chapter(),boss ? 'Boss defeated' : 'Choose a reward');
        const headline = label(boss ? '+1 combo capacity after your choice' : 'Choose one reward for this run.',360,185,23,GOLD);
        if (boss) game.tween.to(headline,{scale:1.08},{duration:0.6,yoyo:true,loop:true});
        const owned = [...new Set(run.deck)];
        const families = new Set(run.deck.map(cardFamily));
        const candidates = (Object.keys(CARDS) as Card[]).filter(card =>
            cardSize(card,-1) <= run.capacity && !['Mythical','Legendary','Cursed'].includes(cardRarity(card)) && (families.size < 5 || families.has(cardFamily(card))));
        const pool = candidates.length ? candidates : owned;
        const alternativeCards = wasReroll && pool.length > 1 ? pool.filter(card=>card!==previousCard) : pool;
        const newCard = game.rng.weighted(alternativeCards.map(card => [card,rewardWeight(card)] as const));
        previousCard=newCard;
        const eligible = run.deckIds.filter((id,i) => cardLevel(id) < 3 &&
            cardSize(run.deck[i],id) + (cardLevel(id) === 2 ? 1 : 0) <= run.capacity);
        const alternatives = wasReroll && eligible.length > 1 ? eligible.filter(id=>id!==previousUpgrade) : eligible;
        const upgradeId = alternatives.length ? game.rng.pick(alternatives) : undefined;
        previousUpgrade=upgradeId;
        const upgradeCard = upgradeId !== undefined ? run.deck[run.deckIds.indexOf(upgradeId)] : null;
        const upgradeValue = (card: Card, level: number): number => card === 'dodge' ? (level-1)*4 :
            CARDS[card].power+(level-1)*5+(card === 'guard' && level >= 3 ? 4 : 0);
        const choices: {title:string;detail:string;icon:string;act:()=>boolean|void}[] = boss ? (['sovereign','bulwark','immolate'] as Card[]).map(card => ({
            title:cardRarity(card)+' · '+CARDS[card].name,
            detail:CARDS[card].tip+' Size '+cardSize(card,-1)+'.'+(families.size>=5 && !families.has(cardFamily(card)) ? ' Requires a free '+cardFamily(card)+' family slot.' : ''), icon:card,
            act:() => { const id=addCard(card); if (id<0) return false; run.stats.cards++; return true; },
        })) : [
            { title:'Add '+CARDS[newCard].name, detail:CARDS[newCard].tip, icon:newCard, act:() => { if (addCard(newCard) >= 0) run.stats.cards++; } },
            { title:upgradeCard ? 'Upgrade '+CARDS[upgradeCard].name : run.powers.includes('whetstone') ? 'Fortitude' : 'Tempered Edge',
                detail:upgradeCard ? 'Level '+cardLevel(upgradeId)+' → '+(cardLevel(upgradeId)+1)+
                    ' · '+(upgradeCard === 'dodge' ? 'Barrier' : upgradeCard === 'echo' ? 'Repeat bonus' : 'Power')+' '+upgradeValue(upgradeCard,cardLevel(upgradeId))+' → '+upgradeValue(upgradeCard,cardLevel(upgradeId)+1)+' · Size '+cardSize(upgradeCard,upgradeId)+' → '+(cardSize(upgradeCard,upgradeId)+(cardLevel(upgradeId)===2?1:0))+(cardLevel(upgradeId)===2 ? ' · '+evolutionEffect(upgradeCard) : '')
                    : run.powers.includes('whetstone') ? 'Gain 8 maximum health and restore 8.' : 'Sword attacks gain 3 damage.',
                icon:upgradeCard ?? 'slash', act:() => {
                    if (upgradeCard) upgrade(upgradeCard,upgradeId);
                    else if (run.powers.includes('whetstone')) { run.maxHp+=8; run.hp+=8; }
                    else run.powers.push('whetstone');
                } },
            rerollCount % 2 === 0
                ? { title:'Heart Gem', detail:'Restore up to 24 health.', icon:'heart', act:() => { run.hp=Math.min(run.maxHp,run.hp+24); } }
                : { title:'Vital Spark', detail:'Gain 5 maximum health and restore 5.', icon:'heart', act:() => { run.maxHp+=5; run.hp+=5; } },
        ];
        let chosen = false;
        if (!boss) {
            const cost=15*(rerollCount+1);
            const reroll=game.ui.button({anchor:'bottom',y:-30,h:65,z:20,text:'Reroll · '+cost+' gold',onClick:()=>{
                if (chosen || run.gold < cost) return;
                chosen=true; run.gold-=cost; rerollCount++; rerolling=true; game.sound.play('shuffle'); game.scenes.go('reward');
            }});
            reroll.ui.disabled=run.gold<cost;
            label('GOLD '+run.gold,360,1080,20,GOLD,'mono-bold');
        }
        const failure=label('',360,1020,20,INK,'sans-bold');
        let selectedChoice=-1;
        const claim=(choice: typeof choices[number],index:number):void=>{ if(chosen) return; if(selectedChoice!==index){selectedChoice=index;failure.text='Selected '+choice.title+' · tap again to confirm.';game.sound.play('select');return;} chosen=true; if(choice.act()===false){chosen=false;failure.text='No family slot available. Choose another reward.';return;} game.sound.play('clear');completeRoom(); };
        const entries = choices.map((choice,i) => {
            const y = 360 + i*230;
            const panel = game.spawn({ id:'reward-'+i, texture:'panel',x:360,y,width:650,height:190,layer:'hud',z:1,
                pointer:{ onTap:() => {claim(choice,i); if (!chosen) panel.tint=selectedChoice===i ? '#ffe4ae' : '#ffffff';} } });
            if (!preferences.reducedMotion) game.tween.from(panel,{alpha:0.2,scale:0.96},{duration:0.22+i*0.08,ease:'easeOutQuad'});
            if (boss && !preferences.reducedMotion) game.after(0.16+i*0.12,()=>{
                const color=['#ffcf6a','#ef9bff','#d85c72'][i];
                game.particles.burst({x:98,y,count:12,layer:'front',frame:'particle:spark',color:[color,'#fff2cf'],speed:[25,110],lifespan:[0.2,0.4]});
                game.sound.play(i===2?'immolate':i===0?'critical':'bulwark');
            });
            if (choice.icon in CARDS) {
                const visual=cardVisual(98,y,92,'reward-card-'+i,2); visual.show(choice.icon as Card); visual.name.visible=false; visual.effect.visible=false;
                game.tween.from(visual.base,{scale:0.84,alpha:0},{duration:0.22+i*0.08,ease:'easeOutBack'});
            } else sprite('icon-'+choice.icon,100,y,65,2);
            label(choice.title,155,y-37,27,GOLD,'sans-bold','left');
            const lines: string[] = [''];
            for (const word of choice.detail.split(' ')) {
                const last = lines.length-1;
                if (lines[last] && lines[last].length+word.length+1 > 45) lines.push(word);
                else lines[last] += (lines[last] ? ' ' : '')+word;
            }
            lines.slice(0,3).forEach((line,index) => label(line,155,y-4+index*25,20,INK,'sans-bold','left'));
            label('TAP TO CLAIM',610,y+65,16,LOW,'mono-bold','right');
            return { art:panel, activate:() => claim(choice,i) };
        });
        menuInput(entries);
    },
};
