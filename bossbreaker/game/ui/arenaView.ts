import { reaction } from '../elements.js';
import { stacks } from '../status.js';
import { game } from '../engine.js';
import { angle, battle, cardIndex, FIELD, FOES, RUNES, maxCapacity, usedCapacity, type Effect, type Zone } from '../arena.js';
import { CARDS, MAX_HP, PIPS, cardLevel, cardSize, run } from '../run.js';
import { GOLD, HOT, INK, label, LOW, sprite } from './chrome.js';

const TAU = Math.PI * 2;
const SHORT_NAME: Record<keyof typeof CARDS,string> = {
    slash:'Slash', cleave:'Cleave', dash:'Dash', frost:'Frost', fire:'Fire',
    storm:'Storm', dodge:'Dodge', riposte:'Riposte', guard:'Guard', echo:'Echo',
};
export const HAND_Y = 1071;
export const SLOT_Y = 886;
export const ACTION_Y = 1238;
export const HAND_X = [92,226,360,494,628];
export const SLOT_X = [92,226,360,494,628];

export function drawArena() {
    const arenaArt = sprite('arena-'+run.floor,360,450,684,0,'arena-floor');
    const markerInk = game.graphics({ layer:'hud', width:720, height:612, x:360, y:442 });
    markerInk.handle.z = 1;
    const gate = sprite('gate',360,203,124,2,'arena-door');
    game.tween.from(gate,{y:181},{duration:0.25,ease:'easeOutQuad'});
    const actor = sprite('player',battle.hero.x,battle.hero.y,91,3,'hero');
    const enemies = battle.foes.map(f => {
        const art = sprite(f.id,f.x,f.y,FOES[f.id].size,3,'foe-'+f.id);
        const bar = game.bars.create({ x:f.x,y:f.y+FOES[f.id].size*0.37,width:FOES[f.id].size*0.75,height:9,
            style:'retro', fill:FOES[f.id].color,max:f.max,ghost:true,z:4 });
        return { art, bar };
    });
    const targetButtons = battle.foes.length > 1 ? battle.foes.map((foe,i) => {
        const x = i === 0 ? 180 : 540;
        const art = game.spawn({ id:'target-'+(i+1), texture:'button-small', x, y:230, width:245, height:62, layer:'hud', z:6,
            pointer:{ onTap:() => {
                if (battle.phase !== 'plan' || foe.hp <= 0) return;
                battle.target = i;
                battle.note = FOES[foe.id].name+' '+foe.hp+'/'+foe.max;
                game.sound.play('select');
            } } });
        const title = label('',x,222,18,INK,'sans-bold','center',7);
        const hp = label('',x,243,16,GOLD,'mono-bold','center',7);
        return {art,title,hp};
    }) : [];
    const health = game.bars.create({ x:149,y:115,width:196,height:15,style:'retro',fill:'#e15f6d',max:run.maxHp,value:run.hp,ghost:true,z:3 });
    const lead = battle.foes.length === 1 ? battle.foes[0] : null;
    const bossHealth = lead && game.bars.create({ x:360,y:145,width:360,height:10,style:'retro',fill:FOES[lead.id].color,max:lead.max,ghost:true,z:3 });
    const fpsInk = game.graphics({ layer:'hud', width:720, height:612, x:360, y:442 });
    fpsInk.handle.z = 5;
    const feedback = new Map<Effect, ReturnType<typeof label>>();
    const targetLabel = label('',360,704,20,GOLD,'mono-bold');
    const status = label('', 360, 756, 23, GOLD, 'mono-bold');
    const intentDetail = label('', 360, 780, 21, HOT, 'mono-bold');
    const hint = label('', 360, 807, 21, INK);
    const vital = label('', 74, 87, 22, INK, 'mono-bold','left');
    const guard = label('',306,101,23,INK,'mono-bold','left');
    sprite('icon-heart',47,87,33,1);
    sprite('icon-guard',281,101,31,1);
    label('DISCARDS',540,111,16,LOW,'mono-bold','right');
    const pips = Array.from({length:PIPS},(_,i) => sprite('icon-frost',564+i*32,111,23,2,'discard-pip-'+(i+1)));
    const turn = label('',29,985,18,GOLD,'mono-bold','left');
    const counts = label('',691,985,16,LOW,'mono-bold','right');
    const capacityLabel = label('',360,832,17,GOLD,'mono-bold');
    const capacityBar = game.graphics({layer:'hud',x:360,y:850,width:480,height:20});
    capacityBar.handle.z = 2;
    const hand = HAND_X.map((x,i) => ({
        base: sprite('card-slash',x,HAND_Y,120,1,'hand-'+(i+1)),
        icon: sprite('icon-slash',x,HAND_Y-4,53,2,'hand-icon-'+(i+1)),
        name: label('',x,HAND_Y-46,24),
        effect: label('',x,HAND_Y+49,17,INK),
        badge: label('',x+43,HAND_Y-62,20,GOLD,'mono-bold'),
    }));
    const slots = SLOT_X.map((x,i) => ({
        base: sprite('slot',x,SLOT_Y+20,122,1,'slot-'+(i+1)),
        icon: sprite('icon-slash',x,SLOT_Y+12,45,2,'slot-icon-'+(i+1)),
        name: label('',x,SLOT_Y+52,18),
        number: label(String(i+1),x-44,SLOT_Y-16,17,LOW,'mono-bold'),
    }));
    const queueButton = sprite('button',180,1165,320,1,'queue-button');
    queueButton.height = 56;
    const queueText = label('Queue selected',180,1165,20);
    const discardButton = sprite('button',540,1165,320,1,'discard-button');
    discardButton.height = 56;
    const discardText = label('Discard & draw',540,1165,20);
    const executeButton = sprite('button',360,ACTION_Y,640,1,'execute-button');
    executeButton.height = 60;
    const executeText = label('',360,ACTION_Y,23);
    const footer = label('',360,959,17,LOW);

    let shownTurn = 0;
    let shownRedraw = 0;
    return (time: number, discardMode: boolean, focus: number, touch: boolean, stick: {x:number;y:number;dx:number;dy:number} | null, reward: string) => {
        const {phase} = battle;
        const planning = phase === 'plan';
        const aiming = phase === 'execute' || phase === 'enemy';
        const clear = phase === 'clear';
        gate.setFrame(clear ? 1 : 0);
        arenaArt.alpha = phase === 'lost' ? 0.65 : 1;
        vital.text = run.hp+' / '+run.maxHp;
        health.value = run.hp;
        if (lead && bossHealth) bossHealth.value = lead.hp;
        guard.text = String(battle.barrier);
        pips.forEach((pip,i) => pip.alpha = i < battle.pips ? 1 : 0.24);
        turn.text = 'HAND  /  TURN '+battle.turn;
        counts.text = 'DRAW '+battle.draw.length+'  ·  SPENT '+battle.spent.length;
        const lunge = phase === 'execute' && (battle.resolving === 'Slash' || battle.resolving === 'Dash Strike')
            ? Math.sin(Math.PI * battle.cast / 0.18) * 115 : 0;
        actor.x = battle.hero.x + Math.cos(battle.aim)*lunge;
        actor.y = battle.hero.y + Math.sin(time*7)*2 + Math.sin(battle.aim)*lunge;
        actor.sx = Math.cos(battle.aim) < -0.2 ? -1 : 1;
        actor.sy = 1 - battle.cast*0.7;
        enemies.forEach(({art,bar},i) => {
            const f = battle.foes[i];
            const visible = f.hp > 0 || f.flash > 0;
            art.visible = visible;
            art.x = f.x + Math.sin(time*74)*f.flash*27;
            art.y = f.y + Math.sin(time*(f.id==='lich' ? 5 : 3)+i)*4;
            art.tint = f.flash > 0 ? '#ffffff' : stacks(f.statuses,'chill') ? '#a4deff' : '#ffffff';
            art.alpha = f.hp > 0 ? (f.flash > 0 && Math.sin(time*95)>0 ? 0.62 : 1) : f.flash*5;
            art.scale = 1 + f.flash*0.43;
            bar.x = f.x; bar.y = f.y+FOES[f.id].size*0.38; bar.value = f.hp; bar.visible = visible;
        });
        targetButtons.forEach(({art,title,hp},i) => {
            const foe = battle.foes[i];
            const visible = foe.hp > 0;
            art.visible = title.visible = hp.visible = visible;
            if (!visible) return;
            art.setFrame(planning && battle.target === i ? 1 : 0);
            art.alpha = planning ? 1 : 0.62;
            title.text = (i+1)+'  '+FOES[foe.id].name;
            title.scale = Math.min(1,21/Math.max(title.text.length,1));
            hp.text = foe.hp+' / '+foe.max;
        });
        const chosen = battle.foes[battle.target];
        targetLabel.text = planning && chosen && chosen.hp > 0 ? 'TARGET '+(battle.target+1)+'  '+FOES[chosen.id].name+'  '+chosen.hp+'/'+chosen.max+'  '+Object.entries(chosen.statuses).map(([key,value])=>key+' '+value?.stacks).join(' ') : '';
        targetLabel.scale = Math.min(1, 55/Math.max(targetLabel.text.length,1));
        const warnings = battle.zones.filter(z => !z.owner || z.owner.hp > 0 && !z.owner.stagger).map(z => z.label+' '+Math.max(1,z.damage-(z.owner ? stacks(z.owner.statuses,'chill')*4 + stacks(z.owner.statuses,'weaken')*3 : 0))+' dmg');
        status.text = clear ? 'ROOM CLEARED' : phase === 'lost' ? 'THE SPELLBLADE FELL' :
            phase === 'enemy' ? (battle.enemyStage ? battle.note || 'Enemy attacks' : 'ENEMY RESPONSE') :
            phase === 'execute' ? (battle.note || 'EXECUTE YOUR QUEUE') : (warnings[0] ?? 'Enemy interrupted');
        intentDetail.text = planning ? warnings.slice(1).join('  /  ') : '';
        status.color = planning || phase === 'enemy' ? HOT : GOLD;
        status.scale = Math.min(1, 42 / Math.max(1,status.text.length));
        intentDetail.scale = Math.min(1, 51 / Math.max(1,intentDetail.text.length));
        if (clear) hint.text = reward;
        else if (planning && battle.note) hint.text = battle.note;
        else if (planning && battle.inspected >= 0) hint.text = CARDS[battle.hand[battle.inspected]!].tip;
        else if (battle.tutorial && planning && !battle.steamed) hint.text = 'Queue Frost Bolt → Fireball for Steam Burst.';
        else if (planning) {
            const order = battle.queue.map(id => battle.hand[cardIndex(id)]);
            const previews: string[] = [];
            if (order[0] === 'guard') previews.push('Guard first');
            for (let i=1;i<order.length;i++) {
                const current = order[i], previous = order[i-1];
                if (!current || !previous) continue;
                const combo = reaction(previous,current);
                if (combo) previews.push(combo.toUpperCase() + (['steam','overload','surge'].includes(combo) ? ' · all foes' : ' · target'));
            }
            if (order.some((card,i) => card === 'dash' && order[i+1] === 'slash')) previews.push('Lunging Cleave');
            if (order.some((card,i) => card === 'echo' && order[i+1] && order[i+1] !== 'echo')) previews.push('Echo repeats the next card');
            hint.text = previews.length ? previews.join('  ·  ') : 'Select cards, then queue or discard.';
        }
        else if (phase === 'enemy') hint.text = 'Guard absorbs damage until the response ends.';
        else hint.text = 'Your combo resolves automatically.';

        hint.scale = Math.min(1, 57 / Math.max(1,hint.text.length));
        hand.forEach(({base,icon,name,effect,badge},i) => {
            const id = battle.hand[i];
            const card = id ? CARDS[id] : null;
            base.visible = icon.visible = name.visible = effect.visible = Boolean(card);
            const selection = battle.selected.indexOf(battle.handIds[i]!);
            badge.text = selection >= 0 ? String(selection+1) : '';
            badge.visible = Boolean(card) && selection >= 0;
            if (!id || !card) return;
            const queued = battle.queue.indexOf(battle.handIds[i]!);
            if (base.texture !== 'card-'+id) {
                base.texture = 'card-'+id;
                icon.texture = 'icon-'+id;
            }
            const alpha = planning && queued < 0 ? 1 : 0.48;
            const dy = shownTurn === battle.turn && shownRedraw === battle.redraw ? 0 : 12+i*3;
            if (dy) {
                base.y = HAND_Y+dy; icon.y=HAND_Y-4+dy; name.y=HAND_Y-46+dy; effect.y=HAND_Y+49+dy;
                game.tween.to(base,{y:HAND_Y},{duration:0.2+i*0.025});
                game.tween.to(icon,{y:HAND_Y-4},{duration:0.2+i*0.025});
                game.tween.to(name,{y:HAND_Y-46},{duration:0.2+i*0.025});
                game.tween.to(effect,{y:HAND_Y+49},{duration:0.2+i*0.025});
            }
            base.alpha = alpha; icon.alpha = alpha;
            base.tint = battle.selected.includes(battle.handIds[i]!) ? '#ffcf70' : focus === i ? '#9de8ff' : '#ffffff';
            base.sy = battle.selected.includes(battle.handIds[i]!) ? 1.06 : 1;
            name.text = SHORT_NAME[id]; name.color = card.color;
            const level = cardLevel(battle.handIds[i] ?? undefined);
            const amount = card.power + (level-1)*5;
            const action = id === 'echo' ? 'Repeat' : id === 'dodge' ? 'Evade' : id === 'guard' ? amount+' block' :
                id === 'riposte' ? amount+' counter' : amount+' dmg';
            effect.text = queued >= 0 ? 'Queued '+(queued+1) : action+' · '+cardSize(id,battle.handIds[i] ?? undefined);
        });
        shownTurn = battle.turn;
        shownRedraw = battle.redraw;
        slots.forEach(({base,icon,name,number},i) => {
            const id = phase === 'execute' ? battle.sequence[i] : battle.hand[cardIndex(battle.queue[i])];
            base.texture = id ? 'slot-lit' : 'slot';
            base.tint = focus === 5+i || (phase === 'execute' && i === battle.activeSlot && id) ? '#9de8ff' : '#ffffff';
            number.color = id ? GOLD : LOW;
            number.text = id ? String(i+1)+' · '+cardSize(id,phase === 'execute' ? battle.sequenceIds[i] : battle.queue[i]) : String(i+1);
            icon.visible = Boolean(id);
            if (id) icon.texture = 'icon-'+id;
            name.text = id ? SHORT_NAME[id] + (planning && id === 'cleave' ? ' · ALL' : planning && battle.foes.length > 1 && battle.targets[battle.queue[i]] !== undefined ? ' · '+(battle.targets[battle.queue[i]]+1) : '') : 'Empty';
            name.color = id ? CARDS[id].color : LOW;
        });
        const available = planning ? maxCapacity() - usedCapacity() : 0;
        const selectedSize = battle.selected.reduce((total,id) => total + cardSize(battle.hand[cardIndex(id)]!,id),0);
        queueButton.alpha = planning && selectedSize > 0 && selectedSize <= available ? 1 : 0.48;
        discardButton.alpha = planning && battle.pips && battle.selected.length ? 1 : 0.48;
        queueButton.setFrame(focus === 10 ? 1 : 0);
        discardButton.setFrame(focus === 11 ? 1 : 0);
        executeButton.setFrame(focus === 12 ? 1 : 0);
        queueText.text = 'QUEUE SELECTED';
        discardText.text = 'DISCARD & DRAW';
        executeText.text = clear ? 'CONTINUE TO MAP' : planning
            ? (battle.queue.length ? 'EXECUTE COMBO' : 'END TURN')
            : phase === 'execute' ? battle.resolving : 'ENEMY TURN';
        executeButton.alpha = clear || planning ? 1 : 0.57;
        footer.text = planning ? 'SELECTED '+battle.selected.length+'  '+Object.entries(battle.statuses).map(([key,value])=>key+' '+value?.stacks).join(' ') : '';
        capacityLabel.text = 'COMBO CAPACITY  '+(planning ? usedCapacity() : battle.sequence.reduce((sum,card,i) => sum + cardSize(card,battle.sequenceIds[i]),0))+' / '+maxCapacity();
        capacityBar.clear();
        capacityBar.draw(c => {
            const cards = planning ? battle.queue.map(id => ({ card:battle.hand[cardIndex(id)]!, id })) :
                battle.sequence.map((card,i) => ({card,id:battle.sequenceIds[i]}));
            const units = cards.flatMap(entry => Array.from({length:cardSize(entry.card,entry.id)},()=>CARDS[entry.card].color));
            const unitWidth = 440 / maxCapacity();
            c.font = 'bold 11px monospace';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            for (let unit=0;unit<maxCapacity();unit++) {
                const x = 20 + unit*unitWidth;
                c.fillStyle = units[unit] ?? '#403644';
                c.fillRect(x,2,unitWidth-5,16);
                c.fillStyle = units[unit] ? '#171522' : '#d2c4c2';
                c.fillText(String(unit+1),x+(unitWidth-5)/2,10);
            }
        });

        markerInk.clear();
        markerInk.draw(c => {
            c.save(); c.translate(0,-136);
            c.beginPath(); c.rect(FIELD.left,FIELD.top,FIELD.right-FIELD.left,FIELD.bottom-FIELD.top); c.clip();
            if (run.room === 'cursed' || run.floor === 3 && run.room === 'boss') {
                for (const q of RUNES) {
                    c.save(); c.translate(q.x,q.y); c.rotate(Math.PI/4);
                    c.fillStyle='#291e36'; c.fillRect(-28,-28,56,56);
                    c.strokeStyle='#ad6bd6'; c.lineWidth=2;
                    c.strokeRect(-24,-24,48,48); c.strokeRect(-14,-14,28,28);
                    c.restore();
                }
            }
            const target = battle.foes[battle.target];
            if (planning && target && target.hp > 0) { c.strokeStyle='#ffdc94'; c.lineWidth=3; c.beginPath(); c.arc(target.x,target.y,FOES[target.id].size*0.56,0,TAU); c.stroke(); }
            for (const f of battle.foes) {
                if (f.hp <= 0) continue;
                c.fillStyle = '#12101bbc';
                c.beginPath(); c.ellipse(f.x,f.y+FOES[f.id].size*0.23,FOES[f.id].size*0.38,FOES[f.id].size*0.10,0,0,TAU);c.fill();
            }
            c.fillStyle = '#12101bdc';
            c.beginPath();c.ellipse(battle.hero.x,battle.hero.y+22,26,8,0,0,TAU);c.fill();
            c.restore();
        });
        fpsInk.clear();
        fpsInk.draw(c => {
            c.save(); c.translate(0,-136);
            if (battle.barrier) circle(c,battle.hero.x,battle.hero.y,37+Math.sin(time*7)*2,'#ace8ef','#85dcec',0.27);
            battle.shots.forEach(s => {
                c.lineCap = 'round'; c.lineWidth = s.card==='fire' ? 15 : 8; c.strokeStyle = CARDS[s.card].color;
                c.beginPath(); c.moveTo(s.x-s.aim.x*28,s.y-s.aim.y*28); c.lineTo(s.x,s.y); c.stroke();
                circle(c,s.x,s.y,8,'#fff1cf',CARDS[s.card].color,0.95);
            });
            battle.foes.filter(f => f.id === 'lich' && f.hp > 0).forEach(f => {
                for (let i=0;i<3;i++) {
                    const a = time*2+i*TAU/3;
                    const x = f.x+Math.cos(a)*77,y=f.y+Math.sin(a)*41;
                    c.fillStyle='#99eafa';c.fillRect(x-4,y-8,8,16);
                }
            });
            for (const fx of battle.effects) paintEffect(c,fx);
            c.restore();
        });
        for (const fx of battle.effects) if (fx.text && !feedback.has(fx)) {
            feedback.set(fx,label(fx.text,fx.x,fx.y-23,23,fx.color,'mono-bold','center',8));
        }
        for (const [fx,text] of feedback) {
            if (!battle.effects.includes(fx)) { text.destroy(); feedback.delete(fx); }
            else { text.y = fx.y-23-fx.age*46; text.alpha = Math.min(1,3*(1-fx.age/fx.life)); }
        }
    };
}

