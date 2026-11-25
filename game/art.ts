import { game } from './engine.js';
import { CARDS, cardRarity, type Card } from './run.js';
import { RARITY_COLORS } from './ui/cards.js';
// from './run.js';

type Ctx = CanvasRenderingContext2D;
const rect = (c: Ctx, x: number, y: number, w: number, h: number, fill: string): void => {
    c.fillStyle = fill;
    c.fillRect(x,y,w,h);
};
function poly(c: Ctx, fill: string, points: number[]): void {
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(points[0],points[1]);
    for (let i = 2; i < points.length; i+=2) c.lineTo(points[i],points[i+1]);
    c.closePath();
    c.fill();
}

export const PALETTE = [
    { floor: '#313038', light: '#46404a', shadow: '#1d1b26', trim: '#777071', glow: '#ffb46b' },
    { floor: '#26333f', light: '#364b57', shadow: '#171e2d', trim: '#7398a7', glow: '#8fe7ff' },
    { floor: '#382730', light: '#51333b', shadow: '#201923', trim: '#a5745a', glow: '#ff8659' },
];

function masonry(c: Ctx, w: number, h: number, layer: typeof PALETTE[number], pitch: number): void {
    rect(c,0,0,w,h,layer.shadow);
    for (let row = 0; row < h/pitch + 1; row++) {
        const y = row*pitch;
        for (let col = -1; col < w/52+1; col++) {
            const x = col*52 + row%2*26;
            const n = Math.abs((row*71+col*31+row*col*7)%19);
            rect(c,x+2,y+2,49,pitch-3,n%5 === 0 ? layer.light : layer.floor);
            rect(c,x+3,y+2,46,1,layer.light);
            rect(c,x+4+n,y+5+n%7,6+n%11,1,layer.shadow);
            if (n%3 === 0) poly(c,layer.shadow,[x+28,y+4,x+36,y+8,x+31,y+11,x+41,y+pitch,x+33,y+pitch,x+29,y+10]);
        }
    }
}

function lamp(c: Ctx, x: number, y: number, color: string, frame = 0): void {
    const lit = c.createRadialGradient(x,y,0,x,y,38);
    lit.addColorStop(0,color+'66');
    lit.addColorStop(0.45,color+'25');
    lit.addColorStop(1,color+'00');
    c.fillStyle = lit;
    c.fillRect(x-38,y-38,76,76);
    poly(c,'#241b26',[x-12,y+4,x+12,y+4,x+7,y+11,x-7,y+11]);
    rect(c,x-11,y+4,22,2,'#837077');
    poly(c,color,[x-7,y+3,x-8,y-5,x-3,y-4,x+frame-2,y-17,x+5,y-10,x+7,y-3,x+5,y+4]);
    poly(c,'#fff2c3',[x-3,y+3,x-3,y-4,x+1,y-8,x+4,y+2]);
}

function arch(c: Ctx, x: number, y: number, w: number, h: number, layer: typeof PALETTE[number]): void {
    const peak = (a: number): number[] => [x-w/2+a,y+h,x-w/2+a,y+30,x-w/3+a,y+14,x,y+a,x+w/3-a,y+14,x+w/2-a,y+30,x+w/2-a,y+h];
    poly(c,layer.shadow,peak(0));
    poly(c,layer.trim,peak(3));
    poly(c,layer.light,peak(5));
    poly(c,'#10111b',peak(9));
    for(let bar = -1; bar <= 1; bar++) rect(c,x+bar*12-2,y+31,4,h-30,layer.light);
    rect(c,x-w/2+9,y+h-17,w-18,3,layer.light);
}

