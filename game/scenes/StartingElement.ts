import { game } from '../engine.js';
import { CARDS, chooseStartingElement, ELEMENTS } from '../run.js';
import { cardVisual } from '../ui/cards.js';
import { backdrop, GOLD, INK, label, LOW } from '../ui/chrome.js';

export const StartingElement = {
    name:'starting-element',
    enter(): void {
        backdrop();
        label('CHOOSE YOUR ELEMENT',360,110,42,GOLD,'serif-bold');
        label('Begin with one school of magic.',360,165,23,INK);
        label('Unlock up to three during your run.',360,200,20,LOW);
        ELEMENTS.forEach((element,i)=>{
            const x=[150,360,570,255,465][i], y=i<3 ? 430 : 770;
            const visual=cardVisual(x,y,160,'start-'+element,2,()=>chooseStartingElement(element));
            visual.show(element);
            visual.effect.text='LV 1';
            const detail=label(CARDS[element].action,x,y+137,19,CARDS[element].color);
            detail.scale=Math.min(1,18/Math.max(1,detail.text.length));
        });
        label('Tap an element to enter the dungeon.',360,1080,23,GOLD);
    },
};
