import { game } from '../engine.js';
import { battle, FOES } from '../arena.js';
import { stacks, STATUS_RULES, type Status } from '../status.js';
import { GOLD, INK, LOW, label } from '../ui/chrome.js';

export const Enemy = {
    name:'enemy-info',
    enter(): void {
        const foe=battle.foes[battle.target];
        if (!foe) { game.scenes.pop(); return; }
        game.ui.panel({anchor:'center',w:680,h:950,z:80,safeArea:false,
            style:{fill:'#11101af8',radius:0,border:2,bevel:0,gloss:0,shadow:0}});
        label(FOES[foe.id].name.toUpperCase(),360,208,32,GOLD,'serif-bold','center',91);
        label('HP '+foe.hp+' / '+foe.max+'   ·   ARMOR 0',360,257,23,INK,'mono-bold','center',91);
        label('NEXT ACTIONS',55,320,24,GOLD,'sans-bold','left',91);
        const intents=battle.zones.filter(z=>z.owner===foe);
        intents.forEach((z,i)=> {
            const amount=Math.max(1,z.damage-stacks(foe.statuses,'chill')*4-stacks(foe.statuses,'weaken')*3);
            const line=label(z.label+' · '+amount+' DAMAGE',55,360+i*38,21,INK,'sans-bold','left',91);
            line.scale=Math.min(1,54/Math.max(line.text.length,1));
        });
        label('ACTIVE STATUSES',55,500,24,GOLD,'sans-bold','left',91);
        const statuses=Object.entries(foe.statuses);
        if (!statuses.length) label('None',55,540,21,LOW,'sans-bold','left',91);
        statuses.forEach(([name,value],i)=>label(name+' '+value?.stacks+' · '+value?.turns+' turns',55,540+i*30,20,INK,'sans-bold','left',91));
        const details = foe.id==='slime' ? 'Slime hop applies 1 Poison. Each stack deals 2 damage after the response for 2 turns.' :
            foe.id==='archer' ? 'Weaken reduces attack damage by 3 per stack.' :
            foe.id==='knight' ? 'Every third turn the knight can apply Armor Break.' :
            foe.id==='lich' ? 'Every third turn the lich can apply Silence.' :
            foe.id==='overlord' ? 'The overlord applies Burn and can cause Paralysis.' : 'No special resistance is currently applied.';
        label('ABILITY',55,690,24,GOLD,'sans-bold','left',91);
        const words=details.split(' '); const lines=[''];
        for(const word of words) { const i=lines.length-1; if(lines[i].length+word.length>48) lines.push(word); else lines[i]+=(lines[i]?' ':'')+word; }
        lines.forEach((line,i)=>label(line,55,730+i*30,20,INK,'sans-bold','left',91));
        if (foe.id==='slime') label(STATUS_RULES.poison.description,55,830,19,LOW,'sans-bold','left',91);
        game.ui.button({anchor:'bottom',y:-165,h:70,z:90,text:'Close',onClick:()=>game.scenes.pop()});
    },
};
