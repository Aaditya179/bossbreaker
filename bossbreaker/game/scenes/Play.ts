import { stacks } from '../status.js';
import { game } from '../engine.js';
import { battle, cardIndex, discard, endTurn, execute, FOES, initBattle, queueCard, queueSelected, stepBattle } from '../arena.js';
import { endRun, ROOMS, run } from '../run.js';
import { padReader } from '../input.js';
import { ACTION_Y, drawArena, HAND_X, HAND_Y, SLOT_X, SLOT_Y, stageTargetAt } from '../ui/arenaView.js';
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
        const padInput = padReader();
        let isTouch = game.input.touchDevice;
        const discardSelection = (): void => {
            if (!battle.selected.length) { battle.note = 'Select cards first.'; return; }
            if (!battle.pips) { battle.note = 'No discards remain this battle.'; return; }
            for (const id of battle.selected) {
                const index = cardIndex(id);
                const card = battle.hand[index];
                if (!card) continue;
                const departing = game.spawn({ texture:'card-'+card, x:HAND_X[index], y:HAND_Y, layer:'hud', z:7 });
                game.tween.to(departing, { y:HAND_Y-85, alpha:0 }, { duration:0.2, onComplete:() => departing.destroy() });
            }
            discard(battle.selected);
            battle.note = '';
        };
        const select = (index: number): void => {
            if (battle.phase !== 'plan') return;
            battle.inspected = index;
            const id = battle.handIds[index];
            if (id === null || id === undefined) return;
            if (battle.queue.includes(id)) { battle.note = 'Remove this card from the queue first.'; return; }
            const selected = battle.selected.indexOf(id);
            if (selected < 0) battle.selected.push(id); else battle.selected.splice(selected, 1);
            battle.note = '';
            game.sound.play('select');
        };
        const advance = (): boolean => {
            if (battle.phase === 'clear' && done) { game.scenes.go('reward'); return true; }
            if (battle.queue.length) execute(); else endTurn();
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
                    else if (focus === 10) queueSelected();
                    else if (focus >= 0 && focus < 5) { select(focus); picked = -1; }
                    else if (focus >= 5 && focus < 10) {
                        const slot = focus-5;
                        if (picked >= 0) { queueCard(picked,slot); picked = -1; }
                        else picked = battle.queue[slot] ?? -1;
                    }
                }
                for (const p of game.input.pointers) {
                    if (battle.phase !== 'plan' && battle.phase !== 'clear') break;
                    if (p.kind === 'mouse' && p.button !== 0 || !p.released) continue;
                    if (p.isTouch) isTouch = true;
                    focus = -1;
                    if (Math.abs(p.startY-1165) < 30 && Math.abs(p.y-1165) < 30) {
                        if (p.startX < 360 && p.x < 360) queueSelected();
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
                        const enemy = battle.foes[foe];
                        battle.note = FOES[enemy.id].name+' '+enemy.hp+'/'+enemy.max+(stacks(enemy.statuses,'chill') ? ' · CHILLED' : '');
                        continue;
                    }
                    const hand = Math.abs(p.startY-HAND_Y) < 74 ? nearest(p.startX,HAND_X,60) : -1;
                    const from = Math.abs(p.startY-(SLOT_Y+20)) < 57 ? nearest(p.startX,SLOT_X,74) : -1;
                    const to = Math.abs(p.y-(SLOT_Y+20)) < 57 ? nearest(p.x,SLOT_X,74) : -1;
                    if (hand >= 0 && to >= 0) { select(hand); picked = -1; }
                    else if (hand >= 0 && Math.abs(p.y-HAND_Y) < 74 && nearest(p.x,HAND_X,60) === hand) { select(hand); picked = -1; }
                    else if (from >= 0) {
                        if (from !== to && to >= 0 && battle.queue[from] !== undefined) {
                            queueCard(battle.queue[from],to);
                            picked = -1;
                        } else if (to === from && picked >= 0) {
                            if (battle.queue[from] === picked) queueCard(picked);
                            else queueCard(picked,from);
                            picked = -1;
                        } else if (to === from && battle.queue[from] !== undefined) {
                            picked = battle.queue[from];
                            battle.inspected = cardIndex(picked);
                        }
                    }
                }
            }

            time += dt;
            stepBattle(dt);
            if (previousPhase !== battle.phase) {
                if (battle.phase === 'plan') { battle.selected = []; }
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
