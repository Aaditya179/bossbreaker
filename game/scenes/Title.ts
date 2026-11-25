import { game } from '../engine.js';
import { startRun } from '../run.js';
import { backdrop, GOLD, INK, label, sprite, topButtons } from '../ui/chrome.js';

export const Title = {
    name: 'title',
    enter(): void {
        backdrop(1);
        topButtons(false);
        const ink = game.graphics({ layer: 'hud' });
        ink.handle.z = 2;
        ink.line(87, 231, 315, 231, 1, GOLD);
        ink.line(405, 231, 633, 231, 1, GOLD);
        sprite('icon-boss',360,230,60,3);
        label('BOSSBREAKER',360,321,76,GOLD,'serif-bold');
        label('A Spellblade descent',360,399,32,INK,'serif-bold');
        const knight = sprite('knight',360,642,430,1,'title-knight');
        const hero = sprite('player',353,828,214,2,'title-hero');
        game.tween.to(knight,{y:knight.y-10},{duration:1.95,yoyo:true,loop:true});
        game.tween.to(hero,{y:hero.y-5},{duration:1.35,yoyo:true,loop:true});
        label('Read the attack. Plan your combo. Break the boss.',360,971,23);
        game.ui.button({ id:'play-button',anchor:'center',y:415,h:74,text:'Enter the dungeon',style:'good',icon:'play',onClick:startRun });
        game.step('start-key', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) startRun();
        });
        label('THREE FLOORS   /   ONE SPELLBLADE',360,1161,17,GOLD,'mono-bold');
    },
};
