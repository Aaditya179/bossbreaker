import { game } from '../engine.js';
import { startRun } from '../run.js';
import { preferences, savePreferences } from '../ui/preferences.js';
import { mute } from '../ui/chrome.js';

let stopKeys = (): void => {};

export const Pause = {
    name: 'pause',
    enter(): void {
        game.ui.panel({ anchor:'center',w:720,h:1280,z:70,safeArea:false,style:{fill:'#090817cb',radius:0,border:0,bevel:0,gloss:0,shadow:0} });
        const menu = game.ui.window({ anchor:'center',w:480,h:'auto',z:80,title:'Paused',titleHeight:66,layout:{padding:25,gap:16,align:'stretch'} });
        const resume = () => game.scenes.pop();
        const restart = () => { game.scenes.pop(); startRun(); };
        game.ui.button({ parent:menu,h:75,text:'Resume',style:'good',icon:'play',onClick:resume });
        game.ui.button({ parent:menu,h:70,text:'Restart Run',icon:'restart',onClick:restart });
        game.ui.button({ parent:menu,h:70,text:'Toggle Sound',icon:'sound-on',onClick:mute });
        const motion=game.ui.button({parent:menu,h:62,text:'Reduced motion: '+(preferences.reducedMotion?'ON':'OFF'),onClick:()=>{preferences.reducedMotion=!preferences.reducedMotion;savePreferences();motion.ui.text='Reduced motion: '+(preferences.reducedMotion?'ON':'OFF');}});
        const speed=game.ui.button({parent:menu,h:62,text:'Combat speed: '+(preferences.fast?'FAST':'NORMAL'),onClick:()=>{preferences.fast=!preferences.fast;savePreferences();speed.ui.text='Combat speed: '+(preferences.fast?'FAST':'NORMAL');}});
        const shake=game.ui.button({parent:menu,h:55,text:'Shake: '+['OFF','LOW','NORMAL'][preferences.shake],onClick:()=>{preferences.shake=(preferences.shake+1)%3;savePreferences();shake.ui.text='Shake: '+['OFF','LOW','NORMAL'][preferences.shake];}});
        const haptic=game.ui.button({parent:menu,h:55,text:'Haptics: '+(preferences.haptics?'ON':'OFF'),onClick:()=>{preferences.haptics=!preferences.haptics;savePreferences();haptic.ui.text='Haptics: '+(preferences.haptics?'ON':'OFF');}});
        const volume=game.ui.button({parent:menu,h:55,text:'SFX volume: '+Math.round(preferences.sfxVolume*100)+'%',onClick:()=>{preferences.sfxVolume=preferences.sfxVolume===1 ? 0.5 : preferences.sfxVolume===0.5 ? 0 : 1;savePreferences();volume.ui.text='SFX volume: '+Math.round(preferences.sfxVolume*100)+'%';}});
        game.ui.modal(menu);
        const keys = game.kernel.input.consume('shell', { key: event => {
            if (event.type === 'up' && !game.input.ignoring && (event.code === 'Escape' || event.code === 'KeyP')) {
                event.claim();
                resume();
            }
        } });
        stopKeys = () => keys.cancel();
        let first = true;
        let padHeld = true;
        game.tween.from(menu.ui,{y:36},{duration:0.24,ease:'easeOutQuad'});
        game.step('pause',() => {
            const down = game.kernel.input.gamepads.some(pad => pad.connected && pad.button('start'));
            if (!first && !padHeld && down) resume();
            padHeld = down;
            first = false;
        });
    },
    exit(): void { stopKeys(); },
};