function armor(c: Ctx, variant: string): void {
    const ice = variant === 'lich', abyss = variant === 'overlord', stone = variant === 'gargoyle', hero = variant === 'player', skeleton = variant === 'archer';
    const main = hero ? '#3e468c' : ice ? '#3c829c' : stone ? '#656376' : abyss ? '#7b4350' : skeleton ? '#655179' : '#615164';
    const light = hero ? '#7582c6' : ice ? '#8cdef2' : stone ? '#a09b9f' : abyss ? '#cd8a54' : skeleton ? '#d7c9be' : '#a67676';
    const edge = hero ? '#f2c57b' : ice ? '#c5f5ff' : abyss ? '#ffc56f' : stone ? '#c58459' : skeleton ? '#d496ff' : '#e4585e';
    if (stone || abyss) {
        const wing = (side: number): void => {
            c.save();
            c.translate(24,0);
            c.scale(side,1);
            poly(c,'#181520',[-1,27,11,13,23,9,22,33,18,29,15,37,11,33,5,39]);
            poly(c,main,[2,26,11,16,21,12,19,23,17,29,14,25,10,32,8,29,4,35]);
            poly(c,light,[3,26,12,17,21,12,16,20,12,21,7,27]);
            c.restore();
        };
        wing(-1); wing(1);
    }
    poly(c,'#13131f',[9,41,13,20,18,17,30,17,35,20,40,41,30,44,23,40,16,45]);
    poly(c,main,[12,39,16,21,32,21,37,39,30,40,24,37,15,42]);
    poly(c,light,[16,22,23,20,29,21,31,30,27,29,23,32,18,30]);
    rect(c,15,32,18,3,edge);
    rect(c,21,32,5,3,'#fff0b0');
    if (!ice) {
        rect(c,14,38,8,6,'#1b1928'); rect(c,26,38,8,6,'#1b1928');
        rect(c,13,43,10,2,main); rect(c,26,43,10,2,main);
    } else {
        poly(c,'#62bad0',[15,34,29,34,34,40,27,42,24,46,19,42,14,41]);
    }
    if (!hero && !ice && !skeleton) {
        poly(c,'#291e29',[15,16,9,11,8,3,11,6,14,10,19,11,28,11,34,9,38,3,39,11,34,18]);
        poly(c,edge,[15,12,11,10,9,4,13,8,18,11,27,11,34,7,38,3,35,11,31,14]);
    }
    if (abyss || ice) {
        poly(c,edge,[17,14,16,6,20,9,24,3,28,9,32,6,31,14]);
        rect(c,23,7,2,4,'#fff4c0');
    }
    poly(c,'#171522',[16,22,14,15,17,9,23,7,30,9,34,15,31,22,24,26]);
    poly(c,main,[16,16,18,11,23,9,29,11,32,15,29,18,25,13,20,15,18,19]);
    poly(c,skeleton || ice ? '#c9d5d5' : '#282335',[18,17,23,15,29,16,29,21,25,24,21,22]);
    rect(c,19,17,3,2,edge); rect(c,26,17,3,2,edge);
    if (ice || skeleton) rect(c,22,21,5,1,'#152132');
    else rect(c,22,22,5,1,light);
    if (!stone) {
        c.save();
        c.translate(34,31);
        c.rotate(hero ? 0.65 : skeleton ? 0.2 : 0.62);
        if (skeleton) {
            poly(c,edge,[-6,-14,0,-11,5,-4,5,4,0,12,-6,14,0,7,2,2,2,-3,0,-8]);
            rect(c,-5,-13,1,27,'#c9a6ed');
        } else {
            poly(c,'#181522',[-5,3,-5,-15,0,-23,5,-15,5,3,8,5,6,8,2,8,2,15,-2,15,-2,8,-7,8,-8,5]);
            poly(c,edge,[-3,3,-3,-15,0,-20,3,-15,3,3]);
            rect(c,0,-15,1,17,hero ? '#fff8d8' : '#ffe1b6');
            rect(c,-6,4,12,2,light);
            rect(c,-1,6,2,7,'#8a644b');
        }
        c.restore();
    }
    if (abyss) {
        poly(c,'#d3685b',[9,24,6,28,1,44,5,45,13,31,15,29]);
        poly(c,'#ffd094',[8,29,3,43,5,42,12,29]);
    }
}

