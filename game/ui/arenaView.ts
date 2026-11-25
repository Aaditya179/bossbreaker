import { COMBOS } from '../combos.js';
import { preferences } from './preferences.js';
import { cardVisual, RARITY_COLORS } from './cards.js';
import { combatFeedback } from './feedback.js';
import { planReactions, TRIPLES } from '../elements.js';
import { stacks } from '../status.js';
import { game } from '../engine.js';
import { angle, battle, cardIndex, FOES, maxCapacity, usedCapacity, type CombatEvent, type Effect, type Point, type Zone } from '../arena.js';
import { CARDS, EARTH_BLOCK_BASE, EARTH_BLOCK_STEP, ELEMENT_POWER_STEP, MAX_HP, PIPS, cardDescription, cardLevel, cardRarity, cardSize, run } from '../run.js';
import { GOLD, HOT, INK, label, LOW, sprite } from './chrome.js';

const TAU = Math.PI * 2;
const SHORT_NAME: Record<keyof typeof CARDS,string> = {
    sovereign:'Sovereign', immolate:'Blood Blade', bulwark:'Aegis',
    slash:'Slash', cleave:'Cleave', dash:'Dash', frost:'Frost', fire:'Fire',
    storm:'Storm', wind:'Wind', earth:'Earth', dodge:'Dodge', riposte:'Riposte', guard:'Guard', echo:'Echo',
};
export const HAND_Y = 1071;
export const SLOT_Y = 886;
export const ACTION_Y = 1238;
export const HAND_X = [64,182,301,419,538,656];
export const SLOT_X = [64,182,301,419,538,656];

// Presentation coordinates are independent of combat-space positions and collisions.
export const HERO_STAGE = { x: 140, y: 482 };
export function foeStage(index: number): Point {
    return { x: battle.foes.length === 1 ? 510 : 425 + index * 165, y: 472 };
}
export function foeStageSize(index: number): number {
    return ['knight','lich','overlord'].includes(battle.foes[index].id) ? 248 : 174;
}
export function stageTargetAt(x: number, y: number): number {
    return battle.foes.findIndex((foe, i) => {
        const at = foeStage(i), size = foeStageSize(i);
        return foe.hp > 0 && Math.abs(x-at.x) <= size*0.46 && Math.abs(y-at.y) <= size*0.5;
    });
}
// Smoothly transport combat-space particles between the actor anchors. This only
// changes where effects are drawn; their timing and collision remain in arena.ts.
function stagePoint(point: Point): Point {
    const anchors = [{ logical: battle.hero, visual: HERO_STAGE }, ...battle.foes.map((foe,i) => ({logical:foe,visual:foeStage(i)}))];
    let total = 0, dx = 0, dy = 0;
    for (const anchor of anchors) {
        const distance2 = (point.x-anchor.logical.x)**2 + (point.y-anchor.logical.y)**2;
        const weight = 1 / Math.max(1,distance2);
        total += weight;
        dx += (anchor.visual.x-anchor.logical.x)*weight;
        dy += (anchor.visual.y-anchor.logical.y)*weight;
    }
    return {x:point.x+dx/total,y:point.y+dy/total};
}

