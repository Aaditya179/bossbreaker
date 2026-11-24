import { strict as assert } from 'node:assert';
import { chromium } from '../phaser/node_modules/playwright/index.mjs';

const browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
try {
    for (const width of [320, 375, 430]) {
        const page = await browser.newPage({
            viewport: { width, height: Math.round(width * 2.12) },
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 1,
        });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://localhost:4173/', { waitUntil:'domcontentloaded' });
        await page.waitForFunction(() => window.game?.scenes?.current === 'title' && window.game.isReady);
        await page.waitForTimeout(350);
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1);
        async function tap(x, y) {
            await page.touchscreen.tap(box.x + box.width * x / 720, box.y + box.height * y / 1280);
            await page.waitForTimeout(100);
        }
        async function state() {
            return page.evaluate(() => window.game.inspect().state.battle);
        }
        await tap(360,1055);
        await page.waitForFunction(() => window.game.scenes.current === 'map');
        await page.waitForTimeout(350);
        await tap(360,934);
        await page.waitForFunction(() => window.game.scenes.current === 'play');
        await page.waitForTimeout(350);
        assert.equal((await state()).hand.length,5);
        await tap(92,1071);
        await tap(226,1071);
        await tap(226,1071);
        await tap(360,1071);
        await tap(494,1071);
        const texts = await page.evaluate(() => window.game.inspect().objects.map(o => o.text).filter(Boolean));
        assert.ok(JSON.stringify(texts).includes('SELECTED 3'), 'selection count after deselection');
        await tap(540,1165);
        let battle = await state();
        assert.equal(battle.pips,2);
        assert.equal(battle.hand.length,5);
        assert.equal(battle.draw.length,6);
        assert.equal(battle.spent.length,3);
        const first = battle.handIds[0], second = battle.handIds[1];
        await tap(92,1071);
        await tap(226,1071);
        await tap(180,1165);
        battle = await state();
        assert.deepEqual(battle.queue,[first,second]);
        await tap(92,906);
        await tap(226,906);
        assert.deepEqual((await state()).queue,[second,first]);
        const hero = (await state()).hero;
        await tap(360,1238);
        await tap(470,450);
        await page.waitForFunction(() => {
            const battle = window.game.inspect().state.battle;
            return battle.turn > 1 || battle.phase === 'clear';
        }, null, { timeout:10000 });
        battle = await state();
        assert.deepEqual(battle.hero,hero);
        assert.equal(battle.pips,2);
        assert.equal(errors.length,0,errors.join('\n'));
        await page.screenshot({ path:'/tmp/bossbreaker-mobile-'+width+'.png' });
        console.log('PASS ' + width + 'px touch selection, redraw, reorder, automatic turn and fixed hero');
        await page.close();
    }
} finally {
    await browser.close();
}