function circle(c: CanvasRenderingContext2D,x:number,y:number,r:number,stroke:string,fill:string,alpha:number): void {
    c.save();c.globalAlpha=alpha;c.strokeStyle=stroke;c.fillStyle=fill;c.lineWidth=2;
    c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();c.restore();
}
function paintZone(c: CanvasRenderingContext2D,z: Zone,opacity: number,struck:boolean): void {
    c.save();
    c.globalAlpha=opacity;
    const color = z.rune ? '#df85fe' : z.puddle ? '#81deae' : '#ff695f';
    c.strokeStyle=color;
    c.fillStyle=color+(struck?'65':'32');
    c.lineWidth=struck?5:3;
    c.setLineDash(struck ? [] : z.stage ? [6,8] : [13,6]);
    c.beginPath();
    if (z.kind === 'arc') {
        c.moveTo(z.x,z.y);c.arc(z.x,z.y,z.r,z.ang-z.arc,z.ang+z.arc);c.closePath();
    } else if (z.kind === 'lane') {
        const a=angle(z,z.end), perp=a+Math.PI/2;
        c.arc(z.x,z.y,z.r,perp,perp+Math.PI);
        c.arc(z.end.x,z.end.y,z.r,perp+Math.PI,perp+TAU);
        c.closePath();
    } else c.arc(z.x,z.y,z.r,0,TAU);
    c.fill(); c.stroke();
    if (z.kind === 'circle' && !z.puddle) {
        c.setLineDash([]); c.beginPath();
        c.moveTo(z.x-9,z.y); c.lineTo(z.x+9,z.y);
        c.moveTo(z.x,z.y-9); c.lineTo(z.x,z.y+9);
        c.stroke();
    }
    c.restore();
}
function paintEffect(c: CanvasRenderingContext2D,fx: Effect): void {
    const ratio=fx.age/fx.life;
    c.save();c.globalAlpha=1-ratio;c.strokeStyle=fx.color;c.lineCap='round';
    c.beginPath();
    if (fx.kind==='slash') {
        const aim=fx.angle??0, r=fx.end?.x??100;
        c.lineWidth=15*(1-ratio)+3;
        c.arc(fx.x,fx.y,r*(0.61+ratio*0.39),aim-1.4,aim+1.4);
    } else if (fx.kind==='dash' && fx.end) {
        c.lineWidth=(1-ratio)*18+1;c.moveTo(fx.x,fx.y);c.lineTo(fx.end.x,fx.end.y);
    } else {
        c.lineWidth=fx.kind==='steam'?9:4;
        c.arc(fx.x,fx.y,7+ratio*(fx.end?.x??71),0,TAU);
        if (fx.kind==='steam') {
            c.moveTo(fx.x+102*ratio,fx.y);
            c.arc(fx.x,fx.y,102*ratio,0,TAU);
        }
    }
    c.stroke();c.restore();
}