function icon(c: Ctx, id: string, color: string): void {
    const dark = '#241e2f', shine = '#fff1d4';
    if (id === 'guard' || id === 'riposte' || id === 'bulwark') {
        poly(c,dark,[4,4,12,1,20,4,21,13,16,21,12,24,8,21,3,13]);
        poly(c,color,[5,5,12,3,19,5,19,13,15,19,12,21,8,18,5,13]);
        poly(c,'#70877f',[12,6,17,7,17,13,14,17,12,18]);
        rect(c,8,7,2,6,shine);
    } else if (id === 'fire' || id === 'campfire') {
        poly(c,'#a34a46',[3,18,5,11,8,13,8,7,15,0,15,7,20,5,21,14,18,22,10,24,5,22]);
        poly(c,color,[6,18,8,14,11,15,11,9,15,5,15,12,19,9,19,16,15,21,9,21]);
        poly(c,shine,[9,18,13,12,13,16,16,15,14,20,10,20]);
        if (id === 'campfire') rect(c,4,22,16,2,'#bc7c61');
    } else if (id === 'heart' || id === 'frost' || id === 'cursed') {
        poly(c,dark,[12,0,21,6,22,14,12,24,2,14,3,6]);
        poly(c,color,[12,2,19,7,20,13,12,21,4,13,5,7]);
        poly(c,shine,[12,2,12,9,6,13,5,7]);
        poly(c,id === 'frost' ? '#3894b0' : '#754077',[12,9,19,7,20,13,12,21]);
        if (id === 'cursed') rect(c,10,7,3,9,shine);
    } else if (id === 'wind') {
        poly(c,color,[2,9,13,3,21,5,23,10,19,14,8,14,13,11,19,11,20,8,16,6,7,11]);
        poly(c,shine,[3,17,15,15,21,17,20,20,11,21,15,19,19,19,18,17]);
    } else if (id === 'earth') {
        poly(c,dark,[2,9,8,3,17,3,22,9,20,19,13,24,4,20]);
        poly(c,color,[4,10,9,5,16,5,20,10,18,18,13,21,6,18]);
        poly(c,shine,[7,9,10,6,13,6,10,12]);
    } else if (id === 'storm') {
        poly(c,color,[13,0,4,13,10,13,7,24,21,9,14,9,18,0]);
        poly(c,shine,[12,3,7,11,12,11,10,18,18,10,13,10,16,3]);
    } else if (id === 'echo' || id === 'spark') {
        poly(c,color,[8,1,10,7,17,9,11,12,8,19,6,12,0,10,6,7]);
        poly(c,color,[19,10,20,15,24,17,20,19,18,24,17,19,12,17,17,15]);
        rect(c,7,8,3,3,shine);
    } else if (id === 'monster') {
        poly(c,color,[5,4,19,4,22,9,21,17,17,18,17,22,7,22,7,18,3,16,2,9]);
        rect(c,6,10,4,4,dark); rect(c,14,10,4,4,dark); rect(c,11,16,2,3,dark);
        rect(c,9,20,1,2,dark); rect(c,14,20,1,2,dark);
    } else if (id === 'boss') {
        poly(c,color,[2,5,7,10,12,3,17,10,22,5,20,19,4,19]);
        rect(c,4,20,16,2,'#a26a4b'); rect(c,11,11,2,4,shine);
    } else if (id === 'treasure' || id === 'shop') {
        poly(c,'#663c39',[1,8,4,4,20,4,23,8,23,21,1,21]);
        rect(c,1,8,22,4,color); rect(c,4,5,16,2,'#c88a54'); rect(c,2,14,20,4,'#91604a');
        rect(c,10,11,5,6,color); rect(c,12,13,1,2,dark);
    } else {
        if (id === 'slash') poly(c,color,[2,5,4,14,11,18,17,15,22,8,22,15,18,21,10,23,4,19,1,13]);
        else poly(c,color,[1,12,13,8,6,15,1,17,11,14,5,20,1,21]);
        poly(c,shine,[7,16,15,5,23,1,21,8,11,18]);
        poly(c,'#947577',[11,16,21,7,23,1,22,9,12,19]);
        poly(c,'#e8b47c',[6,14,13,19,12,21,4,16]);
        poly(c,'#aa725f',[6,16,9,19,4,24,2,22]);
    }
}

function frame(c: Ctx, w: number, h: number, inside: string, border: string): void {
    poly(c,'#0c0b14',[0,10,10,0,w-10,0,w,10,w,h-10,w-10,h,10,h,0,h-10]);
    poly(c,border,[2,11,11,2,w-11,2,w-2,11,w-2,h-11,w-11,h-2,11,h-2,2,h-11]);
    poly(c,inside,[5,13,13,5,w-13,5,w-5,13,w-5,h-13,w-13,h-5,13,h-5,5,h-13]);
    rect(c,13,6,w-26,2,border+'88');
    rect(c,9,h-11,w-18,2,'#0e0d17');
}