export function drawArena() {
    const stage = game.graphics({ layer:'hud', width:720, height:600, x:360, y:430 });
    stage.handle.z = 0;
    stage.draw(c => {
        const palette = run.floor === 3 ? ['#291922','#62413a','#a85737'] : run.floor === 2 ? ['#171d31','#36435a','#648da1'] : ['#201b28','#4b4050','#ad805f'];
        const sky = c.createLinearGradient(0,0,0,600);
        sky.addColorStop(0,palette[0]); sky.addColorStop(0.75,palette[1]); sky.addColorStop(1,'#17131d');
        c.fillStyle=sky; c.fillRect(18,20,684,560);
        for (let x=35;x<700;x+=130) {
            c.fillStyle='#100e1b99'; c.fillRect(x,45,82,340);
            c.beginPath(); c.arc(x+41,45,41,Math.PI,0); c.fill();
            c.fillStyle=palette[2]; c.globalAlpha=0.28; c.fillRect(x+12,68,58,245); c.globalAlpha=1;
            c.fillStyle='#1b1722'; c.fillRect(x-8,40,12,360); c.fillRect(x+78,40,12,360);
        }
        c.fillStyle='#18141e'; c.fillRect(18,407,684,150);
        c.fillStyle='#49373c'; c.fillRect(18,405,684,10);
        c.strokeStyle='#665056'; c.lineWidth=3;
        for(let y=435;y<565;y+=36) { c.beginPath(); c.moveTo(18,y); c.lineTo(702,y); c.stroke(); }
        c.strokeStyle='#bc8e68'; c.strokeRect(19,20,682,558);
    });
    const markerInk = game.graphics({ layer:'hud', width:720, height:612, x:360, y:442 });
    markerInk.handle.z = 1;
    const actor = sprite('player',HERO_STAGE.x,HERO_STAGE.y,144,3,'hero');
    const enemies = battle.foes.map((f,i) => {
        const at = foeStage(i), size = foeStageSize(i);
        const art = sprite(f.id,at.x,at.y,size,3,'foe-'+f.id);
        const bar = game.bars.create({ x:at.x,y:at.y+size*0.42,width:Math.min(150,size*0.75),height:9,
            style:'retro', fill:FOES[f.id].color,max:f.max,ghost:true,z:4 });
        return { art, bar };
    });
    const intentLabels = battle.foes.map((foe,i) => label('',battle.foes.length > 1 ? (i === 0 ? 180 : 540) : 510,285,18,HOT,'sans-bold','center',7));
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
    const hand = HAND_X.map((x,i) => cardVisual(x,HAND_Y,108,'hand-'+(i+1)));
    const slots = SLOT_X.map((x,i) => {
        const view=cardVisual(x,SLOT_Y+20,88,'slot-'+(i+1),1);
        view.discardMark.visible=false; view.inspectMark.visible=false;
        return {base:view.base,icon:view.icon,name:view.name,number:view.badge,miniEffect:view.effect,rarity:view.rarity};
    });
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

    const showFeedback = combatFeedback(foeStage);
    let stageCombo: CombatEvent | undefined;
    let comboSource: CombatEvent[] | null=null, comboCursor=0;
    let comboAt = -10;
    const handLift = HAND_X.map(()=>0);
    let lastFrame = 0;
    let shownTurn = 0;
    let shownRedraw = 0;
    return (time: number, discardMode: boolean, focus: number, touch: boolean, stick: {x:number;y:number;dx:number;dy:number} | null, reward: string) => {
        const delta = Math.min(0.1, Math.max(0,time-lastFrame)); lastFrame=time;
        const {phase} = battle;
        if (comboSource!==battle.events) { comboSource=battle.events; comboCursor=0; stageCombo=undefined; }
        const incoming=battle.events.slice(comboCursor).filter(e=>e.kind==='combo' || e.kind==='echo'); comboCursor=battle.events.length;
        const ultimate=incoming.find(e=>['CATACLYSM','CRYSTAL BASTION','METEORFALL','ABSOLUTE TEMPEST'].includes(e.text));
        const latestCombo=ultimate ?? incoming.at(-1);
        if (latestCombo) { stageCombo=latestCombo; comboAt=time; }
        const presentation = showFeedback(battle.events,phase,battle.sequence.length,time);
        const shake = presentation.shake;
        stage.handle.x = 360 + shake;
        const planning = phase === 'plan';
        const aiming = phase === 'execute' || phase === 'enemy';
        const clear = phase === 'clear';
        stage.handle.alpha = phase === 'lost' ? 0.65 : 1;
        vital.text = run.hp+' / '+run.maxHp;
        health.value = run.hp;
        if (lead && bossHealth) bossHealth.value = lead.hp;
        guard.text = String(battle.barrier);
        pips.forEach((pip,i) => pip.alpha = i < battle.pips ? 1 : 0.24);
        turn.text = 'HAND  /  TURN '+battle.turn;
        counts.text = 'DRAW '+battle.draw.length+'  ·  SPENT '+battle.spent.length;
        const lunge = phase === 'execute' && (battle.resolving === 'Slash' || battle.resolving === 'Dash Strike')
            ? Math.sin(Math.PI * battle.cast / 0.18) * (preferences.reducedMotion ? 20 : 115) : 0;
        if (!presentation.frozen) { actor.x = HERO_STAGE.x + lunge + shake; actor.y = HERO_STAGE.y + Math.sin(time*7)*2; }
        actor.sx = 1;
        actor.sy = 1 - battle.cast*0.7;
        enemies.forEach(({art,bar},i) => {
            const f = battle.foes[i];
            const visible = f.hp > 0 || f.flash > 0;
            art.visible = visible;
            const at = foeStage(i), size = foeStageSize(i);
            if (!presentation.frozen) { art.x = at.x + shake + (preferences.reducedMotion ? 0 : Math.sin(time*74)*f.flash*27); art.y = at.y + Math.sin(time*(f.id==='lich' ? 5 : 3)+i)*4; }
            art.tint = f.flash > 0 ? '#ffffff' : stacks(f.statuses,'chill') ? '#a4deff' : '#ffffff';
            art.alpha = f.hp > 0 ? (f.flash > 0 && Math.sin(time*95)>0 ? 0.62 : 1) : f.flash*5;
            art.scale = 1 + f.flash*0.25;
            bar.x = at.x; bar.y = at.y+size*0.42; bar.value = f.hp; bar.visible = visible;
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
        intentLabels.forEach((text,i) => {
            const foe=battle.foes[i];
            const attacks=battle.zones.filter(z=>z.owner===foe && foe.hp>0 && !foe.stagger);
            text.text=attacks.map(z=>z.label+' '+Math.max(1,z.damage-stacks(foe.statuses,'chill')*4-stacks(foe.statuses,'weaken')*3)).join(' / ');
            text.scale=Math.min(1,(battle.foes.length>1 ? 21 : 36)/Math.max(1,text.text.length));
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
        else if (planning && battle.inspected >= 0 && battle.selected.length < 2) hint.text = cardDescription(battle.hand[battle.inspected]!,battle.handIds[battle.inspected] ?? undefined);
        else if (battle.tutorial && planning && !battle.steamed && battle.selected.length < 2) hint.text = 'Select elements, then tap Play Combo.';
        else if (planning) {
            const order = battle.selected.map(id => battle.hand[cardIndex(id)]!);
            const levels=battle.selected.map(id=>cardLevel(id));
            const plans=planReactions(order,levels);
            const previews=plans.filter((id):id is NonNullable<typeof id>=>Boolean(id)).map(id=>COMBOS[id].name.toUpperCase()+' · '+COMBOS[id].effect);
            for(let i=0;i+2<order.length;i++) {
                const triple=TRIPLES.find(t=>t.cards.every((card,j)=>order[i+j]===card));
                if(triple && levels.slice(i,i+3).some(level=>level<3)) { const missing=triple.cards.filter((_,j)=>levels[i+j]<3); previews.push(COMBOS[triple.id].name.toUpperCase()+' LOCKED · '+[...new Set(missing)].join('/')+' needs Lv 3'); }
            }
            hint.text = previews.length ? previews.join('  ·  ') : 'Drag to reorder · tap × for discard-only.';
        }
        else if (phase === 'enemy') hint.text = 'Guard absorbs damage until the response ends.';
        else hint.text = 'Your combo resolves automatically.';

        hint.scale = Math.min(1, 57 / Math.max(1,hint.text.length));
        const held = planning ? game.input.pointers.find(p=>p.down && Math.abs(p.startY-HAND_Y)<74) : undefined;
        const dragFrom = held ? HAND_X.findIndex(x=>Math.abs(x-held.startX)<55) : -1;
        const dragTo = held && Math.abs(held.x-held.startX)>25 ? HAND_X.findIndex(x=>Math.abs(x-held.x)<59) : -1;
        hand.forEach(({base,icon,name,effect,badge,discardMark,inspectMark,rarity},i) => {
            const id = battle.hand[i];
            const card = id ? CARDS[id] : null;
            base.visible = icon.visible = name.visible = effect.visible = rarity.visible = Boolean(card);
            const selection = battle.selected.indexOf(battle.handIds[i]!);
            badge.text = selection >= 0 ? String(selection+1) : '';
            badge.visible = Boolean(card) && selection >= 0;
            discardMark.visible = inspectMark.visible = Boolean(card) && planning;
            discardMark.color = battle.discardOnly.includes(battle.handIds[i]!) ? '#ffd86c' : HOT;
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
            let targetX=HAND_X[i];
            if (held && dragFrom>=0 && dragTo>=0) {
                if (i===dragFrom) targetX=held.x;
                else if (dragFrom<dragTo && i>dragFrom && i<=dragTo) targetX=HAND_X[i-1];
                else if (dragFrom>dragTo && i>=dragTo && i<dragFrom) targetX=HAND_X[i+1];
            }
            const ease=preferences.reducedMotion ? 1 : Math.min(1,delta*24);
            base.x+=(targetX-base.x)*ease; const cx=base.x; icon.x=cx;name.x=cx;effect.x=cx;badge.x=cx+38;discardMark.x=cx+40;inspectMark.x=cx-36;rarity.x=cx;
            const hover=planning && game.input.pointer && Math.abs(game.input.pointer.x-HAND_X[i])<54 && Math.abs(game.input.pointer.y-HAND_Y)<70;
            const tilt=preferences.reducedMotion ? 0 : hover ? Math.max(-0.14,Math.min(0.14,(game.input.pointer!.x-HAND_X[i])/400)) : 0;
            base.rot+=(tilt-base.rot)*ease; icon.rot=base.rot;
            if (!dy) { const targetLift = i===dragFrom && dragTo>=0 ? 20 : selection >= 0 || battle.discardOnly.includes(battle.handIds[i]!) ? 12 : 0; handLift[i] += (targetLift-handLift[i])*(preferences.reducedMotion ? 1 : Math.min(1,delta*18)); const lift=handLift[i]; base.y=HAND_Y-lift; icon.y=HAND_Y-4-lift; name.y=HAND_Y-46-lift; effect.y=HAND_Y+49-lift; badge.y=HAND_Y-62-lift; discardMark.y=HAND_Y+39-lift; inspectMark.y=HAND_Y-55-lift; }
            base.alpha = alpha; icon.alpha = alpha;
            base.tint = battle.rejectedId === battle.handIds[i] ? '#ff4b4b' : battle.discardOnly.includes(battle.handIds[i]!) ? '#ff8b80' : battle.selected.includes(battle.handIds[i]!) ? '#ffcf70' : focus === i ? '#9de8ff' : '#ffffff';
            base.sy = battle.selected.includes(battle.handIds[i]!) ? 1.06 : 1;
            name.text = SHORT_NAME[id]; name.color = card.color;
            rarity.text=cardRarity(id).toUpperCase(); rarity.y=HAND_Y+23-(handLift[i]||0); rarity.color=RARITY_COLORS[cardRarity(id)];
            const level = cardLevel(battle.handIds[i] ?? undefined);
            const amount = card.power + (level-1)*ELEMENT_POWER_STEP;
            const action = id === 'wind' ? amount+' + evade' : id === 'earth' ? (EARTH_BLOCK_BASE+(level-1)*EARTH_BLOCK_STEP)+' block' : id === 'echo' ? 'Repeat' : id === 'dodge' ? 'Evade' : id === 'guard' || id === 'bulwark' ? amount+' block' :
                id === 'riposte' ? amount+' counter' : amount+' dmg';
            effect.text = queued >= 0 ? 'Queued '+(queued+1) : action+' · Lv '+level;
        });
        shownTurn = battle.turn;
        shownRedraw = battle.redraw;
        slots.forEach(({base,icon,name,number,miniEffect,rarity},i) => {
            const id = phase === 'execute' ? battle.sequence[i] : battle.hand[cardIndex(battle.selected[i])];
            base.visible = number.visible = Boolean(id);
            if (id) base.texture='card-'+id;
            miniEffect.visible=rarity.visible=Boolean(id);
            if (id) { miniEffect.text='1 CAST'; rarity.text=cardRarity(id).toUpperCase(); rarity.color=RARITY_COLORS[cardRarity(id)]; }
            base.tint = focus === 5+i || (phase === 'execute' && i === battle.activeSlot && id) ? '#9de8ff' : '#ffffff';
            const active=phase === 'execute' && i === battle.activeSlot && Boolean(id);
            base.y=SLOT_Y+20-(active ? 15 : 0); icon.y=SLOT_Y+12-(active ? 15 : 0); name.y=SLOT_Y-17-(active ? 15 : 0); number.y=SLOT_Y+5-(active ? 15 : 0); miniEffect.y=SLOT_Y+59-(active ? 15 : 0); rarity.y=SLOT_Y+38-(active ? 15 : 0);
            base.scale=active ? 1.08 : 1;
            number.color = id ? GOLD : LOW;
            number.text = id ? String(i+1)+' · '+cardSize(id,phase === 'execute' ? battle.sequenceIds[i] : battle.selected[i]) : String(i+1);
            icon.visible = Boolean(id);
            if (id) icon.texture = 'icon-'+id;
            name.text = id ? SHORT_NAME[id] + (planning && id === 'cleave' ? ' · ALL' : planning && battle.foes.length > 1 && battle.targets[battle.selected[i]] !== undefined ? ' · '+(battle.targets[battle.selected[i]]+1) : '') : '';
            name.color = id ? CARDS[id].color : LOW;
        });
        const available = planning ? maxCapacity() - usedCapacity() : 0;
        const selectedSize = battle.selected.reduce((total,id) => total + cardSize(battle.hand[cardIndex(id)]!,id),0);
        queueButton.alpha = planning ? 1 : 0.48;
        discardButton.alpha = planning && battle.pips && (battle.selected.length+battle.discardOnly.length) ? 1 : 0.48;
        queueButton.setFrame(focus === 10 ? 1 : 0);
        discardButton.setFrame(focus === 11 ? 1 : 0);
        executeButton.setFrame(focus === 12 ? 1 : 0);
        queueText.text = 'PASS TURN';
        discardText.text = 'DISCARD & DRAW';
        executeText.text = clear ? 'CONTINUE TO MAP' : planning
            ? 'PLAY COMBO ('+battle.selected.length+' CARDS)'
            : phase === 'execute' ? battle.resolving : 'ENEMY TURN';
        executeButton.alpha = clear || planning && selectedSize > 0 && selectedSize <= maxCapacity() ? 1 : 0.45;
        footer.text = planning ? 'PLAY '+battle.selected.length+' · × DISCARD '+battle.discardOnly.length+'  '+Object.entries(battle.statuses).map(([key,value])=>key+' '+value?.stacks).join(' ') : '';
        capacityLabel.color = planning && selectedSize > maxCapacity() ? HOT : GOLD;
        capacityLabel.text = (planning && selectedSize > maxCapacity() ? 'TOO MANY CASTS: REMOVE '+(selectedSize-maxCapacity())+' · ' : 'ELEMENTAL CASTS  ')+(planning ? selectedSize : battle.sequence.reduce((sum,card,i) => sum + cardSize(card,battle.sequenceIds[i]),0))+' / '+maxCapacity();
        capacityBar.clear();
        capacityBar.draw(c => {
            const cards = planning ? battle.selected.map(id => ({ card:battle.hand[cardIndex(id)]!, id })) :
                battle.sequence.map((card,i) => ({card,id:battle.sequenceIds[i]}));
            const units = cards.flatMap(entry => Array.from({length:cardSize(entry.card,entry.id)},()=>CARDS[entry.card].color));
            const unitWidth = 440 / maxCapacity();
            c.font = 'bold 11px monospace';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            for (let unit=0;unit<maxCapacity();unit++) {
                const x = 20 + unit*unitWidth;
                c.fillStyle = planning && selectedSize > maxCapacity() && unit === maxCapacity()-1 ? '#ff695f' : units[unit] ?? '#403644';
                c.fillRect(x,2,unitWidth-5,16);
                c.fillStyle = units[unit] ? '#171522' : '#d2c4c2';
                c.fillText(String(unit+1),x+(unitWidth-5)/2,10);
            }
        });

        markerInk.clear();
        markerInk.draw(c => {
            c.save(); c.translate(0,-136);
            c.fillStyle = '#0a0910aa';
            c.beginPath(); c.ellipse(HERO_STAGE.x,HERO_STAGE.y+64,58,13,0,0,TAU); c.fill();
            battle.foes.forEach((foe,i) => {
                if (foe.hp <= 0) return;
                const at = foeStage(i), size = foeStageSize(i);
                c.fillStyle = '#0a0910aa'; c.beginPath(); c.ellipse(at.x,at.y+size*0.43,size*0.34,12,0,0,TAU); c.fill();
                const areaPreview = planning && battle.selected.some(id => battle.hand[cardIndex(id)] === 'cleave');
                if (planning && (battle.target === i || areaPreview)) {
                    c.strokeStyle=areaPreview ? '#ff857c' : '#ffdc94'; c.lineWidth=3; c.beginPath(); c.ellipse(at.x,at.y+size*0.43,size*0.39,16,0,0,TAU); c.stroke();
                }
            });
            c.restore();
        });
        fpsInk.clear();
        fpsInk.draw(c => {
            c.save(); c.translate(0,-136);
            if (battle.barrier) {
                const magma=Boolean(battle.powerUsed.magmaArmor);
                circle(c,HERO_STAGE.x,HERO_STAGE.y,66+Math.sin(time*7)*2,magma?'#e77845':'#ace8ef',magma?'#ffd48b':'#85dcec',0.27);
                if(magma) circle(c,HERO_STAGE.x,HERO_STAGE.y,72,'#00000000','#ff9d52',0.45);
            }
            battle.shots.forEach(s => {
                const at=stagePoint(s), previous=stagePoint({x:s.x-s.aim.x*28,y:s.y-s.aim.y*28});
                c.lineCap = 'round'; c.lineWidth = s.card==='fire' ? 15 : 8; c.strokeStyle = CARDS[s.card].color;
                c.beginPath(); c.moveTo(previous.x,previous.y); c.lineTo(at.x,at.y); c.stroke();
                circle(c,at.x,at.y,8,'#fff1cf',CARDS[s.card].color,0.95);
            });
            const isUltimate=Boolean(stageCombo && ['CATACLYSM','CRYSTAL BASTION','METEORFALL','ABSOLUTE TEMPEST'].includes(stageCombo.text));
            const duration=isUltimate ? 0.9 : 0.52;
            if (stageCombo && time-comboAt < duration && !preferences.reducedMotion) {
                const at=foeStage(Math.max(0,stageCombo.target ?? 0)), age=(time-comboAt)/duration;
                const name=stageCombo.text;
                c.save(); c.globalAlpha=Math.max(0,1-age); c.strokeStyle=stageCombo.color ?? '#ffdb91'; c.lineWidth=isUltimate?7:4;
                if (name.includes('BASTION') || name.includes('FORTRESS') || name.includes('MAGMA') || name.includes('MAGNETIC')) {
                    c.strokeStyle=name.includes('MAGMA')?'#ff925e':'#a2eaff';
                    for(let n=0;n<3;n++){c.beginPath();c.arc(HERO_STAGE.x,HERO_STAGE.y,60+n*21+age*8,0,TAU);c.stroke();}
                } else if (name.includes('METEOR')) {
                    const x=at.x-150+age*150,y=at.y-260+age*260;
                    c.strokeStyle='#ffad5f';c.beginPath();c.moveTo(x-85,y-100);c.lineTo(x,y);c.stroke();circle(c,x,y,35,'#ffdd85','#fb773f',0.9);
                } else if (name.includes('WIND') || name.includes('STORM') || name.includes('TEMPEST') || name.includes('CATACLYSM')) {
                    for(let n=0;n<5;n++){const y=at.y-75+n*32;c.beginPath();c.moveTo(at.x-115,y);c.quadraticCurveTo(at.x,y-45+age*50,at.x+115,y);c.stroke();}
                    if(name.includes('TEMPEST') || name.includes('CATACLYSM')) { c.strokeStyle='#fff298';c.beginPath();c.moveTo(at.x-20,at.y-130);c.lineTo(at.x+20,at.y-45);c.lineTo(at.x-10,at.y-35);c.lineTo(at.x+35,at.y+80);c.stroke(); }
                } else if (name.includes('OVERLOAD') || name.includes('SURGE') || name.includes('SHATTER')) {
                    for (let n=0;n<5;n++) { const y=at.y-75+n*32; c.beginPath(); c.moveTo(at.x-105,y); c.lineTo(at.x-50,y-16); c.lineTo(at.x-23,y+10); c.lineTo(at.x+20,y-15); c.lineTo(at.x+90,y); c.stroke(); }
                } else {
                    for (let n=0;n<8;n++) { const a=n*TAU/8, r=35+age*100; c.beginPath(); c.moveTo(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r); c.lineTo(at.x+Math.cos(a)*(r+25),at.y+Math.sin(a)*(r+25)); c.stroke(); }
                }
                c.restore();
            }
            for (const fx of battle.effects) {
                const at=stagePoint(fx);
                const end = fx.kind === 'dash' && fx.end ? stagePoint(fx.end) : fx.end;
                paintEffect(c,{...fx,...at,end,angle:fx.kind === 'slash' ? 0 : fx.angle});
            }
            c.restore();
        });
        for (const fx of battle.effects) if (fx.text && !/^((CRIT )?\d+)$/.test(fx.text) && !feedback.has(fx)) {
            const at=stagePoint(fx);
            feedback.set(fx,label(fx.text,at.x,at.y-23,23,fx.color,'mono-bold','center',8));
        }
        for (const [fx,text] of feedback) {
            if (!battle.effects.includes(fx)) { text.destroy(); feedback.delete(fx); }
            else { text.y = stagePoint(fx).y-23-fx.age*46; text.alpha = Math.min(1,3*(1-fx.age/fx.life)); }
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
