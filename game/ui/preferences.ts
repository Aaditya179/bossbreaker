import { game } from '../engine.js';
export const preferences = {
    reducedMotion: game.save.read('bossbreaker.reducedMotion',false),
    fast: game.save.read('bossbreaker.fastCombat',false),
    haptics: game.save.read('bossbreaker.haptics',false),
    shake: game.save.read('bossbreaker.shake',1),
    sfxVolume: game.save.read('bossbreaker.sfxVolume',1),
};
export function savePreferences(): void {
    game.save.write('bossbreaker.reducedMotion',preferences.reducedMotion);
    game.save.write('bossbreaker.fastCombat',preferences.fast);
    game.save.write('bossbreaker.haptics',preferences.haptics);
    game.save.write('bossbreaker.shake',preferences.shake);
    game.save.write('bossbreaker.sfxVolume',preferences.sfxVolume);
    game.sound.volume('sfx',preferences.sfxVolume);
}

export function tapHaptic(): void {
    if (!preferences.haptics) return;
    try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(8); } catch { /* Browser does not support vibration. */ }
}