export function paintArt(): void {
    for (const [index, layer] of PALETTE.entries()) {
        game.paint('dungeon-'+(index+1),720,1280,c => {
            c.scale(2,2);
            masonry(c,360,640,layer,17);
            for (const x of [36,106,180,254,324]) {
                arch(c,x,91,x===180?110:62,230,layer);
                lamp(c,x,278,layer.glow);
            }
            const shade = c.createLinearGradient(0,0,0,640);
            shade.addColorStop(0,'#100f1cca'); shade.addColorStop(0.4,'#18132370');
            shade.addColorStop(0.67,'#100e1ac0'); shade.addColorStop(1,'#100e1a');
            c.fillStyle = shade; c.fillRect(0,0,360,640);
        });
        game.paint('arena-'+(index+1),684,574,c => {
            c.scale(2,2);
            frame(c,342,287,layer.shadow,layer.trim);
            c.save();
            c.beginPath(); c.rect(12,13,318,260); c.clip();
            masonry(c,342,284,layer,26);
            for(const x of [16,326]) for(const y of [13,263]) lamp(c,x,y,layer.glow);
            for(const x of [49,293]) {
                poly(c,'#14121d',[x-16,137,x-8,126,x+10,126,x+17,136,x+17,150,x-16,150]);
                poly(c,layer.trim,[x-13,132,x-7,125,x+8,125,x+13,132,x+13,146,x-13,146]);
                poly(c,layer.shadow,[x-9,135,x-5,131,x+5,131,x+9,135,x+9,145,x-9,145]);
                rect(c,x-6,128,12,2,layer.light);
            }
            c.restore();
        });
    }
    game.paint('gate',124,56,(c,i) => {
        c.scale(2,2);
        arch(c,31,-14,62,41,PALETTE[0]);
        if (i===1) rect(c,11,13,40,13,'#e9b779');
    },{ frames: 2 });
    for (const id of ['player','archer','gargoyle','knight','lich','overlord']) {
        game.paint(id,144,144,c => { c.scale(3,3); armor(c,id); });
    }
    game.paint('slime',144,144,c => {
        c.scale(3,3);
        poly(c,'#192529',[4,37,8,24,14,18,22,13,31,15,36,22,42,30,44,39,37,43,12,43]);
        poly(c,'#286455',[7,36,11,25,18,19,24,16,32,19,37,27,41,34,39,39,34,41,13,41]);
        poly(c,'#4fa780',[10,31,15,24,22,19,26,19,33,24,30,32,34,35,26,40,14,38]);
        poly(c,'#b5e992',[19,27,22,24,28,24,31,29,28,35,21,36,18,32]);
        rect(c,21,25,5,3,'#eff7b8'); rect(c,12,26,3,3,'#86cda0'); rect(c,32,35,4,2,'#86cda0');
    });
    const mapColors = { shop:'#a8d7b3', monster: '#e88987', cursed: '#d695f4', treasure: '#f7c076', campfire: '#fead7e', boss: '#f0c676', heart: '#ff777a', spark: '#f4d487' };
    for (const [id,color] of Object.entries(mapColors)) game.paint('icon-'+id,72,72,c => {c.scale(3,3);icon(c,id,color);});
    for (const [id,card] of Object.entries(CARDS)) {
        game.paint('icon-'+id,72,72,c => {c.scale(3,3);icon(c,id,card.color);});
        game.paint('card-'+id,120,146,c => {
            frame(c,120,146,'#211c2e',RARITY_COLORS[cardRarity(id as Card)]);
            const rarity=cardRarity(id as Card), accent=RARITY_COLORS[rarity];
            rect(c,14,13,92,2,accent+'88');
            if (rarity!=='Common') { rect(c,8,22,3,15,accent); rect(c,109,22,3,15,accent); }
            if (['Rare','Epic','Mythical','Legendary','Cursed'].includes(rarity)) { poly(c,accent,[60,5,65,10,60,15,55,10]); }
            if (['Epic','Mythical','Legendary'].includes(rarity)) { rect(c,18,126,22,2,accent); rect(c,80,126,22,2,accent); }
            if (rarity==='Legendary') { rect(c,16,17,88,2,accent); rect(c,20,130,80,2,accent); }
            if (rarity==='Mythical') { rect(c,14,20,32,2,'#9be7ff'); rect(c,75,123,30,2,'#ffc0f4'); }
            if (rarity==='Cursed') { poly(c,'#8a1835',[6,34,14,27,10,43,19,37,8,58]); poly(c,'#8a1835',[114,65,105,75,110,80,102,93,114,88]); }
            rect(c,13,37,94,65,'#100e1b');
            rect(c,13,99,94,2,card.color+'77');
        });
    }
    game.paint('slot',148,114,c => frame(c,148,114,'#1c1928','#574b55'));
    game.paint('slot-lit',148,114,c => frame(c,148,114,'#282231','#e0af76'));
    game.paint('panel',656,266,c => frame(c,656,266,'#171522','#62505a'));
    game.paint('node',136,108,(c,i) => frame(c,136,108,i ? '#2e2433' : '#191824',i ? '#d2aa74' : '#594b56'),{ frames: 2 });
    game.paint('button',340,68,(c,i) => frame(c,340,68,i ? '#825539' : '#573d36',i ? '#ffe4a4' : '#d3a675'),{ frames: 2 });
    game.paint('button-small',150,64,(c,i) => frame(c,150,64,i ? '#5d495f' : '#292439',i ? '#efca9c' : '#705b72'),{ frames: 2 });
    game.paint('brazier',152,152,(c,i) => { c.scale(2,2); lamp(c,38,40,'#ffab65',i*2); },{ frames: 3 });
}

