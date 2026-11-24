import { game } from '../engine.js';
import { addCard, CARDS, cardFamily, cardLevel, cardSize, completeRoom, evolutionEffect, RELICS, run, upgrade, type Card } from '../run.js';
import { backdrop, chapter, floorHeading, GOLD, INK, label, LOW, menuInput, sprite, topButtons } from '../ui/chrome.js';

export const Reward = {
    name:'reward',
    enter(): void {
        backdrop();
        topButtons();
        const boss = run.room === 'boss';
        floorHeading(chapter(),boss ? 'Boss defeated' : 'Choose a reward');
        const headline = label(boss ? '+1 combo capacity after your choice' : 'Choose one reward for this run.',360,185,23,GOLD);
        if (boss) game.tween.to(headline,{scale:1.08},{duration:0.6,yoyo:true,loop:true});
        const owned = [...new Set(run.deck)];
        const families = new Set(run.deck.map(cardFamily));
        const candidates = (Object.keys(CARDS) as Card[]).filter(card =>
            cardSize(card,-1) <= run.capacity && (families.size < 5 || families.has(cardFamily(card))));
        const pool = candidates.length ? candidates : owned;
        const newCard = game.rng.weighted(pool.map(card => [card,run.deck.includes(card) ? 2 : 1] as const));
        const eligible = run.deckIds.filter((id,i) => cardLevel(id) < 3 &&
            cardSize(run.deck[i],id) + (cardLevel(id) === 2 ? 1 : 0) <= run.capacity);
        const upgradeId = eligible.length ? game.rng.pick(eligible) : undefined;
        const upgradeCard = upgradeId !== undefined ? run.deck[run.deckIds.indexOf(upgradeId)] : null;
        const upgradeValue = (card: Card, level: number): number => card === 'dodge' ? (level-1)*4 :
            CARDS[card].power+(level-1)*5+(card === 'guard' && level >= 3 ? 4 : 0);
        const availableRelics = RELICS.map((_,i) => i).filter(i => !run.relics.includes(i));
        const relic = game.rng.pick(availableRelics.length ? availableRelics : RELICS.map((_,i) => i));
        const powers = [
            { key:'knight', name:'Knight’s Rend', tip:'First sword hit each turn applies Armor Break.' },
            { key:'lich', name:'Lich’s Chill', tip:'Frost Bolt applies an extra Chill stack.' },
            { key:'overlord', name:'Abyssal Embers', tip:'First Fireball each turn adds an extra Burn.' },
        ];
        const power = powers[run.floor-1];
        const choices = boss ? [
            { title:RELICS[relic].name, detail:RELICS[relic].tip, icon:'treasure', act:() => { run.relics.push(relic); run.stats.relics++; } },
            { title:power.name, detail:power.tip, icon:'boss', act:() => { if (!run.powers.includes(power.key)) run.powers.push(power.key); } },
            run.curses.includes('glassheart')
                ? { title:'Vital Spark', detail:'Gain 12 maximum health and restore 12.', icon:'heart', act:() => { run.maxHp += 12; run.hp += 12; } }
                : { title:'Glassheart · cursed', detail:'+6 damage per hit. Lose 20 max health.', icon:'heart', act:() => {
                    run.curses.push('glassheart'); run.maxHp = Math.max(20,run.maxHp-20); run.hp = Math.min(run.hp,run.maxHp);
                } },
        ] : [
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
            { title:'Heart Gem', detail:'Restore up to 24 health.', icon:'heart', act:() => { run.hp=Math.min(run.maxHp,run.hp+24); } },
        ];
        let chosen = false;
        const entries = choices.map((choice,i) => {
            const y = 360 + i*230;
            const panel = game.spawn({ id:'reward-'+i, texture:'panel',x:360,y,width:650,height:190,layer:'hud',z:1,
                pointer:{ onTap:() => { if (chosen) return; chosen=true; choice.act(); game.sound.play('clear'); completeRoom(); } } });
            sprite('icon-'+choice.icon,100,y,65,2);
            label(choice.title,155,y-37,27,GOLD,'sans-bold','left');
            const lines: string[] = [''];
            for (const word of choice.detail.split(' ')) {
                const last = lines.length-1;
                if (lines[last] && lines[last].length+word.length+1 > 45) lines.push(word);
                else lines[last] += (lines[last] ? ' ' : '')+word;
            }
            lines.slice(0,3).forEach((line,index) => label(line,155,y-4+index*25,20,INK,'sans-bold','left'));
            label('TAP TO CLAIM',610,y+65,16,LOW,'mono-bold','right');
            return { art:panel, activate:() => { if (chosen) return; chosen=true; choice.act(); game.sound.play('clear'); completeRoom(); } };
        });
        menuInput(entries);
    },
};
