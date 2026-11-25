import { stacks } from '../status.js';
import { game } from '../engine.js';
import { battle, cardIndex, discard, endTurn, execute, FOES, initBattle, maxCapacity, queueSelected, stepBattle } from '../arena.js';
import { cardSize, endRun, ROOMS, run } from '../run.js';
import { padReader } from '../input.js';
import { ACTION_Y, drawArena, HAND_X, HAND_Y, SLOT_X, SLOT_Y, stageTargetAt } from '../ui/arenaView.js';
import { preferences, tapHaptic } from '../ui/preferences.js';
import { chapter, HOT, label, topButtons } from '../ui/chrome.js';

const nearest = (x: number, xs: readonly number[], half: number): number => xs.findIndex(value => Math.abs(x-value) <= half);

export const Play = {
    name: 'play',
    enter(): void {
        if (!battle.hand.length) initBattle();
        game.background.color('#100e19');
        const single = battle.foes.length === 1 ? FOES[battle.foes[0].id].name : ROOMS[run.room];
        label(chapter(),38,29,16,'#e7b882','mono-bold','left');
        label(single,38,57,29,HOT,'serif-bold','left');
        topButtons();
        const render = drawArena();

        let previousPhase = battle.phase;
        let time = 0;
        let reward = '';
        let done = false;
        let lossScheduled = false;
        let focus = -1;
        let picked = -1;
        let confirmPass = false;
        const padInput = padReader();
        let isTouch = game.input.touchDevice;
        const discardSelection = (): void => {
            const marked = [...battle.selected, ...battle.discardOnly];
            if (!marked.length) { battle.note = 'Select cards first.'; return; }
            if (!battle.pips) { battle.note = 'No discards remain this battle.'; return; }
            for (const id of marked) {
                const index = cardIndex(id);
                const card = battle.hand[index];
                if (!card) continue;
                const departing = game.spawn({ texture:'card-'+card, x:HAND_X[index], y:HAND_Y, layer:'hud', z:7 });
                game.tween.to(departing, { y:HAND_Y-85, alpha:0 }, { duration:0.2, onComplete:() => departing.destroy() });
            }
            discard(marked);
            battle.note = '';
        };
        const select = (index: number): void => {
            if (battle.phase !== 'plan') return;
            battle.inspected = index;
            const id = battle.handIds[index];
            if (id === null || id === undefined) return;
            if (battle.queue.includes(id)) { battle.note = 'Remove this card from the queue first.'; return; }
            const selected = battle.selected.indexOf(id);
            if (selected < 0) {
                const used = battle.selected.reduce((sum,cardId) => sum+cardSize(battle.hand[cardIndex(cardId)]!,cardId),0);
                const need = cardSize(battle.hand[index]!,id), remaining = maxCapacity()-used;
                if (need > remaining) { battle.rejectedId=id; game.after(0.5,()=>{ if (battle.rejectedId===id) battle.rejectedId=-1; }); battle.note = 'Not enough Combo Capacity — need '+need+', have '+remaining+'.'; return; }
                battle.discardOnly = battle.discardOnly.filter(cardId => cardId !== id);
                battle.selected.push(id); battle.selected.sort((a,b)=>cardIndex(a)-cardIndex(b)); battle.targets[id] = battle.target;
            } else { battle.selected.splice(selected, 1); delete battle.targets[id]; }
            battle.note = '';
            game.sound.play('select'); tapHaptic();
        };
        // The small orange corner on each card marks a discard without first entering a mode.
        const markDiscard = (index: number): void => {
            const id=battle.handIds[index];
            if (battle.phase !== 'plan' || id == null || battle.queue.includes(id)) return;
            const selected=battle.selected.indexOf(id);
            if (selected >= 0) { battle.selected.splice(selected,1); delete battle.targets[id]; }
            const marked=battle.discardOnly.indexOf(id);
            if (marked >= 0) battle.discardOnly.splice(marked,1); else battle.discardOnly.push(id);
            battle.note='Discard marks do not use capacity.'; game.sound.play('select');
        };
        const moveHand = (from: number, to: number): void => {
            if (from===to || from<0 || to<0) return;
            const [card]=battle.hand.splice(from,1), [id]=battle.handIds.splice(from,1);
            battle.hand.splice(to,0,card); battle.handIds.splice(to,0,id);
            battle.selected.sort((a,b)=>cardIndex(a)-cardIndex(b));
            battle.inspected=to; battle.redraw++; battle.note='Hand reordered.';
        };
        const advance = (): boolean => {
            if (battle.phase === 'clear' && done) { game.scenes.go('reward'); return true; }
            if (battle.phase !== 'plan') return false;
            if (!battle.selected.length) { battle.note = 'Select cards to play, or use Pass Turn.'; return false; }
            if (queueSelected()) execute();
            return false;
        };
        render(time,false,focus,isTouch,null,reward);
        game.step('arena',dt => {
            const pad = padInput();
            if (pad.pressed('start') || game.input.keyPressed('Escape') || game.input.keyPressed('KeyP')) {
                game.scenes.push('pause'); return;
            }
            if (['plan','clear'].includes(battle.phase)) {
                if (pad.pressed('lb') || pad.pressed('rb')) {
                    const direction = pad.pressed('rb') ? 1 : -1;
                    const alive = battle.foes.map((foe,i) => ({foe,i})).filter(entry => entry.foe.hp > 0);
                    const current = alive.findIndex(entry => entry.i === battle.target);
                    if (alive.length) {
                        battle.target = alive[(current+direction+alive.length)%alive.length].i;
                        const foe = battle.foes[battle.target];
                        battle.note = FOES[foe.id].name+' '+foe.hp+'/'+foe.max;
                    }
                }
                if (pad.pressed('right')) focus = focus < 0 ? 0 : (focus+1)%13;
                if (pad.pressed('left')) focus = focus < 0 ? 0 : (focus+12)%13;
                if (pad.pressed('up')) focus = focus < 0 ? 0 : (focus+8)%13;
                if (pad.pressed('down')) focus = focus < 0 ? 0 : (focus+5)%13;
                if (pad.pressed('x') || game.input.keyPressed('KeyQ')) discardSelection();
                if ((pad.pressed('y') || game.input.keyPressed('Enter')) && advance()) return;
                if (pad.pressed('b')) { battle.selected = []; picked = -1; }
                if (pad.pressed('a')) {
                    if (battle.phase === 'clear' || focus === 12) { if (advance()) return; }
                    else if (focus === 11) discardSelection();
                    else if (focus === 10) { battle.note = 'Pass again to take the enemy response.'; }
                    else if (focus >= 0 && focus < 6) { select(focus); picked = -1; }
                    else if (focus >= 6 && focus < 10) {
                        const slot = focus-6;
                        if (picked >= 0) { const from=battle.selected.indexOf(picked); if (from>=0) { battle.selected.splice(from,1); battle.selected.splice(slot,0,picked); } picked=-1; }
                        else picked = battle.selected[slot] ?? -1;
                    }
                }
                for (const p of game.input.pointers) {
                    if (battle.phase !== 'plan' && battle.phase !== 'clear') break;
                    if (p.kind === 'mouse' && p.button !== 0 || !p.released) continue;
                    if (p.isTouch) isTouch = true;
                    focus = -1;
                    if (Math.abs(p.startY-1165) < 30 && Math.abs(p.y-1165) < 30) {
                        if (p.startX < 360 && p.x < 360) { if (confirmPass) { battle.selected=[]; endTurn(); confirmPass=false; } else { confirmPass=true; battle.note='Pass: enemy attacks. Tap Pass Turn again to confirm.'; } }
                        else if (p.startX >= 360 && p.x >= 360) discardSelection();
                        continue;
                    }
                    if (Math.abs(p.startY-ACTION_Y) < 30 && Math.abs(p.y-ACTION_Y) < 30) {
                        if (advance()) return;
                        continue;
                    }
                    if (battle.phase !== 'plan') continue;
                    const foe = stageTargetAt(p.x,p.y);
                    if (foe >= 0 && Math.hypot(p.x-p.startX,p.y-p.startY) < 25) {
                        battle.target = foe;
                        const wasPicked = picked >= 0 && battle.selected.includes(picked);
                        if (wasPicked) { battle.targets[picked]=foe; picked=-1; }
                        else { game.scenes.push('enemy-info'); return; }
                        const enemy = battle.foes[foe];
                        battle.note = FOES[enemy.id].name+' '+enemy.hp+'/'+enemy.max+(stacks(enemy.statuses,'chill') ? ' · CHILLED' : '');
                        continue;
                    }
                    const hand = Math.abs(p.startY-HAND_Y) < 74 ? nearest(p.startX,HAND_X,55) : -1;
                    const from = Math.abs(p.startY-(SLOT_Y+20)) < 57 ? nearest(p.startX,SLOT_X,55) : -1;
                    const to = Math.abs(p.y-(SLOT_Y+20)) < 57 ? nearest(p.x,SLOT_X,55) : -1;
                    const handTo = nearest(p.x,HAND_X,55);
                    if (hand >= 0 && Math.abs(p.x-p.startX)>25 && handTo >= 0 && Math.abs(p.y-HAND_Y)<100) { moveHand(hand,handTo); picked=-1; }
                    else if (hand >= 0 && Math.abs(p.y-HAND_Y)<74 && handTo===hand) {
                        if (p.startY > HAND_Y+25 && p.startX > HAND_X[hand]+20) markDiscard(hand);
                        else if (p.startY < HAND_Y-27 && p.startX < HAND_X[hand]-20) { battle.inspected=hand; battle.note=''; }
                        else select(hand); picked=-1;
                    }
                    else if (from >= 0) {
                        if (from !== to && to >= 0 && battle.selected[from] !== undefined) {
                            const [id] = battle.selected.splice(from,1); battle.selected.splice(to,0,id); battle.selected.sort((a,b)=>cardIndex(a)-cardIndex(b)); picked=-1;
                        } else if (to === from && picked >= 0) {
                            const old = battle.selected.indexOf(picked);
                            if (old >= 0 && old !== from) { battle.selected.splice(old,1); battle.selected.splice(from,0,picked); battle.selected.sort((a,b)=>cardIndex(a)-cardIndex(b)); }
                            else if (old >= 0) { battle.selected.splice(old,1); delete battle.targets[picked]; }
                            picked=-1;
                        } else if (to === from && battle.selected[from] !== undefined) {
                            picked = battle.selected[from]; battle.inspected = cardIndex(picked);
                            battle.note = 'Tap another combo card to reorder, or an enemy to retarget.';
                        }
                    }
                }
            }

            time += dt;
            const wasResolving = battle.phase === 'execute' || battle.phase === 'enemy';
            stepBattle(dt);
            if (preferences.fast && wasResolving && (battle.phase === 'execute' || battle.phase === 'enemy')) stepBattle(dt);
            if (previousPhase !== battle.phase) {
                if (battle.phase === 'plan') { battle.selected = []; battle.discardOnly = []; }
                previousPhase = battle.phase;
            }
            if (battle.phase === 'clear' && !done) {
                done = true;
                if (battle.tutorial) {
                    game.save.write('tutorialSeen', true);
                    run.tutorial = false;
                }
                reward = run.room === 'boss' ? 'Choose a boss reward.' : 'Choose your room reward.';
            }
            if (battle.phase === 'lost' && !lossScheduled) {
                lossScheduled = true;
                game.after(0.57,() => endRun('game-over'));
            }
            render(time,false,picked >= 0 ? cardIndex(picked) : focus,isTouch,null,reward);
        });
    },
};