export function defineSounds(): void {
    game.sound.defineAll({
        wind: { type:'noise',duration:0.12,volume:0.18 },
        earth: { type:'triangle',freq:130,freqEnd:70,duration:0.17,volume:0.22 },
        sovereign: { type:'noise',duration:0.2,volume:0.25 },
        immolate: { type:'sawtooth',freq:220,freqEnd:80,duration:0.18,volume:0.2 },
        bulwark: { type:'triangle',notes:[400,700,900],duration:0.22,volume:0.2 },
        select: { type: 'triangle', freq: 520, freqEnd: 660, duration: 0.075, volume: 0.22 },
        draw: { type: 'triangle', notes: [360,540,650], duration: 0.14, volume: 0.23 },
        shuffle: { type: 'noise', duration: 0.16, volume: 0.19 },
        ready: { type: 'square', notes: [265,530], duration: 0.2, volume: 0.13 },
        slash: { type: 'noise', duration: 0.14, filter: { type: 'lowpass', freq: 3800, freqEnd: 320 }, volume: 0.35 },
        dodge: { type:'triangle',freq:420,freqEnd:700,duration:0.12,volume:0.2 },
        riposte: { type:'square',freq:280,freqEnd:560,duration:0.13,volume:0.16 },
        cleave: { type:'noise', duration:0.2, filter:{ type:'lowpass', freq:2400, freqEnd:250 }, volume:0.35 },
        dash: { type: 'sawtooth', freq: 560, freqEnd: 100, duration: 0.13, volume: 0.22 },
        guard: { type: 'triangle', notes: [390,780,580], duration: 0.28, volume: 0.3 },
        frost: { type: 'triangle', freq: 645, freqEnd: 1070, duration: 0.18, volume: 0.26 },
        fire: { type: 'sawtooth', freq: 210, freqEnd: 73, duration: 0.21, volume: 0.24 },
        storm: { type:'square', notes:[440,880,660], duration:0.18, volume:0.18 },
        echo: { type: 'square', notes: [340,680,510,1020], duration: 0.32, volume: 0.12 },
        critical: { type:'square', notes:[330,660,990], duration:0.16, volume:0.16 },
        hit: { type: 'triangle', freq: 174, freqEnd: 72, duration: 0.13, volume: 0.42 },
        ouch: { type: 'square', freq: 154, freqEnd: 63, duration: 0.21, volume: 0.23 },
        enemy: { type: 'noise', duration: 0.27, filter: { type: 'lowpass', freq: 900, freqEnd: 160 }, volume: 0.25 },
        steam: { type: 'noise', duration: 0.38, filter: { type: 'lowpass', freq: 2100, freqEnd: 430 }, volume: 0.43 },
        vanish: { type: 'triangle', freq: 290, freqEnd: 65, duration: 0.2, volume: 0.29 },
        gate: { type: 'triangle', freq: 90, freqEnd: 42, duration: 0.26, volume: 0.36 },
        clear: { type: 'triangle', notes: [260,330,392,520], duration: 0.45, volume: 0.26 },
    });
}
