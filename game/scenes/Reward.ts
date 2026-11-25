import { preferences } from '../ui/preferences.js';
import { cardVisual } from '../ui/cards.js';
import { game } from '../engine.js';
import { CARDS, EARTH_BLOCK_BASE, EARTH_BLOCK_STEP, ELEMENTS, ELEMENT_POWER_STEP, FAMILY_LIMIT, MAX_CASTS, UNLOCK_COPIES, cardLevel, completeRoom, RELICS, run, unlockElement, upgrade, type Card, type Element } from '../run.js';
import { backdrop, chapter, floorHeading, GOLD, INK, label, LOW, menuInput, sprite, topButtons } from '../ui/chrome.js';

let rerollCount = 0;
let rerolling = false;
let previousCard: Element | null = null;
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
        const headline = label(boss ? 'Maximum casts: '+run.capacity+' / '+MAX_CASTS : 'Choose one reward for this run.',360,185,23,GOLD);
        if (boss) game.tween.to(headline,{scale:1.08},{duration:0.6,yoyo:true,loop:true});
        const unlocked = ELEMENTS.filter(element=>run.mastery[element]>0);
        const locked = ELEMENTS.filter(element=>run.mastery[element]===0);
        const alternatives=locked.filter(element=>element!==previousCard);
        const newCard = unlocked.length < FAMILY_LIMIT && locked.length ? game.rng.pick(wasReroll && alternatives.length ? alternatives : locked) : null;
        previousCard=newCard;
        const eligible = unlocked.filter(element=>run.mastery[element]<5);
        const alternativeUpgrades=eligible.filter(element=>run.deckIds[run.deck.indexOf(element)]!==previousUpgrade);
        const upgradeCard = eligible.length ? game.rng.pick(wasReroll && alternativeUpgrades.length ? alternativeUpgrades : eligible) : null;
        const upgradeId = upgradeCard ? run.deckIds[run.deck.indexOf(upgradeCard)] : undefined;
        previousUpgrade=upgradeId;
        const signature=4+run.floor-1;
        const extras=[7,8,9,10,0,1,2].filter(id=>id!==signature && !run.relics.includes(id));
        const bossRelics=[signature,...extras.slice(0,2)];
        const choices: {title:string;detail:string;icon:string;act:()=>boolean|void}[] = boss ? bossRelics.map((id,i)=>({
            title:(id===8?'Cursed':i===0?'Legendary':'Mythical')+' · '+RELICS[id].name,
            detail:RELICS[id].tip, icon:'treasure',
            act:()=>{if(!run.relics.includes(id)){run.relics.push(id);run.stats.relics++;} return true;},
        })) : [
            newCard ? { title:'Unlock '+CARDS[newCard].name, detail:CARDS[newCard].tip+' Adds '+UNLOCK_COPIES+' cards.', icon:newCard, act:() => unlockElement(newCard) } : {title:'Vital Spark',detail:'Gain 5 maximum health and restore 5.',icon:'heart',act:()=>{run.maxHp+=5;run.hp+=5;}},
            { title:upgradeCard ? 'Upgrade '+CARDS[upgradeCard].name : 'Fortitude',
                detail:upgradeCard ? 'Level '+cardLevel(upgradeId)+' → '+(cardLevel(upgradeId)+1)+' · Power '+(CARDS[upgradeCard].power+(cardLevel(upgradeId)-1)*ELEMENT_POWER_STEP)+' → '+(CARDS[upgradeCard].power+cardLevel(upgradeId)*ELEMENT_POWER_STEP)+(upgradeCard==='earth' ? ' · Block '+(EARTH_BLOCK_BASE+(cardLevel(upgradeId)-1)*EARTH_BLOCK_STEP)+' → '+(EARTH_BLOCK_BASE+cardLevel(upgradeId)*EARTH_BLOCK_STEP) : '')+' · All copies'+(cardLevel(upgradeId)===2?' · Triple eligible':'')
                    : 'Gain 8 maximum health and restore 8.',

                icon:upgradeCard ?? 'slash', act:() => {
                    if (upgradeCard) upgrade(upgradeCard,upgradeId);
                    else { run.maxHp+=8; run.hp+=8; }
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
