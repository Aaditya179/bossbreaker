import { game } from '../engine.js';
import { padReader } from '../input.js';
import { FLOORS, run } from '../run.js';

export const GOLD = '#f4cc92';
export const INK = '#f7e6cc';
export const LOW = '#bba9ad';
export const HOT = '#ff857c';

export function label(text: string, x: number, y: number, size = 22, color = INK, face: 'sans-bold' | 'serif-bold' | 'mono-bold' = 'sans-bold', align: 'center' | 'left' | 'right' = 'center', z = 4) {
    return game.text(text, x, y, { size, color, font: face, align, layer: 'hud', z, shadow: { color: '#100d17', x: 1, y: 2 } });
}
export function sprite(texture: string, x: number, y: number, width?: number, z = 0, id = texture) {
    return game.spawn({ id, texture, x, y, width, layer: 'hud', z });
}
export function framedButton(id: string, text: string, x: number, y: number, onTap: () => void, width = 340) {
    const art = game.spawn({ id, texture: 'button', x, y, width, height: 68, layer: 'hud', z: 1,
        pointer: { onTap: () => { game.sound.play('select'); onTap(); }, onOver: e => e.target.setFrame(1), onOut: e => e.target.setFrame(0) },
    });
    label(text, x, y-1, 24, INK);
    return { art, activate: onTap };
}

export function mute(): void {
    if (game.sound.muted) game.commands.unmute();
    else game.commands.mute();
    game.save.write('muted', game.sound.muted);
}

export function topButtons(pause = true): void {
    const position = { anchor: 'top-right' as const, y: 27, h: 52 };
    game.ui.muteButton({ ...position, x: -26, onClick: () => game.save.write('muted', game.sound.muted) });
    if (pause) {
        game.ui.pauseButton({ ...position, x: -89 });
        game.ui.button({ ...position, x:-270, text:'Status', id:'status-button', onClick:() => game.scenes.push('statuses') });
        game.ui.button({ ...position, x:-168, text:'Deck', id:'deck-button', onClick:() => game.scenes.push('deck') });
    }
}

export function backdrop(floor = run.floor): void {
    game.background.picture('dungeon-'+floor, 'stretch');
    for (const x of [99,621]) {
        const torch = sprite('brazier', x, 542, 145);
        let flicker = 0;
        game.step('torch-'+x, dt => { flicker += dt; torch.setFrame(Math.floor(flicker*9)%3); });
    }
}

export function floorHeading(kicker: string, title: string): void {
    label(kicker, 40, 48, 14, GOLD, 'mono-bold', 'left');
    label(title, 40, 111, 43, INK, 'serif-bold', 'left');
}
export function chapter(): string {
    return 'FLOOR 0'+run.floor+'  /  '+FLOORS[run.floor-1].toUpperCase();
}

type Entry = { art: ReturnType<typeof sprite>; activate: () => void };
export function menuInput(entries: Entry[], canPause = true): void {
    const readPad = padReader();
    let focus = -1;
    game.step('menu-input', () => {
        const pad = readPad();
        if (canPause && (pad.pressed('start') || game.input.keyPressed('Escape') || game.input.keyPressed('KeyP'))) {
            game.scenes.push('pause');
            return;
        }
        if (!entries.length) return;
        const delta = Number(pad.pressed('right') || pad.pressed('down') || game.input.keyPressed('ArrowDown') || game.input.keyPressed('ArrowRight'))
            - Number(pad.pressed('left') || pad.pressed('up') || game.input.keyPressed('ArrowUp') || game.input.keyPressed('ArrowLeft'));
        if (delta) {
            if (focus >= 0) entries[focus].art.tint = '#ffffff';
            focus = (focus < 0 ? 0 : (focus + delta + entries.length)%entries.length);
            entries[focus].art.tint = '#ffe5b0';
        }
        if (pad.pressed('a') || game.input.keyPressed('Enter') || game.input.keyPressed('Space')) {
            entries[Math.max(0,focus)].activate();
        }
    });
}
