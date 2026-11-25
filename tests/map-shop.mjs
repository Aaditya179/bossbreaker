import {strict as assert} from 'node:assert';
import {chromium} from '../phaser/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:720,height:1280}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4173/');await page.waitForFunction(()=>window.game?.isReady && game.scenes.current==='title');
 const box=await page.locator('canvas').first().boundingBox();const tap=async(x,y)=>{await page.mouse.click(box.x+box.width*x/720,box.y+box.height*y/1280);await page.waitForTimeout(180)};
 await tap(360,1055);await page.waitForFunction(()=>game.scenes.current==='map');await page.waitForTimeout(400);
 const shop=await page.evaluate(()=>game.inspect().objects.find(o=>o.id?.startsWith('map-shop-2')));assert.ok(shop);const lane=shop.x;
 const clearRoom=async()=>{await page.waitForFunction(()=>game.scenes.current==='play');await page.waitForTimeout(300);await page.evaluate(()=>game.cheats.run('win-room'));await page.waitForTimeout(1050);await tap(360,1238);await page.waitForFunction(()=>game.scenes.current==='reward');await page.waitForTimeout(300);await tap(360,820);await tap(360,820);await page.waitForFunction(()=>game.scenes.current==='map');await page.waitForTimeout(300)};
 await tap(360,934);await clearRoom();await tap(lane,778);await clearRoom();
 await tap(lane,622);await page.waitForFunction(()=>game.scenes.current==='shop');await page.waitForTimeout(300);
 const state=await page.evaluate(()=>game.inspect().state.run);assert.equal(state.path.length,2);assert.equal(state.room,'shop');
 await tap(360,1138);await page.waitForFunction(()=>game.scenes.current==='map');const after=await page.evaluate(()=>game.inspect().state.run);assert.equal(after.path.length,3);assert.deepEqual(errors,[]);console.log('PASS actual map path opens and completes shop node');
} finally {await browser.close();}
