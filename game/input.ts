import { game } from './engine.js';

export function padReader() {
    let previous = new Set<string>();
    return () => {
        const pad = game.input.gamepads.find(device => device.connected);
        const buttons = ['a','b','x','y','lb','rb','rt','start','left','right','up','down'];
        const down = new Set(buttons.filter(button => pad?.button(button)));
        const walkX = pad?.axis('lx') ?? 0, walkY = pad?.axis('ly') ?? 0;
        if (walkX < -0.55) down.add('left');
        if (walkX > 0.55) down.add('right');
        if (walkY < -0.55) down.add('up');
        if (walkY > 0.55) down.add('down');
        const edges = new Set([...down].filter(button => !previous.has(button)));
        previous = down;
        return { pressed: (button: string) => edges.has(button), walkX, walkY, aimX: pad?.axis('rx') ?? 0, aimY: pad?.axis('ry') ?? 0 };
    };
}

export function keyAxis(positive: string, negative: string): number {
    return Number(game.input.keyDown(positive)) - Number(game.input.keyDown(negative));
}
