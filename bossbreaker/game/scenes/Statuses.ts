import { game } from '../engine.js';
import { battle, FOES } from '../arena.js';
import { STATUS_RULES, type Status } from '../status.js';
import { GOLD, INK, label, LOW } from '../ui/chrome.js';

const NAMES: Record<Status,string> = {
    poison:'POISON', burn:'BURN', chill:'CHILL', paralysis:'PARALYSIS',
    silence:'SILENCE', weaken:'WEAKEN', armorBreak:'ARMOR BREAK',
};
export const Statuses = {
    name:'statuses',
    enter(): void {
        game.ui.panel({anchor:'center',w:720,h:1280,z:80,safeArea:false,
            style:{fill:'#11101af8',radius:0,border:0,bevel:0,gloss:0,shadow:0}});
        label('STATUS EFFECTS',360,72,40,GOLD,'serif-bold','center',91);
        const combat = game.scenes.stack.includes('play');
        const describe = (values: typeof battle.statuses): string =>
            Object.entries(values).map(([name,value]) => NAMES[name as Status]+' '+value?.stacks+' ('+value?.turns+' turns)').join('  /  ') || 'None';
        label('HERO  '+(combat ? describe(battle.statuses) : 'None'),45,140,20,INK,'sans-bold','left',91);
        const foe = battle.foes[battle.target];
        const foeLine = label(combat && foe ? FOES[foe.id].name.toUpperCase()+'  '+describe(foe.statuses) : '',45,178,19,LOW,'sans-bold','left',91);
        foeLine.scale = Math.min(1,65/Math.max(1,foeLine.text.length));
        (Object.keys(STATUS_RULES) as Status[]).forEach((id,i) => {
            const rule = STATUS_RULES[id], y = 240+i*120;
            label(NAMES[id]+'  ·  max '+rule.max+'  ·  '+rule.turns+' turn'+(rule.turns===1?'':'s'),45,y,22,GOLD,'sans-bold','left',91);
            const detail = label(rule.description,45,y+35,20,INK,'sans-bold','left',91);
            detail.scale = Math.min(1,66/Math.max(1,rule.description.length));
        });
        game.ui.button({anchor:'bottom',x:-125,y:-35,h:66,z:90,text:'Close',onClick:()=>game.scenes.pop()});
        game.ui.button({anchor:'bottom',x:125,y:-35,h:66,z:90,text:'Elements',onClick:()=>game.scenes.push('elements')});
    },
};
